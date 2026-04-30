from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    
    ROL_CHOICES = [
        ('administrador', 'Administrador'),
        ('mesero',        'Mesero/a'),
        ('cocinero',      'Cocinero/a'),
        ('cajero',        'Cajero/a'),
    ]

    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default='mesero'
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.username} ({self.rol})"