from rest_framework import serializers
from .models import (Usuario, Producto, Mesas, Pedido,
                     DetallePedido, Pago, DetallePago, Reclamo)


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'username', 'first_name', 'last_name',
                  'email', 'rol', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class CrearUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = Usuario
        fields = ['username', 'first_name', 'last_name',
                  'email', 'rol', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario  = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class EditarUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['first_name', 'last_name', 'email', 'rol', 'activo']


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Producto
        fields = ['id_producto', 'nombre', 'descripcion', 'precio',
                  'disponible', 'imagen_url', 'categoria', 'stock']


class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Mesas
        fields = ['id_mesa', 'identificador_mesa', 'capacidad', 'estado']


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(
        source='id_producto.nombre', read_only=True
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model  = DetallePedido
        fields = ['id_detalle', 'id_producto', 'producto_nombre',
                  'cantidad', 'precio_unitario', 'subtotal']

    def get_subtotal(self, obj):
        return obj.cantidad * obj.precio_unitario


class PedidoSerializer(serializers.ModelSerializer):
    detalles       = DetallePedidoSerializer(many=True, read_only=True)
    total          = serializers.SerializerMethodField()
    mesa_identificador = serializers.CharField(
        source='id_mesa.identificador_mesa', read_only=True
    )
    mesero_nombre  = serializers.CharField(
        source='id_usuario.username', read_only=True
    )

    class Meta:
        model  = Pedido
        fields = ['id_pedidos', 'estado', 'observaciones',
                  'tiempo_creacion', 'tiempo_finalizacion',
                  'id_mesa', 'mesa_identificador',
                  'id_usuario', 'mesero_nombre',
                  'detalles', 'total']
        read_only_fields = ['id_pedidos', 'tiempo_creacion']

    def get_total(self, obj):
        return sum(d.cantidad * d.precio_unitario
                   for d in obj.detalles.all())


class DetallePagoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DetallePago
        fields = ['id_detalle_pago', 'nombre_producto',
                  'cantidad', 'precio_unitario', 'subtotal']


class PagoSerializer(serializers.ModelSerializer):
    detalles_pago  = DetallePagoSerializer(many=True, read_only=True)
    cajero_nombre  = serializers.CharField(
        source='id_usuario.username', read_only=True
    )

    class Meta:
        model  = Pago
        fields = ['id_pago', 'monto_total', 'monto_recibido', 'vuelto',
                  'metodo_pago', 'estado', 'fecha_cobro',
                  'id_usuario', 'cajero_nombre',
                  'id_pedido', 'detalles_pago']
        read_only_fields = ['id_pago', 'fecha_cobro', 'vuelto']


class ReclamoSerializer(serializers.ModelSerializer):
    registrado_por = serializers.CharField(
        source='id_usuario.username', read_only=True
    )

    class Meta:
        model  = Reclamo
        fields = ['id_reclamo', 'tipo', 'descripcion', 'estado',
                  'tiempo_creacion', 'id_pedido',
                  'id_usuario', 'registrado_por']
        read_only_fields = ['id_reclamo', 'tiempo_creacion', 'id_usuario']