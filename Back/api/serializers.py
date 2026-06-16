from rest_framework import serializers
from .models import (Usuario, Producto, Mesas, Pedido,
                     DetallePedido, Boleta, DetalleBoleta, Reclamo)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'username', 'Nombre', 'Apellido',
                  'email', 'Rol', 'Activo', 'Fecha_creacion']
        read_only_fields = ['id', 'Fecha_creacion']


class CrearUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = Usuario
        fields = ['username', 'Nombre', 'Apellido',
                  'email', 'Rol', 'password']
        extra_kwargs = {
            'Nombre':   {'required': False},
            'Apellido': {'required': False},
            'email':    {'required': False},
        }

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                'Ya existe un usuario con ese nombre de usuario.'
            )
        return value

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        password = validated_data.pop('password')
        usuario  = Usuario(
            username = validated_data.get('username'),
            Nombre   = validated_data.get('Nombre', ''),
            Apellido = validated_data.get('Apellido', ''),
            email    = validated_data.get('email', ''),
            Rol      = validated_data.get('Rol', 'mesero'),
            Activo   = True,
            Password = make_password(password),
        )
        usuario.save()
        return usuario


class EditarUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['Nombre', 'Apellido', 'email', 'Rol', 'Activo']

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Producto
        fields = ['id_producto', 'nombre', 'descripcion',
                  'precio', 'categoria', 'stock', 'disponible']


class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Mesas
        fields = ['id_mesa', 'identificador_mesa', 'capacidad', 'estado']


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='id_producto.nombre', read_only=True
    )
    precio_unitario = serializers.DecimalField(
        source='id_producto.precio',
        max_digits=10, decimal_places=2, read_only=True
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model  = DetallePedido
        fields = ['id_detalle', 'id_producto', 'producto_nombre',
                  'cantidad', 'precio_unitario', 'subtotal']

    def get_subtotal(self, obj):
        if obj.id_producto:
            return obj.cantidad * obj.id_producto.precio
        return 0


class PedidoSerializer(serializers.ModelSerializer):
    detalles           = DetallePedidoSerializer(many=True, read_only=True)
    total              = serializers.SerializerMethodField()
    mesa_identificador = serializers.SerializerMethodField()
    mesero_nombre      = serializers.SerializerMethodField()

    class Meta:
        model  = Pedido
        fields = [
            'id_pedidos',         
            'estado',
            'observaciones',
            'tiempo_creacion',
            'tiempo_modificacion',
            'id_mesa',
            'mesa_identificador',
            'id_usuario',
            'mesero_nombre',
            'detalles',
            'total',
        ]
        read_only_fields = [
            'id_pedidos',
            'tiempo_creacion',
            'tiempo_modificacion',
        ]

    def get_total(self, obj):
        try:
            return sum(
                d.cantidad * d.id_producto.precio
                for d in obj.detalles.all()
                if d.id_producto
            )
        except Exception:
            return 0

    def get_mesa_identificador(self, obj):
        try:
            return obj.id_mesa.identificador_mesa if obj.id_mesa else '—'
        except Exception:
            return '—'

    def get_mesero_nombre(self, obj):
        try:
            if obj.id_usuario:
                return f"{obj.id_usuario.Nombre} {obj.id_usuario.Apellido}"
            return '—'
        except Exception:
            return '—'


class DetalleboletaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DetalleBoleta
        fields = ['id_detalle_boleta', 'producto', 'cantidad_producto',
                  'subtotal', 'total']


class BoletaSerializer(serializers.ModelSerializer):
    detalles_boleta = DetalleboletaSerializer(many=True, read_only=True)
    cajero_nombre   = serializers.SerializerMethodField()
    pedido_mesa     = serializers.CharField(
        source='id_pedidos.id_mesa.identificador_mesa', read_only=True
    )

    class Meta:
        model  = Boleta
        fields = ['id_pago', 'vuelto', 'fecha_cobro',
                  'id', 'cajero_nombre',
                  'id_pedidos', 'pedido_mesa',
                  'detalles_boleta']
        read_only_fields = ['id_pago', 'fecha_cobro']

    def get_cajero_nombre(self, obj):
        if obj.id_usuario:
            return f"{obj.id_usuario.first_name} {obj.id_usuario.last_name}"
        return '—'


class ReclamoSerializer(serializers.ModelSerializer):
    registrado_por = serializers.SerializerMethodField()

    class Meta:
        model  = Reclamo
        fields = ['id_reclamo', 'tipo', 'descripcion', 'estado',
                  'tiempo_creacion', 'id_pedidos',
                  'id', 'registrado_por']
        read_only_fields = ['id_reclamo', 'tiempo_creacion', 'id']

    def get_registrado_por(self, obj):
        if obj.id_usuario:
            return f"{obj.id_usuario.first_name} {obj.id_usuario.last_name}"
        return '—'