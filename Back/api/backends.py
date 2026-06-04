from django.contrib.auth.backends import BaseBackend
from .models import Usuario


class UsuarioBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            usuario = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return None

        if not usuario.Activo:
            return None

        if usuario.check_password(password):
            return usuario

        return None

    def get_user(self, user_id):
        try:
            return Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            return None