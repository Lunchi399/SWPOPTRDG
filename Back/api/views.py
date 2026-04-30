from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Usuario
from .serializers import UsuarioSerializer

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

    usuario = authenticate(username=username, password=password)

    if not usuario:
        return Response(
            {'error': 'Credenciales incorrectas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usuario.activo:
        return Response(
            {'error': 'Usuario desactivado. Contacte al administrador'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generar tokens JWT
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
        token.blacklist()  # invalida el token

        return Response(
            {'mensaje': 'Sesión cerrada correctamente'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Token inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )