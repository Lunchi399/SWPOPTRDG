from rest_framework.decorators import api_view, permission_classes
from decimal import Decimal, ROUND_HALF_UP
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from api.backends import UsuarioBackend
from django.db import transaction

from .models import (Usuario, Producto, Mesas, Pedido,
                    DetallePedido, Pago, DetallePago,
                    DatosFactura, Reclamo, TurnoDia, Insumo, PedidoInsumo, DetallePedidoInsumo,
                    MovimientoInsumo, Receta, DetalleReceta,
                    NotificacionReceta, Merma)
from .serializers import (UsuarioSerializer, CrearUsuarioSerializer,
                           EditarUsuarioSerializer, ProductoSerializer,
                           MesaSerializer, PedidoSerializer,
                           PagoSerializer, ReclamoSerializer,  TurnoDiaSerializer, InsumoSerializer,
                        PedidoInsumoSerializer, DetallePedidoInsumoSerializer,
                        MovimientoInsumoSerializer, RecetaSerializer,
                        DetalleRecetaSerializer, NotificacionRecetaSerializer,
                        MermaSerializer)
from .permissions import EsAdministrador, EsMesero, EsCocinero, EsCajero
from django.utils.dateparse import parse_date


# ══════════════════════════════════════════════════════════════
# PAQUETE 1 — Autenticación
# ══════════════════════════════════════════════════════════════
def filtrar_por_fechas(qs, request, campo, defecto='hoy'):
    """
    ?todo=true                 -> historial completo
    ?desde=YYYY-MM-DD&hasta=.. -> rango
    sin parámetros             -> hoy (defecto='hoy') o todo (defecto='todo')
    """
    p = request.query_params
    if p.get('todo') == 'true':
        return qs
    desde = parse_date(p.get('desde') or '')
    hasta = parse_date(p.get('hasta') or '')
    if desde or hasta:
        if desde:
            qs = qs.filter(**{f'{campo}__date__gte': desde})
        if hasta:
            qs = qs.filter(**{f'{campo}__date__lte': hasta})
        return qs
    if defecto == 'hoy':
        return qs.filter(**{f'{campo}__date': timezone.localdate()})
    return qs
# CU01 — Iniciar sesión
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Usuario y contraseña son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Usar nuestro backend personalizado
    backend  = UsuarioBackend()
    usuario  = backend.authenticate(request, username=username,
                                    password=password)

    if not usuario:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usuario.Activo:
        return Response(
            {'error': 'Usuario desactivado'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generar token JWT
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(usuario)

    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'usuario': UsuarioSerializer(usuario).data
    }, status=status.HTTP_200_OK)

# CU02 — Cerrar sesión
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'mensaje': 'Sesión cerrada correctamente'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Token inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ══════════════════════════════════════════════════════════════
# PAQUETE 2 — Administración
# ══════════════════════════════════════════════════════════════

# CU03 — Listar y crear usuarios
@api_view(['GET', 'POST'])
@permission_classes([EsAdministrador])
def usuarios(request):
    if request.method == 'GET':
        lista = Usuario.objects.all().order_by('Rol', 'username')
        return Response(UsuarioSerializer(lista, many=True).data)

    if request.method == 'POST':
        serializer = CrearUsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'mensaje': 'Usuario creado correctamente'},
                status=status.HTTP_201_CREATED
            )
        # Muestra el error exacto
        print('Errores:', serializer.errors)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)


# CU03 — Editar y eliminar usuario
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([EsAdministrador])
def usuario_detalle(request, pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UsuarioSerializer(usuario).data)

    if request.method == 'PUT':
        if usuario.pk == request.user.pk:
            return Response(
                {'error': 'No puedes editarte a ti mismo desde aquí'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = EditarUsuarioSerializer(
            usuario, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(UsuarioSerializer(usuario).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        if usuario.pk == request.user.pk:
            return Response(
                {'error': 'No puedes eliminarte a ti mismo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        usuario.delete()
        return Response({'mensaje': 'Usuario eliminado correctamente'})


# CU04 — Listar y crear productos
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def productos(request):
    if request.method == 'GET':
        categoria  = request.query_params.get('categoria')
        disponible = request.query_params.get('disponible')
        qs = Producto.objects.all()
        if categoria:
            qs = qs.filter(categoria=categoria)
        if disponible is not None:
            qs = qs.filter(disponible=disponible == 'true')
        return Response(ProductoSerializer(qs, many=True).data)

    if request.method == 'POST':
        if request.user.Rol != 'administrador':
            return Response({'error': 'Solo el administrador puede agregar productos'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = ProductoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# CU04 — Editar, eliminar y toggle disponibilidad de producto
@api_view(['GET', 'PUT', 'DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def producto_detalle(request, pk):
    try:
        producto = Producto.objects.get(pk=pk)
    except Producto.DoesNotExist:
        return Response({'error': 'Producto no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductoSerializer(producto).data)

    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ProductoSerializer(
            producto, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(ProductoSerializer(producto).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PATCH':
        producto.disponible = not producto.disponible
        producto.save()
        return Response({
            'mensaje':    f"Producto {'habilitado' if producto.disponible else 'deshabilitado'}",
            'disponible': producto.disponible
        })

    if request.method == 'DELETE':
        producto.delete()
        return Response({'mensaje': 'Producto eliminado'})


# CU05 — Listar y crear mesas
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mesas(request):
    if request.method == 'GET':
        qs = Mesas.objects.all()
        return Response(MesaSerializer(qs, many=True).data)

    if request.method == 'POST':
        if request.user.Rol != 'administrador':
            return Response({'error': 'Sin permisos'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = MesaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# CU05 — Editar y desactivar mesa
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def mesa_detalle(request, pk):
    try:
        mesa = Pago.objects.get(pk=pk)
    except Pago.DoesNotExist:
        return Response({'error': 'Mesa no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MesaSerializer(mesa).data)

    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = MesaSerializer(mesa, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(MesaSerializer(mesa).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        if mesa.estado == 'ocupada':
            return Response(
                {'error': 'No se puede eliminar una mesa ocupada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        mesa.delete()
        return Response({'mensaje': f'Mesa {mesa.identificador_mesa} eliminada'})


# CU06 — Dashboard resumen del día
@api_view(['GET'])
@permission_classes([EsAdministrador])
def dashboard(request):
    resumen = {
        'fecha': str(timezone.now().date()),
        'usuarios': {
            'total':           Usuario.objects.count(),
            'administradores': Usuario.objects.filter(Rol='administrador').count(),
            'meseros':         Usuario.objects.filter(Rol='mesero').count(),
            'cocineros':       Usuario.objects.filter(Rol='cocinero').count(),
            'cajeros':         Usuario.objects.filter(Rol='cajero').count(),
        },
        'productos': {
            'total':       Producto.objects.count(),
            'disponibles': Producto.objects.filter(disponible=True).count(),
            'por_categoria': {
                'entradas': Producto.objects.filter(categoria='entrada').count(),
                'segundos': Producto.objects.filter(categoria='segundo').count(),
                'bebidas':  Producto.objects.filter(categoria='bebida').count(),
            }
        },
        'mesas': {
            'total':    Mesas.objects.count(),
            'libres':   Mesas.objects.filter(estado='libre').count(),
            'ocupadas': Mesas.objects.filter(estado='ocupada').count(),
        },
        'pedidos': {
            'total':       Pedido.objects.count(),
            'en_cocina':   Pedido.objects.filter(estado='en_cocina').count(),
            'listos':      Pedido.objects.filter(estado='listo').count(),
            'despachados': Pedido.objects.filter(estado='despachado').count(),
        },
        'pagos': {
            'total_hoy': Pago.objects.filter(
                fecha_cobro__date=timezone.now().date()
            ).count(),
        },
        'reclamos': {
            'pendientes': Reclamo.objects.filter(estado='pendiente').count(),
        }
    }
    return Response(resumen)

# ══════════════════════════════════════════════════════════════
# PAQUETE 3 — Mesero
# ══════════════════════════════════════════════════════════════

# CU07 — Unir mesas
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unir_mesas(request):
    mesa_id      = request.data.get('mesa_id')
    mesa_unir_id = request.data.get('mesa_unir_id')

    try:
        mesa1 = Mesas.objects.get(pk=mesa_id)
        mesa2 = Mesas.objects.get(pk=mesa_unir_id)
    except Mesas.DoesNotExist:
        return Response({'error': 'Mesa no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)

    if mesa1.estado == 'ocupada' and mesa2.estado == 'ocupada':
        return Response(
            {'error': 'No se pueden unir dos mesas con pedidos activos distintos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    mesa2.estado = 'unida'
    mesa2.save()
    mesa1.estado = 'ocupada'
    mesa1.save()

    return Response({
        'mensaje':       f'Mesa {mesa1.identificador_mesa} y '
                         f'Mesa {mesa2.identificador_mesa} unidas',
        'mesa_principal': MesaSerializer(mesa1).data,
        'mesa_unida':     MesaSerializer(mesa2).data,
    })


# CU07 — Desunir mesa
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def desunir_mesa(request, pk):
    try:
        mesa = Mesas.objects.get(pk=pk)
    except Mesas.DoesNotExist:
        return Response({'error': 'Mesa no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)

    if mesa.estado != 'unida':
        return Response({'error': 'Esta mesa no está unida'},
                        status=status.HTTP_400_BAD_REQUEST)

    mesa.estado = 'libre'
    mesa.save()
    return Response({'mensaje': f'Mesa {mesa.identificador_mesa} separada'})


# CU08 — Listar y crear pedidos
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pedidos(request):
    if request.method == 'GET':
        rol = request.user.Rol
        if rol == 'mesero':
            qs = Pedido.objects.filter(
                id_usuario=request.user
            ).exclude(estado__in=['pagado', 'cancelado'])
        elif rol in ('cocinero', 'administrador'):
            qs = Pedido.objects.exclude(
                estado__in=['pagado', 'cancelado']
            )
        elif rol == 'cajero':
            qs = Pedido.objects.filter(
                estado__in=['despachado', 'pagado']
            )
        else:
            qs = Pedido.objects.none()
        return Response(PedidoSerializer(qs, many=True).data)

    if request.method == 'POST':
        mesa_id = request.data.get('id_mesa')
        try:
            mesa = Mesas.objects.get(pk=mesa_id)
        except Mesas.DoesNotExist:
            return Response({'error': 'Mesa no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)

        if mesa.estado == 'ocupada':
            return Response({'error': 'La mesa ya tiene un pedido activo'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Crear pedido directamente en confirmado
        pedido = Pedido.objects.create(
            estado        = 'confirmado',   # ← sin borrador
            observaciones = request.data.get('observaciones', ''),
            id_mesa       = mesa,
            id_usuario    = request.user,
        )

        for d in request.data.get('detalles', []):
            try:
                producto = Producto.objects.get(pk=d['id_producto'])
                DetallePedido.objects.create(
                    id_pedido       = pedido,
                    id_producto     = producto,
                    cantidad        = d.get('cantidad', 1),
                    precio_unitario = producto.precio,
                )
            except Producto.DoesNotExist:
                pass

        mesa.estado = 'ocupada'
        mesa.save()

        return Response(
            PedidoSerializer(pedido).data,
            status=status.HTTP_201_CREATED
        )

# CU08/CU09/CU10 — Ver, editar, confirmar, despachar y cancelar pedido
# Vista para que el cocinero cambie estados
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cambiar_estado_pedido(request, pk):
    try:
        pedido = Pedido.objects.get(pk=pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    accion = request.data.get('accion')

    # Obtener rol de forma segura
    try:
        rol = request.user.Rol
    except Exception:
        return Response({'error': 'No se pudo identificar el rol del usuario'},
                        status=status.HTTP_403_FORBIDDEN)

    TRANSICIONES = {
        'en_cocina': ('confirmado',  'en_cocina',  ['cocinero', 'administrador']),
        'listo':     ('en_cocina',   'listo',      ['cocinero', 'administrador']),
        'despachar': ('listo',       'despachado', ['mesero',   'administrador']),
        'cancelar':  (None,          'cancelado',  ['mesero',   'administrador']),
    }

    if accion not in TRANSICIONES:
        return Response({'error': f'Acción no válida: {accion}'},
                        status=status.HTTP_400_BAD_REQUEST)

    estado_requerido, estado_nuevo, roles_permitidos = TRANSICIONES[accion]

    if rol not in roles_permitidos:
        return Response(
            {'error': f'Tu rol "{rol}" no puede ejecutar la acción "{accion}"'},
            status=status.HTTP_403_FORBIDDEN
        )

    if estado_requerido and pedido.estado != estado_requerido:
        return Response(
            {'error': f'El pedido está en "{pedido.estado}" '
                      f'pero debe estar en "{estado_requerido}"'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if accion == 'cancelar' and pedido.estado in (
        'en_cocina', 'listo', 'despachado', 'pagado'
    ):
        return Response(
            {'error': 'No se puede cancelar: solicita anulación al administrador'},
            status=status.HTTP_400_BAD_REQUEST
        )

    pedido.estado = estado_nuevo
    pedido.save()

    if accion == 'cancelar' and pedido.id_mesa:
        pedido.id_mesa.estado = 'libre'
        pedido.id_mesa.save()

    return Response({
        'mensaje': f'Estado actualizado a: {estado_nuevo}',
        'pedido':  PedidoSerializer(pedido).data
    })

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def pedido_detalle(request, pk):
    try:
        pedido = Pedido.objects.get(pk=pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    # GET — previsualizar pedido
    if request.method == 'GET':
        return Response(PedidoSerializer(pedido).data)

    # PUT — editar pedido en borrador
    if request.method == 'PUT':
        if pedido.estado != 'borrador':
            return Response(
                {'error': 'Solo se puede editar un pedido en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pedido.observaciones = request.data.get(
            'observaciones', pedido.observaciones
        )
        pedido.save()

        if 'detalles' in request.data:
            pedido.detalles.all().delete()
            for d in request.data['detalles']:
                try:
                    producto = Producto.objects.get(pk=d['id_producto'])
                    DetallePedido.objects.create(
                        id_pedido       = pedido,
                        id_producto     = producto,
                        cantidad        = d.get('cantidad', 1),
                        precio_unitario = producto.precio,
                    )
                except Producto.DoesNotExist:
                    pass

        return Response(PedidoSerializer(pedido).data)

    # PATCH — cambiar estado
    if request.method == 'PATCH':
        accion = request.data.get('accion')

        # Confirmar → en_cocina
        if accion == 'confirmar':
            if pedido.estado != 'borrador':
                return Response({'error': 'El pedido ya fue confirmado'},
                                status=status.HTTP_400_BAD_REQUEST)
            pedido.estado = 'confirmado'
            pedido.save()
            return Response({
                'mensaje': 'Pedido confirmado y enviado a cocina',
                'pedido':  PedidoSerializer(pedido).data
            })

        # Cocina lo recibe
        if accion == 'en_cocina':
            if pedido.estado != 'confirmado':
                return Response({'error': 'El pedido no está confirmado'},
                                status=status.HTTP_400_BAD_REQUEST)
            pedido.estado = 'en_cocina'
            pedido.save()
            return Response({
                'mensaje': 'Pedido en preparación',
                'pedido':  PedidoSerializer(pedido).data
            })

        # Cocina lo marca listo
        if accion == 'listo':
            if pedido.estado != 'en_cocina':
                return Response({'error': 'El pedido no está en cocina'},
                                status=status.HTTP_400_BAD_REQUEST)
            pedido.estado = 'listo'
            pedido.save()
            return Response({
                'mensaje': 'Pedido listo para despachar',
                'pedido':  PedidoSerializer(pedido).data
            })

        # Mesero despacha
        if accion == 'despachar':
            if pedido.estado != 'listo':
                return Response(
                    {'error': 'El pedido aún no está listo'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            pedido.estado               = 'despachado'
            pedido.tiempo_finalizacion  = timezone.now()
            pedido.save()
            return Response({
                'mensaje': 'Pedido despachado al cliente',
                'pedido':  PedidoSerializer(pedido).data
            })

        return Response({'error': 'Acción no válida'},
                        status=status.HTTP_400_BAD_REQUEST)

    # DELETE — cancelar pedido
    if request.method == 'DELETE':
        if pedido.estado in ('en_cocina', 'listo', 'despachado', 'pagado'):
            return Response(
                {'error': 'No se puede cancelar: el pedido ya está en producción. '
                          'Solicita anulación al administrador.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pedido.estado = 'cancelado'
        pedido.save()

        if pedido.id_mesa:
            pedido.id_mesa.estado = 'libre'
            pedido.id_mesa.save()

        return Response({'mensaje': 'Pedido cancelado correctamente'})


# CU11 — Finalizar servicio de mesa
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalizar_servicio(request, pk):
    try:
        mesa = mesas.objects.get(pk=pk)
    except mesas.DoesNotExist:
        return Response({'error': 'Mesa no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)

    pedido_pagado = Pedido.objects.filter(
        id_mesa=mesa, estado='pagado'
    ).first()

    if not pedido_pagado:
        return Response(
            {'error': 'El pedido aún no ha sido pagado'},
            status=status.HTTP_400_BAD_REQUEST
        )

    mesa.estado = 'libre'
    mesa.save()
    return Response({
        'mensaje': f'Servicio de Mesa {mesa.identificador_mesa} finalizado'
    })


# CU11 — Registrar y listar reclamos
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reclamos(request):
    if request.method == 'GET':
        if request.user.Rol == 'administrador':
            qs = Reclamo.objects.all()
        else:
            qs = Reclamo.objects.filter(id_usuario=request.user)
        return Response(ReclamoSerializer(qs, many=True).data)

    if request.method == 'POST':
        serializer = ReclamoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(id_usuario=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# CU11 — Historial de pedidos
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_pedidos(request):
    if request.user.Rol == 'mesero':
        qs = Pedido.objects.filter(id_usuario=request.user)
    else:
        qs = Pedido.objects.all()
    return Response(PedidoSerializer(qs, many=True).data)
# ══════════════════════════════════════════════════════════════
# PAQUETE 4 — Cocina KDS
# ══════════════════════════════════════════════════════════════

# CU12 — Cola de pedidos para cocina
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cola_cocina(request):
    if request.user.Rol not in ('cocinero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    # Solo pedidos activos ordenados por tiempo de creación
    qs = Pedido.objects.filter(
        estado__in=['confirmado', 'en_cocina', 'listo']
    ).order_by('tiempo_creacion')

    return Response(PedidoSerializer(qs, many=True).data)


# CU13 — Historial de cocina del turno
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_cocina(request):
    if request.user.Rol not in ('cocinero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    qs = Pedido.objects.filter(
        estado__in=['listo', 'despachado', 'pagado', 'cancelado'])
    qs = filtrar_por_fechas(qs, request, 'tiempo_creacion')
    return Response(PedidoSerializer(
        qs.order_by('-tiempo_creacion')[:1000], many=True).data)    


# CU13 — Enviar alerta desde cocina
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def alerta_cocina(request):
    if request.user.Rol not in ('cocinero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    TIPO_ALERTA = {
        'demora':     'Demora en preparación',
        'insumos':    'Insumos insuficientes',
        'escasez':    'Escasez del plato',
        'otro':       'Otro',
    }

    tipo_alerta  = request.data.get('tipo_alerta', 'otro')
    id_pedido    = request.data.get('id_pedido')
    descripcion  = request.data.get('descripcion', '')

    if not descripcion:
        descripcion = TIPO_ALERTA.get(tipo_alerta, 'Alerta de cocina')

    try:
        pedido = Pedido.objects.get(pk=id_pedido)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    # Registrar como reclamo interno de cocina
    alerta = Reclamo.objects.create(
        tipo        = 'reclamo',
        descripcion = f'[COCINA - {TIPO_ALERTA.get(tipo_alerta, tipo_alerta)}] '
                      f'{descripcion}',
        estado      = 'pendiente',
        id_pedido   = pedido,
        id_usuario  = request.user,
    )

    return Response({
        'mensaje': 'Alerta enviada al administrador',
        'alerta':  ReclamoSerializer(alerta).data,
    }, status=status.HTTP_201_CREATED)

# ══════════════════════════════════════════════════════════════
# PAQUETE 5 — Caja
# ══════════════════════════════════════════════════════════════

# CU15 — Ver pedidos despachados por mesa
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pedidos_por_mesa(request):
    qs = Pedido.objects.filter(
        estado='despachado'
    ).select_related('id_mesa', 'id')
    return Response(PedidoSerializer(qs, many=True).data)


# CU15/CU16 — Registrar pago
# CU15 — Ver pedidos despachados listos para cobrar
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pedidos_por_cobrar(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    qs = Pedido.objects.filter(
        estado='despachado'
    ).select_related('id_mesa', 'id_usuario')

    return Response(PedidoSerializer(qs, many=True).data)

# CU15 — Calcular total del pedido
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calcular_total(request, pk):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)
 
    try:
        pedido = Pedido.objects.get(pk=pk)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)
 
    detalles = pedido.detalles.all()
 
    # Calcular subtotal usando solo Decimal
    subtotal = sum(
        Decimal(str(d.cantidad)) * d.id_producto.precio
        for d in detalles
        if d.id_producto
    )
 
    igv   = (subtotal * Decimal('0.18')).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
    total = (subtotal + igv).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
 
    return Response({
        'id_pedidos': pedido.id_pedidos,
        'mesa':       pedido.id_mesa.identificador_mesa
                      if pedido.id_mesa else '—',
        'subtotal':   str(subtotal),
        'igv':        str(igv),
        'total':      str(total),
        'detalles': [
            {
                'nombre':   d.id_producto.nombre,
                'cantidad': d.cantidad,
                'precio':   str(d.id_producto.precio),
                'subtotal': str(
                    Decimal(str(d.cantidad)) * d.id_producto.precio
                ),
            }
            for d in detalles if d.id_producto
        ]
    })
 
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_pago(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)
 
    id_pedidos       = request.data.get('id_pedidos')
    metodo_pago      = request.data.get('metodo_pago', 'efectivo')
    monto_recibido   = request.data.get('monto_recibido')
    tipo_comprobante = request.data.get('tipo_comprobante', 'boleta')
    datos_factura    = request.data.get('datos_factura', None)
 
    try:
        pedido = Pedido.objects.get(pk=id_pedidos)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)
 
    # ── Verificar que el pedido no fue pagado ya ──────────────
    if pedido.estado == 'pagado':
        return Response(
            {'error': 'Este pedido ya fue pagado anteriormente'},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # ── Verificar que no existe ya un pago para este pedido ───
    pago_existente = Pago.objects.filter(id_pedidos=pedido).first()
    if pago_existente:
        # Sincronizar el estado del pedido y liberar la mesa
        pedido.estado = 'pagado'
        pedido.save()
        if pedido.id_mesa:
            pedido.id_mesa.estado = 'libre'
            pedido.id_mesa.save()
        return Response(
            {'error': 'Este pedido ya tiene un pago registrado. '
                      'El estado del pedido ha sido sincronizado.'},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    if pedido.estado != 'despachado':
        return Response(
            {'error': f'El pedido está en estado "{pedido.estado}". '
                       'Solo se pueden cobrar pedidos despachados.'},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    # Calcular montos
    from decimal import Decimal, ROUND_HALF_UP
    detalles    = pedido.detalles.all()
    subtotal    = sum(
        Decimal(str(d.cantidad)) * d.id_producto.precio
        for d in detalles if d.id_producto
    )
    igv         = (subtotal * Decimal('0.18')).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP)
    monto_total = (subtotal + igv).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP)
 
    monto_recibido = Decimal(str(monto_recibido or monto_total))
    vuelto = (monto_recibido - monto_total).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP)
 
    if vuelto < Decimal('0'):
        return Response(
            {'error': f'Monto insuficiente. Total: S/. {monto_total}'},
            status=status.HTTP_400_BAD_REQUEST
        )
 
    if tipo_comprobante == 'factura':
        if not datos_factura:
            return Response(
                {'error': 'Se requieren datos de factura'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ruc = datos_factura.get('ruc', '').strip()
        if not ruc.isdigit() or len(ruc) != 11:
            return Response(
                {'error': 'El RUC debe tener exactamente 11 dígitos'},
                status=status.HTTP_400_BAD_REQUEST
            )
 
    # Crear pago con manejo de error de duplicado
    try:
        pago = Pago.objects.create(
            monto_total      = monto_total,
            monto_recibido   = monto_recibido,
            vuelto           = vuelto,
            metodo_pago      = metodo_pago,
            estado           = 'completado',
            tipo_comprobante = tipo_comprobante,
            id               = request.user,
            id_pedidos       = pedido,
        )
    except Exception as e:
        # Si hay duplicado por condición de carrera
        if 'duplicate key' in str(e).lower():
            pedido.estado = 'pagado'
            pedido.save()
            if pedido.id_mesa:
                pedido.id_mesa.estado = 'libre'
                pedido.id_mesa.save()
            return Response(
                {'error': 'El pago ya fue registrado. '
                          'El pedido ha sido marcado como pagado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'error': f'Error al registrar pago: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
 
    # Crear detalle del pago
    for d in detalles:
        if d.id_producto:
            subtotal_det = (
                Decimal(str(d.cantidad)) * d.id_producto.precio
            ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            DetallePago.objects.create(
                id_pago         = pago,
                nombre_producto = d.id_producto.nombre,
                cantidad        = d.cantidad,
                precio_unitario = d.id_producto.precio,
                subtotal        = subtotal_det,
            )
 
    # Crear datos de factura
    if tipo_comprobante == 'factura' and datos_factura:
        DatosFactura.objects.create(
            id_pago          = pago,
            ruc              = datos_factura.get('ruc', '').strip(),
            razon_social     = datos_factura.get('razon_social', ''),
            direccion_fiscal = datos_factura.get('direccion_fiscal', ''),
        )
 
    # Actualizar pedido y mesa
    pedido.estado = 'pagado'
    pedido.save()
 
    if pedido.id_mesa:
        pedido.id_mesa.estado = 'libre'
        pedido.id_mesa.save()
 
    return Response({
        'mensaje':        '\u2705 Pago registrado correctamente',
        'pago':           PagoSerializer(pago).data,
        'vuelto':         str(vuelto),
        'monto_total':    str(monto_total),
        'tipo_comprobante': tipo_comprobante,
    }, status=status.HTTP_201_CREATED)

# CU16 — Cuadre de caja
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cuadre_caja(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    hoy   = timezone.now().date()
    pagos = Pago.objects.filter(
        fecha_cobro__date=hoy,
        estado='completado'
    )

    # Totales por método de pago
    por_metodo = {}
    for metodo in ['efectivo', 'yape', 'plin', 'tarjeta']:
        total_metodo = sum(
            float(p.monto_total)
            for p in pagos
            if p.metodo_pago == metodo
        )
        por_metodo[metodo] = total_metodo

    # Totales por comprobante
    por_comprobante = {}
    for comp in ['boleta', 'factura', 'ninguno']:
        total_comp = sum(
            float(p.monto_total)
            for p in pagos
            if p.tipo_comprobante == comp
        )
        por_comprobante[comp] = total_comp

    resumen = {
        'fecha':               str(hoy),
        'total_ventas':        sum(float(p.monto_total) for p in pagos),
        'total_transacciones': pagos.count(),
        'total_vuelto':        sum(
                                 float(p.vuelto) for p in pagos
                                 if p.vuelto
                               ),
        'por_metodo':          por_metodo,
        'por_comprobante':     por_comprobante,
        'pagos':               PagoSerializer(pagos, many=True).data,
    }
    return Response(resumen)

@api_view(['PATCH'])
@permission_classes([EsAdministrador])
def reclamo_detalle(request, pk):
    try:
        reclamo = Reclamo.objects.get(pk=pk)
    except Reclamo.DoesNotExist:
        return Response({'error': 'Reclamo no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    nuevo_estado = request.data.get('estado')
    if nuevo_estado not in ('pendiente', 'revisado', 'resuelto'):
        return Response({'error': 'Estado no válido'},
                        status=status.HTTP_400_BAD_REQUEST)

    reclamo.estado = nuevo_estado
    reclamo.save()
    return Response(ReclamoSerializer(reclamo).data)
# CU28 — Historial de pagos del cajero
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_pagos(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    hoy   = timezone.now().date()
    pagos = filtrar_por_fechas(Pago.objects.all(), request, 'fecha_cobro')
    return Response(PagoSerializer(pagos[:1000], many=True).data)

# ══════════════════════════════════════════════════════════════
# CU-INV: Inicio y fin del día (RFN35, RFN47)
# ══════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def turno_dia(request):
    if request.method == 'GET':
        turno = TurnoDia.objects.filter(
            fecha=timezone.now().date()
        ).first()
        if not turno:
            return Response({'estado': 'sin_turno',
                             'mensaje': 'No hay turno abierto hoy'})
        return Response(TurnoDiaSerializer(turno).data)

    if request.method == 'POST':
        if request.user.Rol != 'administrador':
            return Response({'error': 'Sin permisos'},
                            status=status.HTTP_403_FORBIDDEN)

        hoy   = timezone.localdate()
        turno = TurnoDia.objects.filter(fecha=hoy).first()

        if turno and turno.estado == 'abierto':
            return Response({'error': 'Ya hay un turno abierto hoy'},
                            status=status.HTTP_400_BAD_REQUEST)

        if turno:                      # el día se cerró antes → se reabre
            turno.estado            = 'abierto'
            turno.hora_cierre       = None
            turno.id_usuario_cierre = None
            turno.save()
            return Response(TurnoDiaSerializer(turno).data)

        turno = TurnoDia.objects.create(
            fecha=hoy, estado='abierto', id_usuario_apertura=request.user)
        return Response(TurnoDiaSerializer(turno).data,
                        status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cerrar_turno(request, pk):
    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)
    try:
        turno = TurnoDia.objects.get(pk=pk)
    except TurnoDia.DoesNotExist:
        return Response({'error': 'Turno no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if turno.estado == 'cerrado':
        return Response({'error': 'El turno ya está cerrado'},
                        status=status.HTTP_400_BAD_REQUEST)

    turno.estado            = 'cerrado'
    turno.hora_cierre       = timezone.now()
    turno.id_usuario_cierre = request.user
    turno.save()
    return Response({
        'mensaje': 'Turno cerrado correctamente',
        'turno':   TurnoDiaSerializer(turno).data
    })


# ══════════════════════════════════════════════════════════════
# CU-INV20: Gestión de insumos (RFN37)
# ══════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def insumos(request):
    if request.method == 'GET':
        categoria = request.query_params.get('categoria')
        alerta    = request.query_params.get('alerta')
        qs = Insumo.objects.filter(activo=True)
        if categoria:
            qs = qs.filter(categoria=categoria)
        serialized = InsumoSerializer(qs, many=True).data
        if alerta == 'true':
            serialized = [i for i in serialized if i['en_alerta']]
        return Response(serialized)

    if request.method == 'POST':
        if request.user.Rol != 'administrador':
            return Response({'error': 'Sin permisos'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = InsumoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def insumo_detalle(request, pk):
    try:
        insumo = Insumo.objects.get(pk=pk)
    except Insumo.DoesNotExist:
        return Response({'error': 'Insumo no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(InsumoSerializer(insumo).data)

    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = InsumoSerializer(insumo, data=request.data,
                                      partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(InsumoSerializer(insumo).data)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        insumo.activo = False
        insumo.save()
        return Response({'mensaje': 'Insumo desactivado'})


# ══════════════════════════════════════════════════════════════
# CU-INV19: Pedidos de insumos (RFN36, RFN38)
# ══════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pedidos_insumo(request):
    if request.method == 'GET':
        qs = PedidoInsumo.objects.all()
        tipo = request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo_pedido=tipo)
        return Response(PedidoInsumoSerializer(qs, many=True).data)

    if request.method == 'POST':
        if request.user.Rol != 'administrador':
            return Response({'error': 'Sin permisos'},
                            status=status.HTTP_403_FORBIDDEN)

        detalles_data = request.data.get('detalles', [])
        if not detalles_data:
            return Response(
                {'error': 'Debe incluir al menos un insumo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido = PedidoInsumo.objects.create(
            tipo_pedido    = request.data.get('tipo_pedido'),
            distribuidora  = request.data.get('distribuidora'),
            observaciones  = request.data.get('observaciones', ''),
            id_usuario     = request.user,
        )

        for d in detalles_data:
            try:
                insumo = Insumo.objects.get(pk=d['id_insumo'])
                DetallePedidoInsumo.objects.create(
                    id_pedido_insumo    = pedido,
                    id_insumo           = insumo,
                    cantidad_solicitada = d.get('cantidad_solicitada', 0),
                )
            except Insumo.DoesNotExist:
                pass

        return Response(PedidoInsumoSerializer(pedido).data,
                        status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def marcar_entrega_insumo(request, pk):
    """Marcar pedido de insumo como entregado y actualizar stock."""
    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)
    try:
        pedido = PedidoInsumo.objects.get(pk=pk)
    except PedidoInsumo.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if pedido.estado_entrega == 'entregado':
        return Response({'error': 'Ya fue marcado como entregado'},
                        status=status.HTTP_400_BAD_REQUEST)

    from decimal import Decimal
    pedido.estado_entrega = 'entregado'
    pedido.fecha_llegada  = timezone.now()

    # Calcular minutos de espera para pedidos espontáneos
    diff = pedido.fecha_llegada - pedido.fecha_solicitado
    pedido.minutos_espera = int(diff.total_seconds() / 60)
    pedido.save()

    # Actualizar stock de cada insumo y registrar movimiento
    for detalle in pedido.detalles.all():
        cant = request.data.get(
            f'cantidad_recibida_{detalle.id_insumo_id}',
            detalle.cantidad_solicitada
        )
        cant = Decimal(str(cant))
        detalle.cantidad_recibida = cant
        detalle.save()

        insumo = detalle.id_insumo
        insumo.stock_almacen += cant
        insumo.save()

        MovimientoInsumo.objects.create(
            tipo_movimiento = 'entrada',
            cantidad        = cant,
            estado_origen   = 'externo',
            estado_destino  = 'almacen',
            motivo          = f'Pedido #{pedido.id_pedido_insumo}',
            id_insumo       = insumo,
            id_usuario      = request.user,
        )

    return Response({
        'mensaje':        'Entrega registrada y stock actualizado',
        'minutos_espera': pedido.minutos_espera,
        'pedido':         PedidoInsumoSerializer(pedido).data,
    })


# ══════════════════════════════════════════════════════════════
# CU-INV22: Gestión de movimientos (RFN39, RFN40, RFN43)
# ══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estado_insumos(request):
    """Vista de estados de todos los insumos activos."""
    qs = Insumo.objects.filter(activo=True)
    return Response({
        'almacen':     InsumoSerializer(
                        qs.filter(stock_almacen__gt=0), many=True).data,
        'utilizacion': InsumoSerializer(
                        qs.filter(stock_utilizacion__gt=0), many=True).data,
        'alertas':     InsumoSerializer(
                        [i for i in qs
                         if i.stock_almacen <= i.stock_minimo],
                        many=True).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mover_insumo(request):
    """Mover cantidad de almacén → utilización (RFN39)."""
    if request.user.Rol not in ('administrador', 'cocinero'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    from decimal import Decimal
    id_insumo = request.data.get('id_insumo')
    cantidad  = Decimal(str(request.data.get('cantidad', 0)))

    try:
        insumo = Insumo.objects.get(pk=id_insumo)
    except Insumo.DoesNotExist:
        return Response({'error': 'Insumo no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if cantidad <= 0:
        return Response({'error': 'La cantidad debe ser mayor a 0'},
                        status=status.HTTP_400_BAD_REQUEST)

    if insumo.stock_almacen < cantidad:
        return Response(
            {'error': f'Stock insuficiente en almacén. '
                      f'Disponible: {insumo.stock_almacen}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    insumo.stock_almacen     -= cantidad
    insumo.stock_utilizacion += cantidad
    insumo.save()

    mov = MovimientoInsumo.objects.create(
        tipo_movimiento = 'almacen_a_utilizacion',
        cantidad        = cantidad,
        estado_origen   = 'almacen',
        estado_destino  = 'utilizacion',
        motivo          = request.data.get('motivo', ''),
        id_insumo       = insumo,
        id_usuario      = request.user,
    )

    return Response({
        'mensaje':   'Insumo movido a utilización',
        'insumo':    InsumoSerializer(insumo).data,
        'movimiento': MovimientoInsumoSerializer(mov).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_estado_insumo(request):
    """Cocinero cambia estado: utilizado o desperdiciado (RFN43)."""
    if request.user.Rol not in ('cocinero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    from decimal import Decimal
    id_insumo  = request.data.get('id_insumo')
    cantidad   = Decimal(str(request.data.get('cantidad', 0)))
    nuevo_est  = request.data.get('estado')

    if nuevo_est not in ('utilizado', 'desperdiciado'):
        return Response({'error': 'Estado no válido'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        insumo = Insumo.objects.get(pk=id_insumo)
    except Insumo.DoesNotExist:
        return Response({'error': 'Insumo no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if insumo.stock_utilizacion < cantidad:
        return Response(
            {'error': 'Cantidad mayor al stock en utilización'},
            status=status.HTTP_400_BAD_REQUEST
        )

    insumo.stock_utilizacion -= cantidad
    insumo.save()

    MovimientoInsumo.objects.create(
        tipo_movimiento = nuevo_est,
        cantidad        = cantidad,
        estado_origen   = 'utilizacion',
        estado_destino  = nuevo_est,
        motivo          = request.data.get('motivo', ''),
        id_insumo       = insumo,
        id_usuario      = request.user,
    )

    return Response({
        'mensaje': f'Insumo marcado como {nuevo_est}',
        'insumo':  InsumoSerializer(insumo).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_movimientos(request):
    qs = MovimientoInsumo.objects.select_related('id_insumo')
    id_insumo = request.query_params.get('id_insumo')
    tipo      = request.query_params.get('tipo')
    if id_insumo: qs = qs.filter(id_insumo=id_insumo)
    if tipo:      qs = qs.filter(tipo_movimiento=tipo)
    qs = filtrar_por_fechas(qs, request, 'fecha_movimiento', defecto='todo')
    return Response(MovimientoInsumoSerializer(qs[:1000], many=True).data)


# ══════════════════════════════════════════════════════════════
# CU-INV21: Gestión de recetas (RFN41, RFN42)
# ══════════════════════════════════════════════════════════════

def _normalizar_detalles(detalles):
    """{id_insumo: cantidad}. Suma los insumos repetidos y descarta líneas
    vacías o con cantidad <= 0 (la BD rechaza esas filas)."""
    acumulado = {}
    for d in detalles or []:
        try:
            id_ins = int(d.get('id_insumo'))
            cant = Decimal(str(d.get('cantidad_por_porcion')))
        except Exception:
            continue
        if cant <= 0:
            continue
        acumulado[id_ins] = acumulado.get(id_ins, Decimal('0')) + cant
    return acumulado


def _escribir_detalles(receta, ingredientes):
    insumos = Insumo.objects.in_bulk(list(ingredientes))
    receta.detalles.all().delete()
    DetalleReceta.objects.bulk_create([
        DetalleReceta(id_receta=receta, id_insumo=insumos[i],
                      cantidad_por_porcion=c.quantize(Decimal('0.0001')))
        for i, c in ingredientes.items() if i in insumos])


def _notificar_cocineros(receta, mensaje):
    for cocinero in Usuario.objects.filter(Rol='cocinero', Activo=True):
        NotificacionReceta.objects.create(
            mensaje=mensaje, id_receta=receta, id_usuario=cocinero)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recetas(request):
    if request.method == 'GET':
        qs = Receta.objects.filter(activa=True)
        return Response(RecetaSerializer(qs, many=True).data)

    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    try:
        producto = Producto.objects.get(pk=request.data.get('id_producto'))
    except (Producto.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Producto no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    ingredientes = _normalizar_detalles(request.data.get('detalles'))
    if not ingredientes:
        return Response(
            {'error': 'Agrega al menos un ingrediente con cantidad mayor a 0'},
            status=status.HTTP_400_BAD_REQUEST)
    descripcion = request.data.get('descripcion', '')

    with transaction.atomic():          # o se guarda todo o no se guarda nada
        # get_or_create es seguro ante doble clic: si dos peticiones llegan
        # a la vez, la segunda recupera la fila en vez de duplicarla.
        receta, creada = Receta.objects.get_or_create(
            id_producto=producto,
            defaults={'descripcion': descripcion, 'activa': True})
        if not creada:
            if receta.activa:
                return Response(
                    {'error': 'Este producto ya tiene una receta. '
                              'Edítala desde la lista.'},
                    status=status.HTTP_400_BAD_REQUEST)
            receta.activa = True            # estaba desactivada → se reactiva
            receta.descripcion = descripcion
            receta.save()
        _escribir_detalles(receta, ingredientes)
        _notificar_cocineros(receta, f'Nueva receta creada: {producto.nombre}')

    return Response(RecetaSerializer(receta).data,
                    status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def receta_detalle(request, pk):
    try:
        receta = Receta.objects.get(pk=pk)
    except Receta.DoesNotExist:
        return Response({'error': 'Receta no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(RecetaSerializer(receta).data)

    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        ingredientes = None
        if 'detalles' in request.data:
            ingredientes = _normalizar_detalles(request.data['detalles'])
            if not ingredientes:
                return Response(
                    {'error': 'La receta necesita al menos un ingrediente '
                              'con cantidad mayor a 0'},
                    status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if 'descripcion' in request.data:
                receta.descripcion = request.data['descripcion']
            if ingredientes is not None:
                _escribir_detalles(receta, ingredientes)
            receta.save()
            _notificar_cocineros(
                receta, f'Receta actualizada: {receta.id_producto.nombre}')
        return Response(RecetaSerializer(receta).data)

    receta.activa = False               # DELETE
    receta.save()
    return Response({'mensaje': 'Receta desactivada'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_notificaciones_receta(request):
    """Notificaciones de receta para el cocinero autenticado."""
    qs = NotificacionReceta.objects.filter(
        id_usuario=request.user, leida=False
    )
    return Response(NotificacionRecetaSerializer(qs, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def marcar_notificacion_leida(request, pk):
    try:
        noti = NotificacionReceta.objects.get(
            pk=pk, id_usuario=request.user
        )
    except NotificacionReceta.DoesNotExist:
        return Response({'error': 'Notificación no encontrada'},
                        status=status.HTTP_404_NOT_FOUND)
    noti.leida = True
    noti.save()
    return Response({'mensaje': 'Notificación marcada como leída'})


# ══════════════════════════════════════════════════════════════
# CU-INV24: Prevención de insumos (RFN44, RFN45)
# ══════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def disponibilidad_por_receta(request):
    """Cuántos platos pueden prepararse con el stock actual (RFN44)."""
    recetas = Receta.objects.filter(activa=True).prefetch_related(
        'detalles', 'detalles__id_insumo'
    )
    resultado = []
    for receta in recetas:
        porciones_posibles = None
        alertas = []
        for detalle in receta.detalles.all():
            insumo = detalle.id_insumo
            if detalle.cantidad_por_porcion > 0:
                posibles = int(
                    insumo.stock_utilizacion / detalle.cantidad_por_porcion
                )
                if porciones_posibles is None or posibles < porciones_posibles:
                    porciones_posibles = posibles
                if posibles <= 5:
                    alertas.append({
                        'insumo':    insumo.nombre,
                        'stock':     str(insumo.stock_utilizacion),
                        'unidad':    insumo.unidad_medida,
                        'porciones': posibles,
                    })

        resultado.append({
            'id_receta':         receta.id_receta,
            'producto':          receta.id_producto.nombre,
            'porciones_posibles': porciones_posibles or 0,
            'alerta_escasez':    len(alertas) > 0,
            'alertas':           alertas,
        })

    return Response(resultado)


# ══════════════════════════════════════════════════════════════
# CU-INV23: Registros de fin del día (RFN46, RFN48)
# ══════════════════════════════════════════════════════════════

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mermas(request):
    if request.method == 'GET':
        qs = filtrar_por_fechas(
        Merma.objects.select_related('id_insumo'), request, 'fecha_registro')
        return Response(MermaSerializer(qs[:1000], many=True).data)

    if request.method == 'POST':
        if request.user.Rol not in ('administrador', 'cocinero'):
            return Response({'error': 'Sin permisos'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = MermaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(id_usuario=request.user)
            return Response(serializer.data,
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_insumos(request):
    """Dashboard de insumos del día (RFN48)."""
    if request.user.Rol not in ('administrador', 'cocinero'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    hoy = timezone.now().date()
    movimientos_hoy = MovimientoInsumo.objects.filter(
        fecha_movimiento__date=hoy
    )

    from decimal import Decimal
    total_ingresado = sum(
        m.cantidad for m in movimientos_hoy
        if m.tipo_movimiento == 'entrada'
    )
    total_utilizado = sum(
        m.cantidad for m in movimientos_hoy
        if m.tipo_movimiento == 'utilizado'
    )
    total_desperdiciado = sum(
        m.cantidad for m in movimientos_hoy
        if m.tipo_movimiento == 'desperdiciado'
    )
    total_movido = sum(
        m.cantidad for m in movimientos_hoy
        if m.tipo_movimiento == 'almacen_a_utilizacion'
    )

    insumos_activos = Insumo.objects.filter(activo=True)
    alertas = [
        InsumoSerializer(i).data
        for i in insumos_activos
        if i.stock_almacen <= i.stock_minimo
    ]

    mermas_hoy = Merma.objects.filter(fecha_registro__date=hoy)

    return Response({
        'fecha':               str(hoy),
        'total_ingresado':     str(total_ingresado),
        'total_utilizado':     str(total_utilizado),
        'total_desperdiciado': str(total_desperdiciado),
        'total_movido':        str(total_movido),
        'total_insumos':       insumos_activos.count(),
        'alertas_stock':       alertas,
        'total_alertas':       len(alertas),
        'mermas_hoy':          MermaSerializer(
                                mermas_hoy, many=True).data,
    })


#--------Historial Global--------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_global(request):
    if request.user.Rol != 'administrador':
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    p      = request.query_params
    modulo = p.get('modulo', 'todos')
    buscar = (p.get('buscar') or '').lower().strip()
    pagina = max(int(p.get('page', 1) or 1), 1)
    tam    = min(int(p.get('page_size', 50) or 50), 5000)
    LIMITE = 1000                       # filas máximas por módulo

    eventos, resumen, errores = [], {}, {}

    def quien(u):
        if not u:
            return '—'
        n = f"{getattr(u, 'Nombre', '')} {getattr(u, 'Apellido', '')}".strip()
        return n or getattr(u, 'username', '—')

    def mesa_de(ped):
        try:
            return ped.id_mesa.identificador_mesa
        except Exception:
            return '—'

    def ev(mod, pk, fecha, titulo, detalle='', usuario='—',
           estado='', monto=None):
        return {
            'key': f'{mod}-{pk}', 'modulo': mod,
            'fecha': fecha.isoformat() if fecha else None,
            'titulo': titulo, 'detalle': detalle, 'usuario': usuario,
            'estado': estado,
            'monto': float(monto) if monto is not None else None,
        }

    def agregar(mod, qs, fn):
        # 'cocina' es un subconjunto de 'pedidos': solo se lista si se elige
        listar = modulo == mod or (modulo == 'todos' and mod != 'cocina')
        try:
            with transaction.atomic():      # un módulo con error no tumba a los demás
                resumen[mod] = qs.count()   # siempre: alimenta los contadores
                filas = list(qs[:LIMITE]) if listar else []
        except Exception as e:
            errores[mod] = str(e).split('\n')[0][:200]
            return
        for obj in filas:
            try:
                eventos.append(fn(obj))
            except Exception:
                continue    # una fila incompleta no debe tumbar el historial

    F = lambda qs, campo: filtrar_por_fechas(qs, request, campo, 'todo')

    # ── Pedidos y cocina ──────────────────────────────────────
    base_ped = Pedido.objects.select_related('id_mesa', 'id_usuario') \
                             .prefetch_related('detalles__id_producto')

    def items(o):
        return [f"{d.cantidad}x {d.id_producto.nombre}"
                for d in o.detalles.all() if d.id_producto]

    def f_pedido(o):
        total = sum(d.cantidad * d.id_producto.precio
                    for d in o.detalles.all() if d.id_producto)
        return ev('pedidos', o.id_pedidos, o.tiempo_creacion,
                  f"Pedido #{o.id_pedidos} · Mesa {mesa_de(o)}",
                  ', '.join(items(o)), quien(o.id_usuario),
                  o.estado, total)

    def f_cocina(o):
        return ev('cocina', o.id_pedidos, o.tiempo_creacion,
                  f"Producción · Mesa {mesa_de(o)}",
                  ', '.join(items(o)), quien(o.id_usuario), o.estado)

    agregar('pedidos', F(base_ped, 'tiempo_creacion'), f_pedido)
    agregar('cocina',
            F(base_ped.filter(estado__in=['listo', 'despachado', 'pagado']),
              'tiempo_creacion'), f_cocina)

    # ── Caja ──────────────────────────────────────────────────
    def f_pago(o):
        return ev('pagos', o.id_pago, o.fecha_cobro,
                  f"Pago #{o.id_pago} · Mesa {mesa_de(o.id_pedidos)}",
                  f"{o.metodo_pago} · {o.tipo_comprobante}",
                  quien(o.id), o.estado, o.monto_total)

    agregar('pagos',
            F(Pago.objects.select_related('id_pedidos__id_mesa'),
              'fecha_cobro'), f_pago)

    # ── Reclamos ──────────────────────────────────────────────
    agregar('reclamos',
            F(Reclamo.objects.select_related('id_usuario'),
              'tiempo_creacion'),
            lambda o: ev('reclamos', o.id_reclamo, o.tiempo_creacion,
                         f"{o.tipo.capitalize()} #{o.id_reclamo}",
                         o.descripcion, quien(o.id_usuario), o.estado))

    # ── Inventario ────────────────────────────────────────────
    agregar('movimientos',
            F(MovimientoInsumo.objects.select_related('id_insumo',
                                                      'id_usuario'),
              'fecha_movimiento'),
            lambda o: ev('movimientos', o.id_movimiento, o.fecha_movimiento,
                         f"{o.get_tipo_movimiento_display()} · "
                         f"{o.id_insumo.nombre}",
                         f"{o.cantidad} {o.id_insumo.unidad_medida}"
                         + (f" — {o.motivo}" if o.motivo else ''),
                         quien(o.id_usuario), o.tipo_movimiento))

    agregar('pedidos_insumo',
            F(PedidoInsumo.objects.select_related('id_usuario')
                                  .prefetch_related('detalles__id_insumo'),
              'fecha_solicitado'),
            lambda o: ev('pedidos_insumo', o.id_pedido_insumo,
                         o.fecha_solicitado,
                         f"Compra {o.tipo_pedido} · {o.distribuidora}",
                         ', '.join(f"{d.id_insumo.nombre}: "
                                   f"{d.cantidad_solicitada}"
                                   for d in o.detalles.all())
                         + (f" · espera {o.minutos_espera} min"
                            if o.minutos_espera is not None else ''),
                         quien(o.id_usuario), o.estado_entrega))

    agregar('mermas',
            F(Merma.objects.select_related('id_insumo', 'id_usuario'),
              'fecha_registro'),
            lambda o: ev('mermas', o.id_merma, o.fecha_registro,
                         f"Merma ({o.tipo_merma}) · {o.id_insumo.nombre}",
                         f"{o.cantidad} {o.id_insumo.unidad_medida}"
                         + (f" — {o.motivo}" if o.motivo else ''),
                         quien(o.id_usuario), o.tipo_merma))

    def f_turno(o):
        cierre = (f" → cerrado {timezone.localtime(o.hora_cierre):%H:%M}"
                  if o.hora_cierre else '')
        return ev('turnos', o.id_turno, o.hora_inicio, f"Turno {o.fecha}",
                  f"abierto {timezone.localtime(o.hora_inicio):%H:%M}{cierre}",
                  quien(o.id_usuario_apertura), o.estado)

    agregar('turnos',
            F(TurnoDia.objects.select_related('id_usuario_apertura'),
              'hora_inicio'), f_turno)

    # ── Búsqueda, orden y paginación ──────────────────────────
    if buscar:
        eventos = [e for e in eventos if buscar in
                   f"{e['titulo']} {e['detalle']} {e['usuario']} "
                   f"{e['estado']}".lower()]
    eventos.sort(key=lambda e: e['fecha'] or '', reverse=True)

    total = len(eventos)
    ini   = (pagina - 1) * tam
    return Response({
        'total': total, 'page': pagina,
        'paginas': max(-(-total // tam), 1),
        'resumen': resumen, 'errores': errores,
        'limite_por_modulo': LIMITE,
        'resultados': eventos[ini:ini + tam],
    })