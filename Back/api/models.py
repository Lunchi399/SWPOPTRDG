from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('administrador', 'Administrador'),
        ('mesero',        'Mesero/a'),
        ('cocinero',      'Cocinero/a'),
        ('cajero',        'Cajero/a'),
    ]
    rol            = models.CharField(max_length=20, choices=ROL_CHOICES,
                                      default='mesero')
    activo         = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = 'usuario'
        verbose_name   = 'Usuario'

    def __str__(self):
        return f"{self.username} ({self.rol})"


class Producto(models.Model):
    CATEGORIA_CHOICES = [
        ('entrada',  'Entrada'),
        ('segundo',  'Segundo'),
        ('bebida',   'Bebida'),
        ('postre',   'Postre'),
    ]
    # coincide exactamente con tu tabla 'producto'
    id_producto  = models.AutoField(primary_key=True)
    nombre       = models.CharField(max_length=150)
    descripcion  = models.TextField(blank=True, null=True)
    precio       = models.DecimalField(max_digits=10, decimal_places=2)
    disponible   = models.BooleanField(default=True)
    imagen_url   = models.CharField(max_length=255, blank=True, null=True)
    categoria    = models.CharField(max_length=50, choices=CATEGORIA_CHOICES)
    stock        = models.IntegerField(default=0)

    class Meta:
        db_table = 'producto'
        ordering = ['categoria', 'nombre']

    def __str__(self):
        return f"{self.nombre} — S/. {self.precio}"


class Mesas(models.Model):
    ESTADO_CHOICES = [
        ('libre',    'Libre'),
        ('ocupada',  'Ocupada'),
        ('unida',    'Unida'),
        ('reservada','Reservada'),
    ]
    # coincide exactamente con tu tabla 'mesas'
    id_mesa           = models.AutoField(primary_key=True)
    identificador_mesa = models.CharField(max_length=50)
    capacidad         = models.IntegerField(default=4)
    estado            = models.CharField(max_length=20,
                                         choices=ESTADO_CHOICES,
                                         default='libre')

    class Meta:
        db_table = 'mesas'
        ordering = ['identificador_mesa']

    def __str__(self):
        return f"Mesa {self.identificador_mesa} — {self.estado}"


class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('borrador',   'Borrador'),
        ('confirmado', 'Confirmado'),
        ('en_cocina',  'En cocina'),
        ('listo',      'Listo'),
        ('despachado', 'Despachado'),
        ('pagado',     'Pagado'),
        ('cancelado',  'Cancelado'),
        ('anulado',    'Anulado'),
    ]
    # coincide exactamente con tu tabla 'pedido'
    id_pedidos          = models.AutoField(primary_key=True)
    estado              = models.CharField(max_length=20,
                                           choices=ESTADO_CHOICES,
                                           default='borrador')
    observaciones       = models.CharField(max_length=255, blank=True, null=True)
    tiempo_creacion     = models.DateTimeField(auto_now_add=True)
    tiempo_finalizacion = models.DateTimeField(null=True, blank=True)
    id_mesa             = models.ForeignKey(Mesas, on_delete=models.SET_NULL,
                                            null=True, blank=True,
                                            db_column='id_mesa',
                                            related_name='pedidos')
    id_usuario          = models.ForeignKey(Usuario, on_delete=models.SET_NULL,
                                            null=True,
                                            db_column='id_usuario',
                                            related_name='pedidos')

    class Meta:
        db_table = 'pedido'
        ordering = ['-tiempo_creacion']

    def __str__(self):
        return f"Pedido #{self.id_pedidos} — {self.estado}"

    @property
    def total(self):
        return sum(d.precio_unitario * d.cantidad
                   for d in self.detalles.all())


class DetallePedido(models.Model):
    # coincide exactamente con tu tabla 'detalle_pedido'
    id_detalle    = models.AutoField(primary_key=True)
    cantidad      = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    id_pedido     = models.ForeignKey(Pedido, on_delete=models.CASCADE,
                                      db_column='id_pedido',
                                      related_name='detalles')
    id_producto   = models.ForeignKey(Producto, on_delete=models.SET_NULL,
                                      null=True, db_column='id_producto',
                                      related_name='detalles')

    class Meta:
        db_table = 'detalle_pedido'

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario


class Pago(models.Model):
    METODO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('yape',     'Yape'),
        ('plin',     'Plin'),
        ('tarjeta',  'Tarjeta'),
    ]
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completado','Completado'),
        ('anulado',   'Anulado'),
    ]
    # coincide exactamente con tu tabla 'pago'
    id_pago        = models.AutoField(primary_key=True)
    monto_total    = models.DecimalField(max_digits=10, decimal_places=2)
    monto_recibido = models.DecimalField(max_digits=10, decimal_places=2,
                                         null=True, blank=True)
    vuelto         = models.DecimalField(max_digits=10, decimal_places=2,
                                         null=True, blank=True)
    metodo_pago    = models.CharField(max_length=20, choices=METODO_CHOICES)
    estado         = models.CharField(max_length=20, choices=ESTADO_CHOICES,
                                      default='pendiente')
    fecha_cobro    = models.DateTimeField(auto_now_add=True)
    id_usuario     = models.ForeignKey(Usuario, on_delete=models.SET_NULL,
                                       null=True, db_column='id_usuario',
                                       related_name='pagos')
    id_pedido      = models.ForeignKey(Pedido, on_delete=models.SET_NULL,
                                       null=True, db_column='id_pedido',
                                       related_name='pagos')

    class Meta:
        db_table = 'pago'
        ordering = ['-fecha_cobro']

    def __str__(self):
        return f"Pago #{self.id_pago} — {self.metodo_pago} — S/. {self.monto_total}"


class DetallePago(models.Model):
    # coincide exactamente con tu tabla 'detalle_pago'
    id_detalle_pago = models.AutoField(primary_key=True)
    nombre_producto = models.CharField(max_length=150)
    cantidad        = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2)
    id_pago         = models.ForeignKey(Pago, on_delete=models.CASCADE,
                                        db_column='id_pago',
                                        related_name='detalles_pago')

    class Meta:
        db_table = 'detalle_pago'


class Reclamo(models.Model):
    TIPO_CHOICES = [
        ('reclamo',    'Reclamo'),
        ('sugerencia', 'Sugerencia'),
    ]
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('revisado',   'Revisado'),
        ('resuelto',   'Resuelto'),
    ]
    # coincide exactamente con tu tabla 'reclamo'
    id_reclamo      = models.AutoField(primary_key=True)
    tipo            = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion     = models.CharField(max_length=255)
    estado          = models.CharField(max_length=20, choices=ESTADO_CHOICES,
                                       default='pendiente')
    tiempo_creacion = models.DateTimeField(auto_now_add=True)
    id_pedido       = models.ForeignKey(Pedido, on_delete=models.SET_NULL,
                                        null=True, blank=True,
                                        db_column='id_pedido',
                                        related_name='reclamos')
    id_usuario      = models.ForeignKey(Usuario, on_delete=models.SET_NULL,
                                        null=True, db_column='id_usuario',
                                        related_name='reclamos')

    class Meta:
        db_table = 'reclamo'
        ordering = ['-tiempo_creacion']