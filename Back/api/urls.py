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
    path('pedidos/<int:pk>/estado/', views.cambiar_estado_pedido, name='cambiar-estado'),
    #---- Paquete 4 — Cocina ------------------------------------
    path('cocina/cola/',      views.cola_cocina,     name='cola-cocina'),
    path('cocina/historial/', views.historial_cocina, name='historial-cocina'),
    path('cocina/alerta/',    views.alerta_cocina,    name='alerta-cocina'),
    # ── Paquete 5: Caja ───────────────────────────────────────────
    path('caja/pedidos/',              views.pedidos_por_cobrar, name='pedidos-cobrar'),
    path('caja/calcular/<int:pk>/',    views.calcular_total,     name='calcular-total'),
    path('caja/pago/',                 views.registrar_pago,     name='registrar-pago'),
   
    path('caja/cuadre/',               views.cuadre_caja,        name='cuadre-caja'),
    path('caja/historial/',            views.historial_pagos,    name='historial-pagos'),
    # ── Módulo Inventario ─────────────────────────────────────────
    path('inventario/turno/',                  views.turno_dia,                name='turno-dia'),
    path('inventario/turno/<int:pk>/cerrar/',  views.cerrar_turno,             name='cerrar-turno'),
    path('inventario/insumos/',                views.insumos,                  name='insumos'),
    path('inventario/insumos/<int:pk>/',       views.insumo_detalle,           name='insumo-detalle'),
    path('inventario/estado/',                 views.estado_insumos,           name='estado-insumos'),
    path('inventario/mover/',                  views.mover_insumo,             name='mover-insumo'),
    path('inventario/estado-insumo/',          views.cambiar_estado_insumo,    name='cambiar-estado-insumo'),
    path('inventario/movimientos/',            views.historial_movimientos,    name='historial-movimientos'),
    path('inventario/pedidos/',                views.pedidos_insumo,           name='pedidos-insumo'),
    path('inventario/pedidos/<int:pk>/entregar/', views.marcar_entrega_insumo, name='entregar-insumo'),
    path('inventario/recetas/',                views.recetas,                  name='recetas'),
    path('inventario/recetas/<int:pk>/',       views.receta_detalle,           name='receta-detalle'),
    path('inventario/disponibilidad/',         views.disponibilidad_por_receta,name='disponibilidad-recetas'),
    path('inventario/notificaciones/',         views.mis_notificaciones_receta,name='notificaciones-receta'),
    path('inventario/notificaciones/<int:pk>/leer/', views.marcar_notificacion_leida, name='leer-notificacion'),
    path('inventario/mermas/',                 views.mermas,                   name='mermas'),
    path('inventario/dashboard/',              views.dashboard_insumos,        name='dashboard-insumos'),
    

    #---------- Historial Global ----------------------------------------    
    path('historial-global/',                  views.historial_global,         name='historial-global'),

]