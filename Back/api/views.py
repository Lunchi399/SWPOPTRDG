from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from api.backends import UsuarioBackend

from .models import (Usuario, Producto, Mesas, Pedido,
                     DetallePedido, Boleta, DetalleBoleta, Reclamo)

from .serializers import (UsuarioSerializer, CrearUsuarioSerializer,
                           EditarUsuarioSerializer, ProductoSerializer,
                           MesaSerializer, PedidoSerializer,
                           BoletaSerializer, ReclamoSerializer)
from .permissions import EsAdministrador, EsMesero, EsCocinero, EsCajero


# ══════════════════════════════════════════════════════════════
# PAQUETE 1 — Autenticación
# ══════════════════════════════════════════════════════════════

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
        mesa = Boleta.objects.get(pk=pk)
    except Boleta.DoesNotExist:
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
            'total_hoy': Boleta.objects.filter(
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
            ).exclude(estado='pagado')
        elif rol in ('cocinero', 'administrador'):
            qs = Pedido.objects.exclude(
                estado__in=['borrador', 'pagado', 'cancelado']
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

        # Crear pedido
        pedido = Pedido.objects.create(
            estado        = 'borrador',
            observaciones = request.data.get('observaciones', ''),
            id_mesa       = mesa,
            id_usuario    = request.user,
        )

        # Crear detalles
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

        # Marcar mesa como ocupada
        mesa.estado = 'ocupada'
        mesa.save()

        return Response(PedidoSerializer(pedido).data,
                        status=status.HTTP_201_CREATED)


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
    rol    = request.user.Rol

    TRANSICIONES = {
        'confirmar':  ('borrador',    'confirmado', ['mesero', 'administrador']),
        'en_cocina':  ('confirmado',  'en_cocina',  ['cocinero', 'administrador']),
        'listo':      ('en_cocina',   'listo',      ['cocinero', 'administrador']),
        'despachar':  ('listo',       'despachado', ['mesero', 'administrador']),
        'completar':  ('despachado',  'pagado',     ['cajero', 'administrador']),
        'cancelar':   (None,          'cancelado',  ['mesero', 'administrador']),
    }

    if accion not in TRANSICIONES:
        return Response({'error': 'Acción no válida'},
                        status=status.HTTP_400_BAD_REQUEST)

    estado_requerido, estado_nuevo, roles_permitidos = TRANSICIONES[accion]

    if rol not in roles_permitidos:
        return Response({'error': f'Tu rol no puede ejecutar esta acción'},
                        status=status.HTTP_403_FORBIDDEN)

    if estado_requerido and pedido.estado != estado_requerido:
        return Response(
            {'error': f'El pedido debe estar en estado "{estado_requerido}"'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # No cancelar si ya está en cocina
    if accion == 'cancelar' and pedido.estado in ('en_cocina', 'listo', 'despachado', 'pagado'):
        return Response(
            {'error': 'No se puede cancelar: solicita anulación al administrador'},
            status=status.HTTP_400_BAD_REQUEST
        )

    pedido.estado = estado_nuevo
    pedido.save()

    # Liberar mesa si se cancela
    if accion == 'cancelar' and pedido.id_mesa:
        pedido.id_mesa.estado = 'libre'
        pedido.id_mesa.save()

    return Response({
        'mensaje': f'Pedido actualizado a: {estado_nuevo}',
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
def pedidos_por_mesa(request):
    qs = Pedido.objects.filter(
        estado='despachado'
    ).select_related('id_mesa', 'id')
    return Response(PedidoSerializer(qs, many=True).data)


# CU15/CU16 — Registrar boleta (antes registrar_pago)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_boleta(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    pedido_id = request.data.get('id_pedido')
    try:
        pedido = Pedido.objects.get(pk=pedido_id)
    except Pedido.DoesNotExist:
        return Response({'error': 'Pedido no encontrado'},
                        status=status.HTTP_404_NOT_FOUND)

    if pedido.estado != 'despachado':
        return Response(
            {'error': 'El pedido no está listo para cobrar'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calcular total desde los detalles del pedido
    detalles  = pedido.detalles.all()
    total     = sum(d.cantidad * d.id_producto.precio
                    for d in detalles if d.id_producto)

    monto_recibido = float(request.data.get('monto_recibido', total))
    vuelto         = round(monto_recibido - float(total), 2)

    if vuelto < 0:
        return Response(
            {'error': f'Monto insuficiente. Total a pagar: S/. {total}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Crear boleta
    boleta = Boleta.objects.create(
        vuelto     = vuelto,
        id_usuario = request.user,
        id_pedido  = pedido,
    )

    # Crear detalle de boleta por cada ítem del pedido
    for d in detalles:
        if d.id_producto:
            subtotal = d.cantidad * d.id_producto.precio
            DetalleBoleta.objects.create(
                id_boleta        = boleta,
                producto         = d.id_producto.nombre,
                cantidad_producto= d.cantidad,
                subtotal         = subtotal,
                total            = total,
            )

    # Actualizar estado del pedido a pagado
    pedido.estado = 'pagado'
    pedido.save()

    # Liberar la mesa
    if pedido.id_mesa:
        pedido.id_mesa.estado = 'libre'
        pedido.id_mesa.save()

    return Response({
        'mensaje': 'Boleta registrada correctamente',
        'boleta':  BoletaSerializer(boleta).data,
        'vuelto':  vuelto,
        'total':   str(total),
    }, status=status.HTTP_201_CREATED)


# CU16 — Cuadre de caja
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cuadre_caja(request):
    if request.user.Rol not in ('cajero', 'administrador'):
        return Response({'error': 'Sin permisos'},
                        status=status.HTTP_403_FORBIDDEN)

    hoy     = timezone.now().date()
    boletas = Boleta.objects.filter(fecha_cobro__date=hoy)

    # Calcular total vendido sumando los totales de cada detalle
    total_ventas = 0
    for b in boletas:
        primer_detalle = b.detalles_boleta.first()
        if primer_detalle:
            total_ventas += primer_detalle.total

    resumen = {
        'fecha':               str(hoy),
        'total_ventas':        total_ventas,
        'total_transacciones': boletas.count(),
        'total_vuelto':        sum(b.vuelto for b in boletas if b.vuelto),
        'boletas':             BoletaSerializer(boletas, many=True).data,
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