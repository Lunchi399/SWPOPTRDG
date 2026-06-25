from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Usuario


class UsuarioJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
            usuario = Usuario.objects.get(pk=user_id)
            return usuario
        except Usuario.DoesNotExist:
            raise InvalidToken('Usuario no encontrado')
        except Exception as e:
            raise InvalidToken(f'Error al obtener usuario: {str(e)}')