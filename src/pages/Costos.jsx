import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Coins, 
  CreditCard, 
  Calendar, 
  FileText, 
  Edit3, 
  Check, 
  X, 
  RotateCcw, 
  Search, 
  Filter, 
  UtensilsCrossed, 
  Beer, 
  CupSoda, 
  Soup, 
  Flame, 
  Fish, 
  Citrus, 
  ArrowUpDown, 
  ArrowUpRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Info,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { MENU, CATEGORIAS } from '../data/menu';
import { 
  obtenerCostosProductos, 
  guardarCostosProductos, 
  COSTOS_PREDETERMINADOS, 
  obtenerCostoUnitario 
} from '../data/costos';
import { formatearDinero, formatearFecha, formatearDiaLegible } from '../utils/helpers';
import ReportePDFModal from '../components/ReportePDFModal';

export default function Costos() {
  const { 
    pedidosHistorial, 
    fechaActualApp, 
    mostrarNotificacion,
    preciosMap,
    actualizarPrecioBaseProducto,
    restaurarPreciosBasePredeterminados 
  } = usePedidos();

  // Fecha seleccionada para ver rentabilidad del día
  const [modoFecha, setModoFecha] = useState('dia'); // 'dia' | 'rango' | 'todos'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaActualApp || new Date().toISOString().split('T')[0]);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtros de búsqueda y categoría
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [ordenCampo, setOrdenCampo] = useState('ganancia'); // 'ganancia' | 'margen' | 'nombre' | 'vendidos' | 'costo' | 'precio'
  const [ordenAsc, setOrdenAsc] = useState(false);

  // Mapa de costos reactivo
  const [costosMap, setCostosMap] = useState(() => obtenerCostosProductos());

  // Estado para edición rápida de costo en tabla
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [nuevoCostoTemp, setNuevoCostoTemp] = useState('');

  // Estado para edición rápida de precio de venta en tabla
  const [editandoPrecioProductoId, setEditandoPrecioProductoId] = useState(null);
  const [nuevoPrecioTemp, setNuevoPrecioTemp] = useState('');

  // Control del modal de PDF
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  // Navegar entre días
  const cambiarDia = (delta) => {
    const [y, m, d] = (fechaSeleccionada || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    const nuevoYear = date.getFullYear();
    const nuevoMes = String(date.getMonth() + 1).padStart(2, '0');
    const nuevoDia = String(date.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${nuevoYear}-${nuevoMes}-${nuevoDia}`);
  };

  const irAHoy = () => {
    setFechaSeleccionada(fechaActualApp || new Date().toISOString().split('T')[0]);
    setModoFecha('dia');
  };

  const irAAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFechaSeleccionada(d.toISOString().split('T')[0]);
    setModoFecha('dia');
  };

  // Filtrar pedidos según fecha seleccionada
  const pedidosFiltrados = useMemo(() => {
    return pedidosHistorial.filter((p) => {
      if (p.estado === 'cancelado') return false;
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
      
      if (modoFecha === 'dia') {
        return fechaP === fechaSeleccionada;
      } else if (modoFecha === 'rango') {
        return fechaP >= fechaInicio && fechaP <= fechaFin;
      }
      return true; // 'todos'
    });
  }, [pedidosHistorial, modoFecha, fechaSeleccionada, fechaInicio, fechaFin]);

  // Conteo de productos vendidos en el período seleccionado
  const ventasPorProducto = useMemo(() => {
    const mapa = {};
    pedidosFiltrados.forEach((p) => {
      (p.productos || []).forEach((item) => {
        const id = item.productoId || item.nombre;
        const cant = Number(item.cantidad) || 1;
        const precio = Number(item.precioUnitario) || 0;

        if (!mapa[id]) {
          mapa[id] = {
            cantidad: 0,
            totalVenta: 0,
          };
        }
        mapa[id].cantidad += cant;
        mapa[id].totalVenta += cant * precio;
      });
    });
    return mapa;
  }, [pedidosFiltrados]);

  // Lista unificada de productos (Catálogo completo de menú + ítems vendidos)
  const productosCalculados = useMemo(() => {
    return MENU.map((prod) => {
      const costo = Number(costosMap[prod.id] !== undefined ? costosMap[prod.id] : (COSTOS_PREDETERMINADOS[prod.id] || 0));
      const precioVenta = Number(preciosMap && preciosMap[prod.id] !== undefined ? preciosMap[prod.id] : prod.precioBase) || 0;
      const gananciaUnitaria = precioVenta - costo;
      const margenPorcentaje = precioVenta > 0 ? (gananciaUnitaria / precioVenta) * 100 : 0;

      const datosVenta = ventasPorProducto[prod.id] || { cantidad: 0, totalVenta: 0 };
      const unidadesVendidas = datosVenta.cantidad;
      const totalVendido = datosVenta.totalVenta;
      const costoTotalVendido = unidadesVendidas * costo;
      const gananciaPeriodo = totalVendido - costoTotalVendido;

      return {
        id: prod.id,
        nombre: prod.nombre,
        categoria: prod.categoria,
        descripcion: prod.descripcion,
        precioVenta,
        costo,
        gananciaUnitaria,
        margenPorcentaje,
        unidadesVendidas,
        totalVendido,
        costoTotalVendido,
        gananciaPeriodo,
      };
    });
  }, [costosMap, preciosMap, ventasPorProducto]);

  // Filtrado y ordenamiento de la tabla
  const productosFiltrados = useMemo(() => {
    return productosCalculados
      .filter((p) => {
        // Filtro categoría
        if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) {
          return false;
        }
        // Filtro búsqueda
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase().trim();
          return p.nombre.toLowerCase().includes(q) || (p.categoria && p.categoria.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (ordenCampo === 'ganancia') diff = a.gananciaPeriodo - b.gananciaPeriodo;
        else if (ordenCampo === 'margen') diff = a.margenPorcentaje - b.margenPorcentaje;
        else if (ordenCampo === 'vendidos') diff = a.unidadesVendidas - b.unidadesVendidas;
        else if (ordenCampo === 'costo') diff = a.costo - b.costo;
        else if (ordenCampo === 'precio') diff = a.precioVenta - b.precioVenta;
        else if (ordenCampo === 'nombre') return ordenAsc ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre);
        
        return ordenAsc ? diff : -diff;
      });
  }, [productosCalculados, categoriaFiltro, busqueda, ordenCampo, ordenAsc]);

  // Totales globales del período
  const totalVentasGlobal = productosCalculados.reduce((sum, p) => sum + p.totalVendido, 0);
  const totalCostoGlobal = productosCalculados.reduce((sum, p) => sum + p.costoTotalVendido, 0);
  const gananciaNetaGlobal = totalVentasGlobal - totalCostoGlobal;
  const margenPromedioGlobal = totalVentasGlobal > 0 ? (gananciaNetaGlobal / totalVentasGlobal) * 100 : 0;
  const totalUnidadesVendidas = productosCalculados.reduce((sum, p) => sum + p.unidadesVendidas, 0);

  // Totales en efectivo vs transferencia de los pedidos del período
  const totalEfectivo = pedidosFiltrados.reduce((sum, p) => {
    if (p.metodoPago === 'efectivo') return sum + (Number(p.total) || 0);
    if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') return sum + (Number(p.montoEfectivo) || 0);
    return sum;
  }, 0);

  const totalTransferencia = pedidosFiltrados.reduce((sum, p) => {
    if (p.metodoPago === 'transferencia') return sum + (Number(p.total) || 0);
    if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') return sum + (Number(p.montoTransferencia) || 0);
    return sum;
  }, 0);

  // Métricas por categorías clave solicitadas por el usuario (Porciones, Cervezas, Colas, Jugos, etc.)
  const metricasCategorias = useMemo(() => {
    const map = {
      porciones: { nombre: 'Porciones Extras', icono: UtensilsCrossed, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      cervezas: { nombre: 'Cervezas', icono: Beer, color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      gaseosas: { nombre: 'Gaseosas y Colas', icono: CupSoda, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      jugos: { nombre: 'Jugos Naturales', icono: Citrus, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      sabados: { nombre: 'Fritadas y Caldos', icono: Flame, color: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      domingos: { nombre: 'Encebollados y Mariscos', icono: Soup, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
      pescados: { nombre: 'Pescados Fritos (Viernes)', icono: Fish, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', venta: 0, costo: 0, ganancia: 0, cant: 0 },
    };

    productosCalculados.forEach((prod) => {
      const cat = map[prod.categoria];
      if (cat) {
        cat.venta += prod.totalVendido;
        cat.costo += prod.costoTotalVendido;
        cat.ganancia += prod.gananciaPeriodo;
        cat.cant += prod.unidadesVendidas;
      }
    });

    return Object.values(map);
  }, [productosCalculados]);

  // Guardar edición de costo de un producto
  const guardarEdicionCosto = (productoId) => {
    const valorNum = parseFloat(nuevoCostoTemp);
    if (isNaN(valorNum) || valorNum < 0) {
      mostrarNotificacion('Ingresa un costo válido (ejemplo: 1.50)', 'error');
      return;
    }

    const nuevosCostos = {
      ...costosMap,
      [productoId]: Number(valorNum.toFixed(2)),
    };

    setCostosMap(nuevosCostos);
    guardarCostosProductos(nuevosCostos);
    setEditandoProductoId(null);
    setNuevoCostoTemp('');
    mostrarNotificacion('Costo de compra actualizado y guardado', 'success');
  };

  // Guardar edición permanente de precio de venta de un producto
  const guardarEdicionPrecio = (productoId) => {
    const valorNum = parseFloat(nuevoPrecioTemp);
    if (isNaN(valorNum) || valorNum < 0) {
      mostrarNotificacion('Ingresa un precio de venta válido (ejemplo: 5.00)', 'error');
      return;
    }

    actualizarPrecioBaseProducto(productoId, valorNum);
    setEditandoPrecioProductoId(null);
    setNuevoPrecioTemp('');
    mostrarNotificacion('Precio de venta fijado en el menú correctamente', 'success');
  };

  // Restaurar todos los costos a predeterminados de fábrica
  const restaurarCostosPredeterminados = () => {
    if (window.confirm('¿Deseas restaurar todos los costos de compra a sus valores iniciales sugeridos?')) {
      setCostosMap({ ...COSTOS_PREDETERMINADOS });
      guardarCostosProductos({ ...COSTOS_PREDETERMINADOS });
      mostrarNotificacion('Costos restaurados a valores predeterminados', 'info');
    }
  };

  // Restaurar todos los precios de venta a predeterminados del menú
  const restaurarPreciosPredeterminados = () => {
    if (window.confirm('¿Deseas restaurar todos los precios de venta a los valores iniciales de la carta?')) {
      restaurarPreciosBasePredeterminados();
      mostrarNotificacion('Precios de venta restaurados a la carta original', 'info');
    }
  };

  const alternarOrden = (campo) => {
    if (ordenCampo === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenCampo(campo);
      setOrdenAsc(false);
    }
  };

  const getSubtituloFecha = () => {
    if (modoFecha === 'dia') return formatearDiaLegible(fechaSeleccionada);
    if (modoFecha === 'rango') return `Del ${formatearFecha(fechaInicio, 'dd/MM/yyyy')} al ${formatearFecha(fechaFin, 'dd/MM/yyyy')}`;
    return 'Todo el Historial Completo';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      
      {/* 1. Cabecera Principal y Botones de Acción */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Costos, Precios y Margen de Ganancia</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Compara cuánto compras y cuánto vendes para monitorear la ganancia neta diaria de tu restaurante.
              </p>
            </div>
          </div>
        </div>

        {/* Botón Destacado PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPDFModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
            title="Generar y descargar reporte detallado en PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Generar Reporte PDF Detallado</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Control de Fechas y Modos */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Selector de Modo */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setModoFecha('dia')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                modoFecha === 'dia' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Un Solo Día
            </button>
            <button
              type="button"
              onClick={() => setModoFecha('rango')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                modoFecha === 'rango' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rango de Días
            </button>
            <button
              type="button"
              onClick={() => setModoFecha('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                modoFecha === 'todos' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todo el Historial
            </button>
          </div>

          {/* Selector Dinámico según modo */}
          {modoFecha === 'dia' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irAHoy}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fechaSeleccionada === (fechaActualApp || new Date().toISOString().split('T')[0])
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={irAAyer}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Ayer
              </button>
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => cambiarDia(-1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs font-bold border-none focus:outline-none cursor-pointer px-1"
                />
                <button
                  type="button"
                  onClick={() => cambiarDia(1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {modoFecha === 'rango' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs font-bold border-none focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs font-bold border-none focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {modoFecha === 'todos' && (
            <span className="text-xs font-semibold text-slate-400">
              Mostrando métricas acumuladas desde el primer pedido
            </span>
          )}

        </div>

        {/* Indicador de Fecha Actual Seleccionada */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">{getSubtituloFecha()}</span>
          </div>
          <span>
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'comanda cobrada' : 'comandas cobradas'}
          </span>
        </div>
      </div>

      {/* 3. Tarjetas KPI de Rentabilidad y Ganancia Neta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Ventas Brutas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Brutas</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatearDinero(totalVentasGlobal)}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span>{totalUnidadesVendidas} unidades vendidas</span>
            </div>
          </div>
        </div>

        {/* Costo Insumos / Mercadería Comprada */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo de Insumos</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
              {formatearDinero(totalCostoGlobal)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Inversión en productos vendidos</p>
          </div>
        </div>

        {/* GANANCIA NETA REAL */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-orange-500/10 border border-amber-500/50 shadow-2xl shadow-amber-500/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ganancia Neta Real</span>
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {formatearDinero(gananciaNetaGlobal)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                {margenPromedioGlobal.toFixed(1)}% Margen
              </span>
              <span className="text-[11px] text-amber-200/80">Utilidad libre</span>
            </div>
          </div>
        </div>

        {/* Cuadre Efectivo vs Transferencias */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formas de Pago</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Efectivo:</span>
              <strong className="font-mono font-bold text-emerald-400">{formatearDinero(totalEfectivo)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Transferencia:</span>
              <strong className="font-mono font-bold text-blue-400">{formatearDinero(totalTransferencia)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Desglose Específico por Categorías Solicitadas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>Ganancias por Categorías (Porciones, Cervezas, Colas, Jugos, Platos)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {metricasCategorias.map((cat, idx) => {
            const Icono = cat.icono;
            return (
              <div 
                key={idx}
                className={`p-4 rounded-2xl bg-slate-900 border ${cat.border} shadow-lg flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${cat.bg} ${cat.color}`}>
                      <Icono className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-white">{cat.nombre}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                    {cat.cant} un.
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Venta Bruta:</span>
                    <span className="font-mono font-bold text-slate-200">{formatearDinero(cat.venta)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Costo Compra:</span>
                    <span className="font-mono font-bold text-rose-400/90">{formatearDinero(cat.costo)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-bold">
                    <span className="text-amber-400">Ganancia Neta:</span>
                    <span className="font-mono text-sm font-black text-emerald-400">
                      +{formatearDinero(cat.ganancia)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Tabla Comparativa de Productos: Precio de Compra vs Precio de Venta */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
        
        {/* Cabecera y Filtros de la Tabla */}
        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <span>Comparativa Detallada por Producto ({productosFiltrados.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en el icono del lápiz o en el valor de compra para editar y personalizar tus costos en cualquier momento.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Buscador */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
                />
              </div>

              {/* Filtro por Categoría */}
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="todas">Todas las Categorías</option>
                <option value="porciones">Porciones Extras</option>
                <option value="cervezas">Cervezas</option>
                <option value="gaseosas">Gaseosas y Colas</option>
                <option value="jugos">Jugos Naturales</option>
                <option value="sabados">Sábados: Fritadas y Caldos</option>
                <option value="domingos">Domingos: Encebollados y Mariscos</option>
                <option value="pescados">Viernes: Pescados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('nombre')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Producto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('costo')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Costo Compra</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('precio')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Precio Venta</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('margen')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Margen (%)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('vendidos')}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Vendidos</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Venta Total</th>
                <th className="py-3 px-3 text-right">Costo Total</th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                  onClick={() => alternarOrden('ganancia')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Ganancia Neta</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {productosFiltrados.map((prod) => {
                const estaEditandoCosto = editandoProductoId === prod.id;
                const estaEditandoPrecio = editandoPrecioProductoId === prod.id;
                
                // Color del badge de margen
                const margenColor = prod.margenPorcentaje >= 50 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : prod.margenPorcentaje >= 35 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Nombre y Categoría */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {prod.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {prod.categoria}
                        </span>
                      </div>
                    </td>

                    {/* Costo de Compra (Editable) */}
                    <td className="py-3 px-3 text-right font-mono">
                      {estaEditandoCosto ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={nuevoCostoTemp}
                            onChange={(e) => setNuevoCostoTemp(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') guardarEdicionCosto(prod.id);
                              if (e.key === 'Escape') setEditandoProductoId(null);
                            }}
                            className="w-16 py-1 px-1.5 rounded-lg bg-slate-950 border border-amber-500 text-white font-mono text-xs focus:outline-none text-right font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => guardarEdicionCosto(prod.id)}
                            className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            title="Guardar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoProductoId(null)}
                            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoProductoId(prod.id);
                            setNuevoCostoTemp(prod.costo.toFixed(2));
                          }}
                          className="group inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-400 font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Haz clic para editar el costo de compra"
                        >
                          <span>{formatearDinero(prod.costo)}</span>
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    {/* Precio de Venta (Editable) */}
                    <td className="py-3 px-3 text-right font-mono">
                      {estaEditandoPrecio ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400">$</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={nuevoPrecioTemp}
                            onChange={(e) => setNuevoPrecioTemp(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') guardarEdicionPrecio(prod.id);
                              if (e.key === 'Escape') setEditandoPrecioProductoId(null);
                            }}
                            className="w-16 py-1 px-1.5 rounded-lg bg-slate-950 border border-amber-500 text-white font-mono text-xs focus:outline-none text-right font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => guardarEdicionPrecio(prod.id)}
                            className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            title="Guardar precio fijo"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoPrecioProductoId(null)}
                            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoPrecioProductoId(prod.id);
                            setNuevoPrecioTemp(prod.precioVenta.toFixed(2));
                          }}
                          className="group inline-flex items-center gap-1.5 text-white font-bold hover:text-amber-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Haz clic para cambiar el precio de venta fijo en el menú"
                        >
                          <span>{formatearDinero(prod.precioVenta)}</span>
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </td>

                    {/* Margen Porcentual */}
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-black border font-mono ${margenColor}`}>
                        {prod.margenPorcentaje.toFixed(0)}%
                      </span>
                    </td>

                    {/* Unidades Vendidas */}
                    <td className="py-3 px-3 text-center">
                      {prod.unidadesVendidas > 0 ? (
                        <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          {prod.unidadesVendidas} un.
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">0</span>
                      )}
                    </td>

                    {/* Venta Total */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300 font-semibold">
                      {formatearDinero(prod.totalVendido)}
                    </td>

                    {/* Costo Total Insumo */}
                    <td className="py-3 px-3 text-right font-mono text-rose-400/90">
                      {formatearDinero(prod.costoTotalVendido)}
                    </td>

                    {/* Ganancia Neta */}
                    <td className="py-3 px-4 text-right font-mono font-black text-sm">
                      {prod.gananciaPeriodo > 0 ? (
                        <span className="text-emerald-400">+{formatearDinero(prod.gananciaPeriodo)}</span>
                      ) : prod.gananciaPeriodo < 0 ? (
                        <span className="text-rose-400">{formatearDinero(prod.gananciaPeriodo)}</span>
                      ) : (
                        <span className="text-slate-500">$0.00</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fila Footer de Totales */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-slate-400 font-bold">
            Total General del Período ({productosFiltrados.length} productos listados)
          </span>

          <div className="flex items-center gap-6 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Venta Total:</span>
              <strong className="text-white text-sm">{formatearDinero(totalVentasGlobal)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Costo Total:</span>
              <strong className="text-rose-400 text-sm">{formatearDinero(totalCostoGlobal)}</strong>
            </div>
            <div>
              <span className="text-amber-400 block text-[10px] font-bold">Ganancia Neta:</span>
              <strong className="text-emerald-400 text-sm font-black">+{formatearDinero(gananciaNetaGlobal)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Visor y Descargador de PDF Oficial */}
      <ReportePDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        pedidos={pedidosFiltrados}
        titulo="Reporte Detallado de Ventas, Costos y Ganancias"
        subtituloFecha={getSubtituloFecha()}
        fechaReporte={fechaSeleccionada}
        costosPersonalizados={costosMap}
      />

    </div>
  );
}
