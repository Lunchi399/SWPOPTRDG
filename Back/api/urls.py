from django.urls import path
from . import views

urlpatterns = [

    #── Paquete 1: Autenticación ──────────────────────────────
    path('login/',   views.login,   name='login'),
    path('logout/',  views.logout,  name='logout'),

    #── Paquete 2:Administración ─────────────────────────────
    path('usuarios/',              views.usuarios,         name='usuarios'),
    path('usuarios/<int:pk>/',     views.usuario_detalle,  name='usuario-detalle'),
    path('productos/',             views.productos,        name='productos'),
    path('productos/<int:pk>/',    views.producto_detalle, name='producto-detalle'),
    path('mesas/',                 views.mesas,            name='mesas'),
    path('mesas/<int:pk>/',        views.mesa_detalle,     name='mesa-detalle'),
    path('dashboard/',             views.dashboard,        name='dashboard'),
    path('reclamos/<int:pk>/', views.reclamo_detalle, name='reclamo-detalle'),

    #── Paquete 3: Mesro ─────────────────────────────────────
    path('mesas/unir/',                views.unir_mesas,         name='unir-mesas'),
    path('mesas/<int:pk>/desunir/',    views.desunir_mesa,       name='desunir-mesa'),
    path('mesas/<int:pk>/finalizar/',  views.finalizar_servicio, name='finalizar-servicio'),
    path('pedidos/',                   views.pedidos,            name='pedidos'),
    path('pedidos/<int:pk>/',          views.pedido_detalle,     name='pedido-detalle'),
    path('reclamos/',                  views.reclamos,           name='reclamos'),
    path('historial-pedidos/',         views.historial_pedidos,  name='historial-pedidos'),

    #── Paquete 5: Caja───────────────────────────────────────
    path('pedidos-por-mesa/',  views.pedidos_por_mesa, name='pedidos-por-mesa'),
    path('pagos/',             views.registrar_pago,   name='registrar-pago'),
    path('cuadre-caja/',       views.cuadre_caja,      name='cuadre-caja'),

]