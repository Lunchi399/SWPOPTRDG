from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

class UsuarioManager(BaseUserManager):
    def get_by_natural_key(self, username):
        return self.get(username=username)

    def create_user(self, username, password=None, **extra):
        user = self.model(username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra):
        extra.setdefault('is_superuser', True)
        extra.setdefault('Activo', True)
        extra.setdefault('Rol', 'administrador')
        return self.create_user(username, password, **extra)


class Usuario(models.Model):
    ROL_CHOICES = [
        ('administrador', 'Administrador'),
        ('mesero',        'Mesero/a'),
        ('cocinero',      'Cocinero/a'),
        ('cajero',        'Cajero/a'),
    ]

    id             = models.AutoField(primary_key=True)
    Password       = models.CharField(max_length=255, db_column='password')
    last_login     = models.DateTimeField(null=True, blank=True)
    is_superuser   = models.BooleanField(default=False)
    username       = models.CharField(max_length=150, unique=True,
                                      db_column='Usuario')
    Nombre         = models.CharField(max_length=150, blank=True,
                                      db_column='Nombre')
    Apellido       = models.CharField(max_length=150, blank=True,
                                      db_column='Apellido')
    email          = models.EmailField(blank=True, db_column='email')
    Activo         = models.BooleanField(default=True, db_column='Activo')
    Rol            = models.CharField(max_length=20, choices=ROL_CHOICES,
                                      default='mesero', db_column='Rol')
    Fecha_creacion = models.DateTimeField(auto_now_add=True,
                                          db_column='Fecha_creacion')

    # Propiedades que Django necesita
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return self.Activo

    @property
    def is_staff(self):
        return self.is_superuser

    @property
    def rol(self):
        return self.Rol

    @property
    def first_name(self):
        return self.Nombre

    @property
    def last_name(self):
        return self.Apellido

    # Para que JWT funcione
    @property
    def pk(self):
        return self.id

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.Password)

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.Password = make_password(raw_password)

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    objects = UsuarioManager()

    REQUIRED_FIELDS = []
    USERNAME_FIELD  = 'username'

    class Meta:
        db_table = 'Usuario'
        managed  = False

    def __str__(self):
        return f"{self.Nombre} {self.Apellido} ({self.Rol})"


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre      = models.CharField(max_length=150)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    precio      = models.DecimalField(max_digits=10, decimal_places=2)
    categoria   = models.CharField(max_length=50)
    stock       = models.IntegerField(default=0)
    # disponible no está en tu diagrama pero lo dejamos para la lógica
    disponible  = models.BooleanField(default=True)

    class Meta:
        db_table = 'producto'
        managed  = False
        ordering = ['categoria', 'nombre']

    def __str__(self):
        return f"{self.nombre} — S/. {self.precio}"


class Mesas(models.Model):
    ESTADO_CHOICES = [
        ('libre',     'Libre'),
        ('ocupada',   'Ocupada'),
        ('unida',     'Unida'),
        ('reservada', 'Reservada'),
    ]
    id_mesa            = models.AutoField(primary_key=True)
    identificador_mesa = models.CharField(max_length=50)
    capacidad          = models.IntegerField(default=4)
    estado             = models.CharField(max_length=20,
                                          choices=ESTADO_CHOICES,
                                          default='libre')

    class Meta:
        db_table = 'mesas'    # ← tu diagrama dice "Mesa" no "Mesas"
        managed  = False
        ordering = ['identificador_mesa']

    def __str__(self):
        return f"Mesas {self.identificador_mesa} — {self.estado}"


class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('confirmado', 'Confirmado'),   # ← estados reales, no acciones
        ('en_cocina',  'En cocina'),
        ('listo',      'Listo'),
        ('despachado', 'Despachado'),
        ('pagado',     'Pagado'),
        ('cancelado',  'Cancelado'),
        ('anulado',    'Anulado'),
    ]

    id_pedidos          = models.AutoField(primary_key=True)
    estado              = models.CharField(max_length=20,
                                           choices=ESTADO_CHOICES,
                                           default='confirmado')
    tiempo_creacion     = models.DateTimeField(auto_now_add=True)
    tiempo_modificacion = models.DateTimeField(auto_now=True)
    observaciones       = models.CharField(max_length=255,
                                           blank=True, null=True)
    id_mesa    = models.ForeignKey('mesas', on_delete=models.SET_NULL,
                                   null=True, blank=True,
                                   db_column='id_mesa',
                                   related_name='pedidos')
    id_usuario = models.ForeignKey('Usuario', on_delete=models.SET_NULL,
                                   null=True,
                                   db_column='id',
                                   related_name='pedidos')

    class Meta:
        db_table = 'pedido'
        managed  = False
        ordering = ['-tiempo_creacion']

    def __str__(self):
        return f"Pedido #{self.id_pedidos} — {self.estado}"

    @property
    def total(self):
        return sum(
            d.cantidad * d.id_producto.precio
            for d in self.detalles.all()
            if d.id_producto
        )


class DetallePedido(models.Model):
    id_detalle      = models.AutoField(primary_key=True)
    cantidad        = models.IntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2,
                                          null=True, blank=True)
    id_pedido       = models.ForeignKey(Pedido, on_delete=models.CASCADE,
                                        db_column='id_pedidos',
                                        related_name='detalles')
    id_producto     = models.ForeignKey(Producto, on_delete=models.SET_NULL,
                                        null=True,
                                        db_column='id_producto',
                                        related_name='detalles')

    class Meta:
        db_table = 'detalle_pedido'
        managed  = False

    @property
    def subtotal(self):
        if self.id_producto:
            return self.cantidad * self.id_producto.precio
        return 0


class Pago(models.Model):
    METODO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('yape',     'Yape'),
        ('plin',     'Plin'),
        ('tarjeta',  'Tarjeta'),
    ]
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('completado', 'Completado'),
        ('anulado',    'Anulado'),
    ]
    COMPROBANTE_CHOICES = [
        ('boleta',   'Boleta'),
        ('factura',  'Factura'),
        ('ninguno',  'Ninguno'),
    ]

    id_pago          = models.AutoField(primary_key=True)
    monto_total      = models.DecimalField(max_digits=10, decimal_places=2)
    monto_recibido   = models.DecimalField(max_digits=10, decimal_places=2,
                                           null=True, blank=True)
    vuelto           = models.DecimalField(max_digits=10, decimal_places=2,
                                           null=True, blank=True)
    metodo_pago      = models.CharField(max_length=20,
                                        choices=METODO_CHOICES,
                                        default='efectivo')
    estado           = models.CharField(max_length=20,
                                        choices=ESTADO_CHOICES,
                                        default='pendiente')
    fecha_cobro      = models.DateTimeField(auto_now_add=True)
    tipo_comprobante = models.CharField(max_length=20,
                                        choices=COMPROBANTE_CHOICES,
                                        default='boleta')
    # FK a Usuario — columna 'id' en la tabla
    id               = models.ForeignKey('Usuario',
                                          on_delete=models.SET_NULL,
                                          null=True,
                                          db_column='id',
                                          related_name='pagos')
    id_pedidos       = models.ForeignKey('Pedido',
                                          on_delete=models.SET_NULL,
                                          null=True,
                                          db_column='id_pedidos',
                                          related_name='pagos')

    class Meta:
        db_table = 'pago'
        managed  = False
        ordering = ['-fecha_cobro']

    def __str__(self):
        return f"Pago #{self.id_pago} — S/. {self.monto_total}"


class DetallePago(models.Model):
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
        managed  = False


class DatosFactura(models.Model):
    id_factura     = models.AutoField(primary_key=True)
    ruc            = models.CharField(max_length=11)
    razon_social   = models.CharField(max_length=200)
    direccion_fiscal = models.CharField(max_length=255, blank=True, null=True)
    id_pago        = models.ForeignKey(Pago, on_delete=models.CASCADE,
                                       db_column='id_pago',
                                       related_name='datos_factura')

    class Meta:
        db_table = 'datos_factura'
        managed  = False


class Reclamo(models.Model):
    TIPO_CHOICES = [
        ('reclamo',    'Reclamo'),
        ('sugerencia', 'Sugerencia'),
    ]
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('revisado',  'Revisado'),
        ('resuelto',  'Resuelto'),
    ]
    # Campos exactos del diagrama
    id_reclamo      = models.AutoField(primary_key=True)
    tipo            = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion     = models.CharField(max_length=255)
    tiempo_creacion = models.DateTimeField(auto_now_add=True)
    estado          = models.CharField(max_length=20,
                                       choices=ESTADO_CHOICES,
                                       default='pendiente')
    id_pedido  = models.ForeignKey(Pedido, on_delete=models.SET_NULL,
                                   null=True, blank=True,
                                   db_column='id_pedidos',
                                   related_name='reclamos')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL,
                                   null=True,
                                   db_column='id',
                                   related_name='reclamos')

    class Meta:
        db_table = 'reclamo'
        managed  = False
        ordering = ['-tiempo_creacion']

class TurnoDia(models.Model):
    ESTADO_CHOICES = [
        ('abierto', 'Abierto'),
        ('cerrado', 'Cerrado'),
    ]
    id_turno             = models.AutoField(primary_key=True)
    fecha                = models.DateField(unique=True)
    hora_inicio          = models.DateTimeField(auto_now_add=True)
    hora_cierre          = models.DateTimeField(null=True, blank=True)
    estado               = models.CharField(max_length=20,
                                            choices=ESTADO_CHOICES,
                                            default='abierto')
    id_usuario_apertura  = models.ForeignKey('Usuario',
                                              on_delete=models.SET_NULL,
                                              null=True,
                                              db_column='id_usuario_apertura',
                                              related_name='turnos_abiertos')
    id_usuario_cierre    = models.ForeignKey('Usuario',
                                              on_delete=models.SET_NULL,
                                              null=True, blank=True,
                                              db_column='id_usuario_cierre',
                                              related_name='turnos_cerrados')

    class Meta:
        db_table = 'turno_dia'
        managed  = False
        ordering = ['-fecha']

    def __str__(self):
        return f"Turno {self.fecha} — {self.estado}"

class Insumo(models.Model):
    CATEGORIA_CHOICES = [
        ('carnes',    'Carnes'),
        ('verduras',  'Verduras'),
        ('lacteos',   'Lácteos'),
        ('bebidas',   'Bebidas'),
        ('abarrotes', 'Abarrotes'),
        ('otros',     'Otros'),
    ]
    ALMACENAJE_CHOICES = [
        ('paquetes', 'Paquetes'),
        ('cajas',    'Cajas'),
        ('botellas', 'Botellas'),
        ('baldes',   'Baldes'),
        ('otros',    'Otros'),
    ]
    id_insumo         = models.AutoField(primary_key=True)
    nombre            = models.CharField(max_length=150)
    categoria         = models.CharField(max_length=30,
                                         choices=CATEGORIA_CHOICES)
    unidad_medida     = models.CharField(max_length=30)
    tipo_almacenaje   = models.CharField(max_length=30,
                                         choices=ALMACENAJE_CHOICES)
    stock_almacen     = models.DecimalField(max_digits=10,
                                            decimal_places=2, default=0)
    stock_utilizacion = models.DecimalField(max_digits=10,
                                            decimal_places=2, default=0)
    stock_minimo      = models.DecimalField(max_digits=10,
                                            decimal_places=2, default=0)
    activo            = models.BooleanField(default=True)
    fecha_creacion    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'insumo'
        managed  = False
        ordering = ['categoria', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.unidad_medida})"

    @property
    def stock_total(self):
        return self.stock_almacen + self.stock_utilizacion

    @property
    def en_alerta(self):
        return self.stock_almacen <= self.stock_minimo

class PedidoInsumo(models.Model):
    TIPO_CHOICES = [
        ('programado',  'Programado'),
        ('espontaneo',  'Espontáneo'),
    ]
    ESTADO_CHOICES = [
        ('pendiente',  'Pendiente'),
        ('entregado',  'Entregado'),
    ]
    id_pedido_insumo = models.AutoField(primary_key=True)
    tipo_pedido      = models.CharField(max_length=20,
                                        choices=TIPO_CHOICES)
    distribuidora    = models.CharField(max_length=150)
    estado_entrega   = models.CharField(max_length=20,
                                        choices=ESTADO_CHOICES,
                                        default='pendiente')
    fecha_solicitado = models.DateTimeField(auto_now_add=True)
    fecha_llegada    = models.DateTimeField(null=True, blank=True)
    minutos_espera   = models.IntegerField(null=True, blank=True)
    observaciones    = models.CharField(max_length=255,
                                        blank=True, null=True)
    id_usuario       = models.ForeignKey('Usuario',
                                          on_delete=models.SET_NULL,
                                          null=True,
                                          db_column='id_usuario',
                                          related_name='pedidos_insumos')

    class Meta:
        db_table = 'pedido_insumo'
        managed  = False
        ordering = ['-fecha_solicitado']

class DetallePedidoInsumo(models.Model):
    id_detalle_pedido_insumo = models.AutoField(primary_key=True)
    cantidad_solicitada      = models.DecimalField(max_digits=10,
                                                   decimal_places=2)
    cantidad_recibida        = models.DecimalField(max_digits=10,
                                                   decimal_places=2,
                                                   null=True, blank=True)
    id_pedido_insumo = models.ForeignKey(PedidoInsumo,
                                          on_delete=models.CASCADE,
                                          db_column='id_pedido_insumo',
                                          related_name='detalles')
    id_insumo        = models.ForeignKey(Insumo,
                                          on_delete=models.CASCADE,
                                          db_column='id_insumo',
                                          related_name='detalles_pedido')

    class Meta:
        db_table = 'detalle_pedido_insumo'
        managed  = False        


class MovimientoInsumo(models.Model):
    TIPO_CHOICES = [
        ('entrada',              'Entrada de compra'),
        ('almacen_a_utilizacion','Almacén → Utilización'),
        ('utilizado',            'Utilizado'),
        ('desperdiciado',        'Desperdiciado'),
    ]
    id_movimiento    = models.AutoField(primary_key=True)
    tipo_movimiento  = models.CharField(max_length=30,
                                        choices=TIPO_CHOICES)
    cantidad         = models.DecimalField(max_digits=10, decimal_places=2)
    estado_origen    = models.CharField(max_length=20)
    estado_destino   = models.CharField(max_length=20)
    motivo           = models.CharField(max_length=255,
                                        blank=True, null=True)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    id_insumo        = models.ForeignKey(Insumo,
                                          on_delete=models.CASCADE,
                                          db_column='id_insumo',
                                          related_name='movimientos')
    id_usuario       = models.ForeignKey('Usuario',
                                          on_delete=models.SET_NULL,
                                          null=True,
                                          db_column='id_usuario',
                                          related_name='movimientos_insumos')
    id_pedidos       = models.ForeignKey('Pedido',
                                          on_delete=models.SET_NULL,
                                          null=True, blank=True,
                                          db_column='id_pedidos',
                                          related_name='movimientos_insumos')

    class Meta:
        db_table = 'movimiento_insumo'
        managed  = False
        ordering = ['-fecha_movimiento']


class Receta(models.Model):
    id_receta           = models.AutoField(primary_key=True)
    id_producto         = models.OneToOneField('Producto',
                                               on_delete=models.CASCADE,
                                               db_column='id_producto',
                                               related_name='receta')
    descripcion         = models.CharField(max_length=255,
                                           blank=True, null=True)
    activa              = models.BooleanField(default=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'receta'
        managed  = False

    def __str__(self):
        return f"Receta de {self.id_producto.nombre}"


class DetalleReceta(models.Model):
    id_detalle_receta    = models.AutoField(primary_key=True)
    cantidad_por_porcion = models.DecimalField(max_digits=10,
                                               decimal_places=4)
    id_receta  = models.ForeignKey(Receta,
                                   on_delete=models.CASCADE,
                                   db_column='id_receta',
                                   related_name='detalles')
    id_insumo  = models.ForeignKey(Insumo,
                                   on_delete=models.CASCADE,
                                   db_column='id_insumo',
                                   related_name='detalles_receta')

    class Meta:
        db_table = 'detalle_receta'
        managed  = False
        unique_together = [('id_receta', 'id_insumo')]

class NotificacionReceta(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    mensaje         = models.CharField(max_length=255)
    leida           = models.BooleanField(default=False)
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    id_receta       = models.ForeignKey(Receta,
                                        on_delete=models.CASCADE,
                                        db_column='id_receta',
                                        related_name='notificaciones')
    id_usuario      = models.ForeignKey('Usuario',
                                        on_delete=models.SET_NULL,
                                        null=True,
                                        db_column='id_usuario',
                                        related_name='notificaciones_receta')

    class Meta:
        db_table = 'notificacion_receta'
        managed  = False
        ordering = ['-fecha_creacion']


class Merma(models.Model):
    TIPO_CHOICES = [
        ('sobrante',    'Sobrante'),
        ('desperdicio', 'Desperdicio'),
    ]
    id_merma       = models.AutoField(primary_key=True)
    cantidad       = models.DecimalField(max_digits=10, decimal_places=2)
    motivo         = models.CharField(max_length=255,
                                      blank=True, null=True)
    tipo_merma     = models.CharField(max_length=20,
                                      choices=TIPO_CHOICES)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    id_insumo      = models.ForeignKey(Insumo,
                                       on_delete=models.CASCADE,
                                       db_column='id_insumo',
                                       related_name='mermas')
    id_usuario     = models.ForeignKey('Usuario',
                                       on_delete=models.SET_NULL,
                                       null=True,
                                       db_column='id_usuario',
                                       related_name='mermas_registradas')

    class Meta:
        db_table = 'merma'
        managed  = False
        ordering = ['-fecha_registro']