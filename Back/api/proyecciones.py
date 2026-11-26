"""Motor de cálculo del módulo de Proyecciones (RFN49 – RFN57, RFN60, RFN61).

Todas las funciones públicas devuelven diccionarios JSON-serializables
(floats, strings y listas): el mismo resultado se envía al front y, si el
administrador lo pide, se guarda tal cual en proyeccion_guardada (RFN61).

Convenciones
  · Fechas "de negocio" en la zona horaria del local (PROYECCIONES_TZ,
    por defecto America/Lima), sin depender de settings.TIME_ZONE.
  · El historial de ventas excluye HOY (día incompleto) y los pedidos
    cancelados/anulados.
  · Dinero y cantidades en Decimal; pronósticos en float y se convierten
    a Decimal una sola vez al cruzar a cantidades/dinero.
"""
import bisect
import csv
import io
import math
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal, ROUND_CEILING, ROUND_HALF_UP
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date

from .models import (ConfigProyeccion, DetallePedido, DetallePedidoInsumo,
                     Insumo, Merma, Pago, PrecioCompraInsumo, Producto, Receta)

TZ            = ZoneInfo(getattr(settings, 'PROYECCIONES_TZ', 'America/Lima'))
ESTADOS_VENTA = ('confirmado', 'en_cocina', 'listo', 'despachado', 'pagado')
CERO          = Decimal('0')
UNO           = Decimal('1')
CIEN          = Decimal('100')

# Días entre compras cuando aún no hay historial suficiente (≥3 entregas)
DIAS_REPOSICION = {'carnes': 3, 'verduras': 3, 'lacteos': 3,
                   'bebidas': 7, 'abarrotes': 7, 'otros': 7}
SIN_PROVEEDOR   = 'Sin proveedor previo'
ORDEN_RIESGO    = {'alto': 0, 'medio': 1, 'bajo': 2}

NOMBRES_TIPO = {
    'demanda':      'Proyección de demanda',
    'consumo':      'Proyección de consumo de insumos',
    'gasto':        'Estimación de gasto en compras',
    'rentabilidad': 'Reporte de rentabilidad',
    'financiero':   'Reporte de ingresos y gastos',
    'compras':      'Plan de compras',
}


# ══════════════════════════════════════════════════════════════
# Utilidades
# ══════════════════════════════════════════════════════════════
def hoy_local():
    return timezone.now().astimezone(TZ).date()


def dec(x):
    return x if isinstance(x, Decimal) else Decimal(str(x))


def num(x, nd=2):
    return round(float(x), nd)


def a_local(dt):
    return dt.astimezone(TZ).date()


def _limites(desde, hasta):
    """[inicio, fin) como datetimes aware para filtrar por rango de días."""
    return (datetime.combine(desde, time.min, tzinfo=TZ),
            datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=TZ))


def get_config():
    cfg, _ = ConfigProyeccion.objects.get_or_create(
        pk=1, defaults={'margen_minimo_pct': Decimal('30'),
                        'factor_seguridad_pct': Decimal('10')})
    return cfg


class Precios:
    """
    RFN57 — precios de compra en memoria. El precio actual está en
    insumo.precio_compra y el historial en precio_compra_insumo. Una compra,
    merma o receta pasada se valoriza con el precio vigente EN SU FECHA. Si la
    fecha es anterior al primer precio conocido se usa ese primer precio y se
    marca como aproximado.
    """
    def __init__(self):
        self._fechas, self._precios = defaultdict(list), defaultdict(list)
        for p in PrecioCompraInsumo.objects.order_by('id_insumo', 'fecha_registro',
                                                     'id_precio'):
            self._fechas[p.id_insumo_id].append(p.fecha_registro)
            self._precios[p.id_insumo_id].append(p.precio_unitario)
        # El precio actual manda: si el historial no lo refleja (p. ej. se
        # editó directo en Supabase) se agrega como último tramo.
        for i in Insumo.objects.filter(precio_compra__isnull=False):
            historial = self._precios[i.id_insumo]
            if not historial or historial[-1] != i.precio_compra:
                desde = i.precio_vigente_desde or a_local(i.fecha_creacion)
                if self._fechas[i.id_insumo]:
                    desde = max(desde, self._fechas[i.id_insumo][-1])
                self._fechas[i.id_insumo].append(desde)
                historial.append(i.precio_compra)
        self.sin_precio   = set()   # ids de insumos consultados sin precio
        self.aproximados  = 0       # valorizaciones con precio posterior

    def vigente(self, id_insumo, fecha):
        """(precio, vigente_desde, aproximado) o (None, None, False)."""
        fechas = self._fechas.get(id_insumo)
        if not fechas:
            return None, None, False
        i = bisect.bisect_right(fechas, fecha)
        if i == 0:
            return self._precios[id_insumo][0], fechas[0], True
        return self._precios[id_insumo][i - 1], fechas[i - 1], False

    def precio_en(self, id_insumo, fecha):
        """Precio (Decimal|None); registra sin_precio / aproximados."""
        precio, _, aprox = self.vigente(id_insumo, fecha)
        if precio is None:
            self.sin_precio.add(id_insumo)
        elif aprox:
            self.aproximados += 1
        return precio

    def valorizar(self, id_insumo, cantidad, fecha):
        precio = self.precio_en(id_insumo, fecha)
        return cantidad * precio if precio is not None else CERO

    def detalle_sin_precio(self):
        nombres = dict(Insumo.objects.filter(pk__in=self.sin_precio)
                       .values_list('id_insumo', 'nombre'))
        return [{'id_insumo': i, 'nombre': nombres.get(i, f'#{i}')}
                for i in sorted(self.sin_precio)]


# ══════════════════════════════════════════════════════════════
# RFN49 — Proyección de demanda de platos
# ══════════════════════════════════════════════════════════════
def _ventas_diarias(desde, hasta):
    importe = ExpressionWrapper(
        F('cantidad') * Coalesce('precio_unitario', 'id_producto__precio'),
        output_field=DecimalField(max_digits=14, decimal_places=2))
    return list(
        DetallePedido.objects
        .filter(id_pedido__estado__in=ESTADOS_VENTA, id_producto__isnull=False)
        .annotate(dia=TruncDate('id_pedido__tiempo_creacion', tzinfo=TZ))
        .filter(dia__gte=desde, dia__lte=hasta)
        .values('dia', 'id_producto_id')
        .annotate(unidades=Sum('cantidad'), importe=Sum(importe)))


def _demanda(horizonte, dias_historial):
    """Devuelve (resultado_json, {id_producto: unidades_float})."""
    hoy          = hoy_local()
    desde, hasta = hoy - timedelta(days=dias_historial), hoy - timedelta(days=1)
    filas        = _ventas_diarias(desde, hasta)

    unidades = defaultdict(dict)            # id_producto -> {dia: unidades}
    por_dia  = {}                           # dia -> [unidades, importe]
    for f in filas:
        unidades[f['id_producto_id']][f['dia']] = f['unidades']
        acum = por_dia.setdefault(f['dia'], [0, CERO])
        acum[0] += f['unidades']
        acum[1] += f['importe'] or CERO

    dias_op = sorted(por_dia)               # días con al menos una venta
    n_op    = len(dias_op)
    op_wd   = {}                            # weekday -> nº de días operativos
    for d in dias_op:
        op_wd[d.weekday()] = op_wd.get(d.weekday(), 0) + 1
    # Día de la semana sin una sola venta en ≥2 semanas → local cerrado
    cerrados = ({w for w in range(7) if w not in op_wd}
                if dias_historial >= 14 and n_op else set())

    def pronostico(serie, wd):
        if n_op == 0 or wd in cerrados:
            return 0.0
        media = sum(serie.values()) / n_op
        n_wd  = op_wd.get(wd, 0)
        if n_wd >= 2:                       # mezcla estacionalidad semanal
            media_wd = sum(u for d, u in serie.items()
                           if d.weekday() == wd) / n_wd
            return 0.6 * media_wd + 0.4 * media
        return media

    mitad = desde + timedelta(days=dias_historial // 2)

    def tendencia(serie):
        a = [d for d in dias_op if d < mitad]
        b = [d for d in dias_op if d >= mitad]
        if len(a) < 2 or len(b) < 2:
            return None
        ma = sum(serie.get(d, 0) for d in a) / len(a)
        mb = sum(serie.get(d, 0) for d in b) / len(b)
        return None if ma == 0 else round((mb - ma) / ma * 100, 1)

    n      = 1 if horizonte == 'dia' else 7
    fechas = [hoy + timedelta(days=i) for i in range(1, n + 1)]
    productos = {p.id_producto: p for p in Producto.objects.all()}
    ids = {i for i in unidades if i in productos} | \
          {i for i, p in productos.items() if p.disponible}

    platos, mapa = [], {}
    por_fecha = {f: [0.0, 0.0] for f in fechas}
    for pid in ids:
        p, serie = productos[pid], unidades.get(pid, {})
        diario = {f: pronostico(serie, f.weekday()) for f in fechas}
        total  = sum(diario.values())
        mapa[pid] = total
        for f, v in diario.items():
            por_fecha[f][0] += v
            por_fecha[f][1] += v * float(p.precio)
        hist = sum(serie.values())
        platos.append({
            'id_producto':         pid,
            'nombre':              p.nombre,
            'categoria':           p.categoria,
            'precio':              num(p.precio),
            'unidades_historicas': hist,
            'promedio_diario':     num(hist / n_op, 2) if n_op else 0.0,
            'unidades_estimadas':  num(total, 1),
            'ventas_estimadas':    num(total * float(p.precio)),
            'tendencia_pct':       tendencia(serie),
            'rotacion':            None,
        })

    platos.sort(key=lambda r: (-r['unidades_estimadas'], r['nombre']))
    k, tercio = len(platos), max(1, math.ceil(len(platos) / 3))
    if n_op:
        for i, r in enumerate(platos):
            r['rotacion'] = ('alta' if i < tercio
                             else 'baja' if i >= k - tercio else 'media')
    mayor = [r for r in platos if r['unidades_estimadas'] > 0][:5]
    ids_m = {r['id_producto'] for r in mayor}
    menor = [r for r in reversed(platos) if r['id_producto'] not in ids_m][:5]

    historico, d = [], desde
    while d <= hasta:
        u, imp = por_dia.get(d, (0, CERO))
        historico.append({'fecha': d.isoformat(), 'unidades': u,
                          'ventas': num(imp), 'operativo': d in por_dia})
        d += timedelta(days=1)

    resultado = {
        'horizonte':       horizonte,
        'dias_historial':  dias_historial,
        'desde':           desde.isoformat(),
        'hasta':           hasta.isoformat(),
        'dias_operativos': n_op,
        'confianza': ('sin_datos' if n_op == 0 else 'alta' if n_op >= 14
                      else 'media' if n_op >= 7 else 'baja'),
        'metodo': ('Promedio por día operativo del historial, mezclado '
                   '60/40 con el promedio del mismo día de la semana.'),
        'fechas':          [f.isoformat() for f in fechas],
        'total_unidades':  num(sum(v[0] for v in por_fecha.values()), 1),
        'ventas_estimadas': num(sum(v[1] for v in por_fecha.values())),
        'por_dia': [{'fecha': f.isoformat(), 'unidades': num(v[0], 1),
                     'ventas_estimadas': num(v[1])}
                    for f, v in por_fecha.items()],
        'platos':          platos,
        'mayor_rotacion':  mayor,
        'menor_rotacion':  menor,
        'historico_diario': historico,
    }
    return resultado, mapa


def proyectar_demanda(horizonte='semana', dias_historial=28):
    return _demanda(horizonte, dias_historial)[0]


# ══════════════════════════════════════════════════════════════
# RFN50 — Proyección de consumo de insumos
# ══════════════════════════════════════════════════════════════
def _entregas_por_insumo():
    """({id_insumo: [fechas distintas de entrega]}, {id_insumo: últ. distribuidora})"""
    fechas, ultima = defaultdict(set), {}
    qs = (DetallePedidoInsumo.objects
          .filter(id_pedido_insumo__estado_entrega='entregado',
                  id_pedido_insumo__fecha_llegada__isnull=False)
          .select_related('id_pedido_insumo')
          .order_by('id_pedido_insumo__fecha_llegada'))
    for d in qs:
        ped = d.id_pedido_insumo
        fechas[d.id_insumo_id].add(a_local(ped.fecha_llegada))
        ultima[d.id_insumo_id] = ped.distribuidora     # el más reciente gana
    return {k: sorted(v) for k, v in fechas.items()}, ultima


def _consumo(dem, mapa):
    cfg    = get_config()
    factor = UNO + cfg.factor_seguridad_pct / CIEN
    n      = len(dem['fechas'])

    necesidad, con_receta = defaultdict(lambda: CERO), set()
    for r in Receta.objects.filter(activa=True).prefetch_related('detalles'):
        con_receta.add(r.id_producto_id)
        unid = mapa.get(r.id_producto_id)
        if not unid:
            continue
        for d in r.detalles.all():
            necesidad[d.id_insumo_id] += dec(unid) * d.cantidad_por_porcion

    nombres = {p['id_producto']: p for p in dem['platos']}
    sin_receta = [{'id_producto': pid, 'nombre': nombres[pid]['nombre'],
                   'unidades_estimadas': num(u, 1)}
                  for pid, u in mapa.items()
                  if u > 0 and pid not in con_receta and pid in nombres]

    en_camino = defaultdict(lambda: CERO)
    for d in DetallePedidoInsumo.objects.filter(
            id_pedido_insumo__estado_entrega='pendiente'):
        en_camino[d.id_insumo_id] += d.cantidad_solicitada

    entregas, distribuidora = _entregas_por_insumo()
    items = []
    for i in Insumo.objects.filter(activo=True):
        nec    = necesidad.get(i.id_insumo, CERO)
        stock  = i.stock_almacen + i.stock_utilizacion
        camino = en_camino.get(i.id_insumo, CERO)
        diario = nec / n
        cobertura = stock / diario if diario > 0 else None
        riesgo = 'bajo'
        if cobertura is not None:
            riesgo = ('alto' if cobertura < 2
                      else 'medio' if cobertura < 5 else 'bajo')
        # Se compra lo necesario (+ margen de seguridad) para terminar el
        # período con el stock mínimo (punto de reorden), descontando lo
        # que ya está en camino.
        comprar = max(CERO, nec * factor + i.stock_minimo - stock - camino)
        comprar = comprar.quantize(Decimal('0.01'), ROUND_CEILING)

        fe = entregas.get(i.id_insumo, [])
        if len(fe) >= 3:
            gaps = [(b - a).days for a, b in zip(fe, fe[1:])]
            frec, origen = min(30, max(1, round(sum(gaps) / len(gaps)))), 'historial'
        else:
            frec, origen = DIAS_REPOSICION.get(i.categoria, 7), 'categoria'

        items.append({
            'id_insumo':          i.id_insumo,
            'nombre':             i.nombre,
            'categoria':          i.categoria,
            'unidad_medida':      i.unidad_medida,
            'stock_actual':       num(stock),
            'stock_minimo':       num(i.stock_minimo),
            'en_camino':          num(camino),
            'necesidad_estimada': num(nec, 3),
            'consumo_diario':     num(diario, 3),
            'cobertura_dias':     num(cobertura, 1) if cobertura is not None else None,
            'riesgo_quiebre':     riesgo,
            'cantidad_a_comprar': num(comprar),
            'frecuencia_dias':    frec,
            'frecuencia_origen':  origen,
            'cantidad_por_compra': num(diario * frec * factor),
            'sobrestock':         cobertura is not None and cobertura > 14,
            'distribuidora':      distribuidora.get(i.id_insumo),
        })

    items.sort(key=lambda r: (ORDEN_RIESGO[r['riesgo_quiebre']],
                              r['cobertura_dias'] is None,
                              r['cobertura_dias'] or 0, r['nombre']))
    return {
        'horizonte':            dem['horizonte'],
        'dias_historial':       dem['dias_historial'],
        'fechas':               dem['fechas'],
        'confianza':            dem['confianza'],
        'factor_seguridad_pct': num(cfg.factor_seguridad_pct),
        'items':                items,
        'productos_sin_receta': sin_receta,
        'resumen': {
            'insumos_a_comprar': sum(1 for r in items if r['cantidad_a_comprar'] > 0),
            'riesgo_alto':       sum(1 for r in items if r['riesgo_quiebre'] == 'alto'),
            'sobrestock':        sum(1 for r in items if r['sobrestock']),
        },
    }


def proyectar_consumo(horizonte='semana', dias_historial=28):
    dem, mapa = _demanda(horizonte, dias_historial)
    return _consumo(dem, mapa)


# ══════════════════════════════════════════════════════════════
# RFN51 — Estimación de gasto en compras (vs. gasto real anterior)
# ══════════════════════════════════════════════════════════════
def _compras_valorizadas(desde, hasta, precios):
    """Compras entregadas en [desde, hasta], valorizadas a la fecha de llegada."""
    ini, fin = _limites(desde, hasta)
    qs = (DetallePedidoInsumo.objects
          .filter(id_pedido_insumo__estado_entrega='entregado',
                  id_pedido_insumo__fecha_llegada__gte=ini,
                  id_pedido_insumo__fecha_llegada__lt=fin)
          .select_related('id_pedido_insumo'))
    filas = []
    for d in qs:
        fecha = a_local(d.id_pedido_insumo.fecha_llegada)
        cant  = d.cantidad_recibida if d.cantidad_recibida is not None \
                else d.cantidad_solicitada
        filas.append({'fecha': fecha, 'id_insumo': d.id_insumo_id,
                      'cantidad': cant,
                      'monto': precios.valorizar(d.id_insumo_id, cant, fecha)})
    return filas


def _gasto(consumo, precios):
    hoy, n = hoy_local(), len(consumo['fechas'])
    items, total_compra, total_consumo = [], CERO, CERO
    for it in consumo['items']:
        precio = precios.precio_en(it['id_insumo'], hoy)
        if it['cantidad_a_comprar'] <= 0 and it['necesidad_estimada'] <= 0:
            continue
        if precio is None:
            costo_compra = costo_cons = None
        else:
            costo_compra = dec(it['cantidad_a_comprar']) * precio
            costo_cons   = dec(it['necesidad_estimada']) * precio
            total_compra += costo_compra
            total_consumo += costo_cons
        items.append({
            'id_insumo': it['id_insumo'], 'nombre': it['nombre'],
            'unidad_medida': it['unidad_medida'],
            'cantidad_a_comprar': it['cantidad_a_comprar'],
            'necesidad_estimada': it['necesidad_estimada'],
            'precio_unitario': num(precio, 4) if precio is not None else None,
            'gasto_compra': num(costo_compra) if costo_compra is not None else None,
            'costo_consumo': num(costo_cons) if costo_cons is not None else None,
        })

    # Gasto real de los períodos anteriores del mismo largo
    n_per = 4 if consumo['horizonte'] == 'semana' else 7
    filas = _compras_valorizadas(hoy - timedelta(days=n_per * n),
                                 hoy - timedelta(days=1), precios)
    historico = []
    for k in range(n_per, 0, -1):               # el más antiguo primero
        ini = hoy - timedelta(days=k * n)
        fin = ini + timedelta(days=n - 1)
        monto = sum((r['monto'] for r in filas if ini <= r['fecha'] <= fin), CERO)
        historico.append({'desde': ini.isoformat(), 'hasta': fin.isoformat(),
                          'gasto_real': num(monto)})
    prom = sum(h['gasto_real'] for h in historico) / n_per
    items.sort(key=lambda r: -(r['gasto_compra'] or 0))
    return {
        'horizonte':               consumo['horizonte'],
        'fechas':                  consumo['fechas'],
        'gasto_estimado_compras':  num(total_compra),
        'costo_consumo_estimado':  num(total_consumo),
        'promedio_gasto_real':     num(prom),
        'variacion_pct':           (num((float(total_compra) - prom) / prom * 100, 1)
                                    if prom > 0 else None),
        'historico':               historico,
        'items':                   items,
        'insumos_sin_precio':      precios.detalle_sin_precio(),
        'valorizaciones_aproximadas': precios.aproximados,
    }


def estimar_gasto(horizonte='semana', dias_historial=28):
    return _gasto(proyectar_consumo(horizonte, dias_historial), Precios())


# ══════════════════════════════════════════════════════════════
# RFN52 — Rentabilidad por plato  ·  RFN54 — Alertas
# ══════════════════════════════════════════════════════════════
def reporte_rentabilidad(dias=28, fecha=None):
    fecha   = date.fromisoformat(fecha) if isinstance(fecha, str) and fecha \
              else (fecha or hoy_local())
    cfg     = get_config()
    umbral  = cfg.margen_minimo_pct
    precios = Precios()
    insumos = {i.id_insumo: i for i in Insumo.objects.all()}

    recetas = {r.id_producto_id: r for r in
               Receta.objects.filter(activa=True).prefetch_related('detalles')}
    hoy     = hoy_local()
    vendido = defaultdict(lambda: [0, CERO])
    for f in _ventas_diarias(hoy - timedelta(days=dias), hoy - timedelta(days=1)):
        vendido[f['id_producto_id']][0] += f['unidades']
        vendido[f['id_producto_id']][1] += f['importe'] or CERO

    filas = []
    for p in Producto.objects.all():
        receta = recetas.get(p.id_producto)
        costo, faltan, mayor = None, [], None
        if receta:
            costo, parcial = CERO, []
            for d in receta.detalles.all():
                pr = precios.precio_en(d.id_insumo_id, fecha)
                nombre = insumos[d.id_insumo_id].nombre
                if pr is None:
                    faltan.append(nombre)
                    continue
                c = d.cantidad_por_porcion * pr
                costo += c
                parcial.append((c, nombre))
            if parcial:
                c, nombre = max(parcial)
                mayor = {'insumo': nombre, 'costo': num(c, 4)}
        if receta is None:
            estado = 'sin_receta'
        elif faltan:
            estado = 'costo_incompleto'
        else:
            estado = None

        margen = margen_pct = None
        if estado is None and p.precio > 0:
            margen     = p.precio - costo
            margen_pct = margen / p.precio * CIEN
            estado     = 'no_rentable' if margen_pct < umbral else 'rentable'
        elif estado is None:
            estado = 'sin_precio_venta'
        u = vendido[p.id_producto][0]
        filas.append({
            'id_producto':      p.id_producto,
            'nombre':           p.nombre,
            'categoria':        p.categoria,
            'disponible':       p.disponible,
            'precio_venta':     num(p.precio),
            'costo_preparacion': num(costo, 4) if costo is not None else None,
            'costo_es_parcial': bool(faltan),
            'margen':           num(margen) if margen is not None else None,
            'margen_pct':       num(margen_pct, 1) if margen_pct is not None else None,
            'estado':           estado,
            'insumos_sin_precio': faltan,
            'insumo_mayor_costo': mayor,
            'unidades_vendidas': u,
            'utilidad_total':   num(margen * u) if margen is not None else None,
        })
    filas.sort(key=lambda r: (r['margen_pct'] is None, r['margen_pct'] or 0,
                              r['nombre']))
    medidos = [r['margen_pct'] for r in filas if r['margen_pct'] is not None]
    return {
        'fecha_valorizacion': fecha.isoformat(),
        'dias_ventas':        dias,
        'umbral_margen_pct':  num(umbral),
        'platos':             filas,
        'resumen': {
            'total':            len(filas),
            'rentables':        sum(1 for r in filas if r['estado'] == 'rentable'),
            'no_rentables':     sum(1 for r in filas if r['estado'] == 'no_rentable'),
            'sin_receta':       sum(1 for r in filas if r['estado'] == 'sin_receta'),
            'costo_incompleto': sum(1 for r in filas if r['estado'] == 'costo_incompleto'),
            'margen_promedio_pct': num(sum(medidos) / len(medidos), 1) if medidos else None,
        },
        'insumos_sin_precio': precios.detalle_sin_precio(),
        'valorizaciones_aproximadas': precios.aproximados,
    }


def alertas_rentabilidad(rep=None):
    """RFN54 — platos bajo el umbral, con sugerencia de precio o receta."""
    rep    = rep or reporte_rentabilidad()
    umbral = Decimal(str(rep['umbral_margen_pct']))
    alertas = []
    for r in rep['platos']:
        if r['estado'] != 'no_rentable':
            continue
        costo = dec(r['costo_preparacion'])
        sugerido = (costo / (UNO - umbral / CIEN) * 10).quantize(
            Decimal('1'), ROUND_CEILING) / 10          # sube a múltiplos de S/ 0.10
        txt = (f"Margen {r['margen_pct']}% menor al mínimo {num(umbral, 1)}%. "
               f"Revisar el precio de venta (sugerido S/ {num(sugerido)}) "
               f"o la receta")
        if r['insumo_mayor_costo']:
            txt += f" (insumo de mayor costo: {r['insumo_mayor_costo']['insumo']})"
        alertas.append({**r, 'precio_sugerido': num(sugerido),
                        'sugerencia': txt + '.'})
    return {'umbral_margen_pct': rep['umbral_margen_pct'],
            'total': len(alertas), 'alertas': alertas}


# ══════════════════════════════════════════════════════════════
# RFN53 — Reporte de ingresos y gastos por período
# ══════════════════════════════════════════════════════════════
def resumen_financiero(agrupar='dia', desde=None, hasta=None):
    hoy     = hoy_local()
    largo   = {'dia': 30, 'semana': 84, 'mes': 180}[agrupar]
    desde   = date.fromisoformat(desde) if isinstance(desde, str) and desde else desde
    hasta   = date.fromisoformat(hasta) if isinstance(hasta, str) and hasta else hasta
    hasta   = hasta or hoy
    desde   = desde or hasta - timedelta(days=largo - 1)

    def periodo(d):
        return (d if agrupar == 'dia'
                else d - timedelta(days=d.weekday()) if agrupar == 'semana'
                else d.replace(day=1))

    def siguiente(d):
        if agrupar == 'dia':
            return d + timedelta(days=1)
        if agrupar == 'semana':
            return d + timedelta(days=7)
        return (d.replace(day=28) + timedelta(days=4)).replace(day=1)

    filas, d = {}, periodo(desde)
    while d <= hasta:
        filas[d] = {'ingresos': CERO, 'compras': CERO, 'merma': CERO}
        d = siguiente(d)

    precios  = Precios()
    ini, fin = _limites(desde, hasta)

    for r in (Pago.objects.filter(estado='completado')
              .annotate(dia=TruncDate('fecha_cobro', tzinfo=TZ))
              .filter(dia__gte=desde, dia__lte=hasta)
              .values('dia').annotate(t=Sum('monto_total'))):
        filas[periodo(r['dia'])]['ingresos'] += r['t']

    for r in _compras_valorizadas(desde, hasta, precios):
        filas[periodo(r['fecha'])]['compras'] += r['monto']

    for m in Merma.objects.filter(fecha_registro__gte=ini, fecha_registro__lt=fin):
        f = a_local(m.fecha_registro)
        filas[periodo(f)]['merma'] += precios.valorizar(m.id_insumo_id,
                                                        m.cantidad, f)
    out, tot = [], {'ingresos': CERO, 'compras': CERO, 'merma': CERO}
    for p, v in filas.items():
        neto = v['ingresos'] - v['compras']
        for k in tot:
            tot[k] += v[k]
        out.append({
            'periodo': p.isoformat(),
            'ingresos': num(v['ingresos']), 'gastos_compras': num(v['compras']),
            'merma_valorizada': num(v['merma']), 'resultado_neto': num(neto),
            'margen_pct': (num(neto / v['ingresos'] * CIEN, 1)
                           if v['ingresos'] > 0 else None)})
    neto_t = tot['ingresos'] - tot['compras']
    return {
        'agrupar': agrupar, 'desde': desde.isoformat(), 'hasta': hasta.isoformat(),
        # La merma ya está dentro de las compras (se compró y se perdió),
        # por eso se informa pero no se resta una segunda vez.
        'nota': ('Resultado neto = ingresos − gastos en compras. La merma '
                 'valorizada ya está incluida en las compras.'),
        'periodos': out,
        'totales': {'ingresos': num(tot['ingresos']),
                    'gastos_compras': num(tot['compras']),
                    'merma_valorizada': num(tot['merma']),
                    'resultado_neto': num(neto_t),
                    'margen_pct': (num(neto_t / tot['ingresos'] * CIEN, 1)
                                   if tot['ingresos'] > 0 else None)},
        'insumos_sin_precio': precios.detalle_sin_precio(),
        'valorizaciones_aproximadas': precios.aproximados,
    }


# ══════════════════════════════════════════════════════════════
# RFN55 — Plan de compras de la semana siguiente  ·  RFN60 — CSV
# ══════════════════════════════════════════════════════════════
def _plan(consumo, precios):
    hoy, grupos, total = hoy_local(), defaultdict(list), CERO
    for it in consumo['items']:
        if it['cantidad_a_comprar'] <= 0:
            continue
        precio = precios.precio_en(it['id_insumo'], hoy)
        costo  = dec(it['cantidad_a_comprar']) * precio if precio is not None else None
        if costo is not None:
            total += costo
        grupos[it['distribuidora'] or SIN_PROVEEDOR].append({
            'id_insumo': it['id_insumo'], 'nombre': it['nombre'],
            'categoria': it['categoria'], 'unidad_medida': it['unidad_medida'],
            'stock_actual': it['stock_actual'], 'stock_minimo': it['stock_minimo'],
            'en_camino': it['en_camino'],
            'necesidad_estimada': it['necesidad_estimada'],
            'cantidad_a_comprar': it['cantidad_a_comprar'],
            'precio_unitario': num(precio, 4) if precio is not None else None,
            'costo_estimado': num(costo) if costo is not None else None,
            'riesgo_quiebre': it['riesgo_quiebre'],
            'frecuencia_dias': it['frecuencia_dias'],
        })
    lista = []
    for dist in sorted(grupos, key=lambda d: (d == SIN_PROVEEDOR, d.lower())):
        its = grupos[dist]
        lista.append({'distribuidora': dist, 'items': its,
                      'subtotal': num(sum(i['costo_estimado'] or 0 for i in its))})
    return {
        'desde': consumo['fechas'][0], 'hasta': consumo['fechas'][-1],
        'confianza': consumo['confianza'],
        'grupos': lista,
        'total_items': sum(len(g['items']) for g in lista),
        'total_estimado': num(total),
        'insumos_sin_precio': precios.detalle_sin_precio(),
        'productos_sin_receta': consumo['productos_sin_receta'],
    }


def plan_de_compras(dias_historial=28):
    return _plan(proyectar_consumo('semana', dias_historial), Precios())


def plan_a_csv(plan):
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(['Distribuidora', 'Insumo', 'Categoría', 'Unidad',
                'Stock actual', 'En camino', 'Necesidad estimada',
                'Cantidad a comprar', 'Precio unitario', 'Costo estimado',
                'Riesgo de quiebre', 'Frecuencia sugerida (días)'])
    for g in plan['grupos']:
        for i in g['items']:
            w.writerow([g['distribuidora'], i['nombre'], i['categoria'],
                        i['unidad_medida'], i['stock_actual'], i['en_camino'],
                        i['necesidad_estimada'], i['cantidad_a_comprar'],
                        '' if i['precio_unitario'] is None else i['precio_unitario'],
                        '' if i['costo_estimado'] is None else i['costo_estimado'],
                        i['riesgo_quiebre'], i['frecuencia_dias']])
    w.writerow([])
    w.writerow(['', 'TOTAL ESTIMADO', '', '', '', '', '', '', '',
                plan['total_estimado']])
    return '\ufeff' + out.getvalue()          # BOM para que Excel lea tildes


# ══════════════════════════════════════════════════════════════
# RFN56 — Dashboard de proyecciones
# ══════════════════════════════════════════════════════════════
def dashboard_proyecciones(dias_historial=28):
    dem, mapa = _demanda('semana', dias_historial)
    consumo   = _consumo(dem, mapa)
    precios   = Precios()
    gasto     = _gasto(consumo, precios)
    plan      = _plan(consumo, precios)
    rent      = reporte_rentabilidad(dias_historial)
    alertas   = alertas_rentabilidad(rent)

    ventas     = dem['ventas_estimadas']
    costo_cons = gasto['costo_consumo_estimado']
    margen     = ventas - costo_cons
    return {
        'confianza': dem['confianza'],
        'dias_operativos': dem['dias_operativos'],
        'ventas_estimadas_dia':    dem['por_dia'][0]['ventas_estimadas'],
        'ventas_estimadas_semana': ventas,
        'unidades_estimadas_semana': dem['total_unidades'],
        'gasto_estimado_insumos':  gasto['gasto_estimado_compras'],
        'costo_consumo_estimado':  costo_cons,
        'variacion_gasto_pct':     gasto['variacion_pct'],
        'margen_esperado':         num(margen),
        'margen_esperado_pct':     num(margen / ventas * 100, 1) if ventas > 0 else None,
        # Sin precio en algún insumo el costo se subestima → margen optimista
        'margen_confiable':        not gasto['insumos_sin_precio'],
        'insumos_sin_precio':      gasto['insumos_sin_precio'],
        'alertas_rentabilidad':    alertas['alertas'][:6],
        'total_alertas_rentabilidad': alertas['total'],
        'alertas_quiebre':         [r for r in consumo['items']
                                    if r['riesgo_quiebre'] == 'alto'][:8],
        'total_alertas_quiebre':   consumo['resumen']['riesgo_alto'],
        'mayor_rotacion':          dem['mayor_rotacion'],
        'menor_rotacion':          dem['menor_rotacion'],
        'plan_total_items':        plan['total_items'],
        'productos_sin_receta':    consumo['productos_sin_receta'],
        'serie': ([{'fecha': h['fecha'], 'ventas': h['ventas'], 'tipo': 'real'}
                   for h in dem['historico_diario'][-14:]] +
                  [{'fecha': p['fecha'], 'ventas': p['ventas_estimadas'],
                    'tipo': 'proyectado'} for p in dem['por_dia']]),
    }


# ══════════════════════════════════════════════════════════════
# Parámetros y registro de generadores (RFN61 reutiliza los mismos)
# ══════════════════════════════════════════════════════════════
def _entero(raw, clave, defecto, mn, mx):
    try:
        v = int(raw.get(clave) or defecto)
    except (TypeError, ValueError):
        raise ValueError(f"'{clave}' debe ser un número entero")
    if not mn <= v <= mx:
        raise ValueError(f"'{clave}' debe estar entre {mn} y {mx}")
    return v


def _fecha(raw, clave):
    v = raw.get(clave)
    if not v:
        return None
    d = parse_date(str(v))
    if d is None:
        raise ValueError(f"'{clave}' debe tener formato AAAA-MM-DD")
    return d.isoformat()


def normalizar_parametros(tipo, raw):
    """Valida y normaliza los parámetros (dict o QueryDict) de un reporte."""
    raw, p = raw or {}, {}
    if tipo not in NOMBRES_TIPO:
        raise ValueError('Tipo de proyección no válido')
    if tipo in ('demanda', 'consumo', 'gasto'):
        p['horizonte'] = raw.get('horizonte') or 'semana'
        if p['horizonte'] not in ('dia', 'semana'):
            raise ValueError("'horizonte' debe ser 'dia' o 'semana'")
    if tipo in ('demanda', 'consumo', 'gasto', 'compras'):
        p['dias_historial'] = _entero(raw, 'dias_historial', 28, 7, 180)
    if tipo == 'rentabilidad':
        p['dias']  = _entero(raw, 'dias', 28, 7, 180)
        p['fecha'] = _fecha(raw, 'fecha')
    if tipo == 'financiero':
        p['agrupar'] = raw.get('agrupar') or 'dia'
        if p['agrupar'] not in ('dia', 'semana', 'mes'):
            raise ValueError("'agrupar' debe ser 'dia', 'semana' o 'mes'")
        p['desde'], p['hasta'] = _fecha(raw, 'desde'), _fecha(raw, 'hasta')
        if p['desde'] and p['hasta'] and p['desde'] > p['hasta']:
            raise ValueError("'desde' no puede ser posterior a 'hasta'")
    return p


GENERADORES = {
    'demanda':      lambda p: proyectar_demanda(p['horizonte'], p['dias_historial']),
    'consumo':      lambda p: proyectar_consumo(p['horizonte'], p['dias_historial']),
    'gasto':        lambda p: estimar_gasto(p['horizonte'], p['dias_historial']),
    'rentabilidad': lambda p: reporte_rentabilidad(p['dias'], p.get('fecha')),
    'financiero':   lambda p: resumen_financiero(p['agrupar'], p.get('desde'),
                                                 p.get('hasta')),
    'compras':      lambda p: plan_de_compras(p['dias_historial']),
}
