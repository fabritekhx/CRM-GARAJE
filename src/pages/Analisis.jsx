import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Coins, 
  Receipt, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  FileText,
  PieChart as PieIcon, 
  UtensilsCrossed, 
  ArrowUpRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Globe
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { 
  formatearDinero, 
  formatearDiaLegible,
  exportarACSV, 
  exportarAJSON 
} from '../utils/helpers';
import { 
  GraficoBarrasVentas, 
  GraficoPastelMetodos, 
  GraficoLineaVentas, 
  GraficoTopProductos 
} from '../components/Charts';
import FirebaseModal from '../components/FirebaseModal';
import ReportePDFModal from '../components/ReportePDFModal';

export default function Analisis() {
  const { pedidosHistorial, mostrarNotificacion } = usePedidos();

  // Modos de análisis: 'dia' (un día exacto) | 'rango' (período de días) | 'todos' (historial total)
  const [modoAnalisis, setModoAnalisis] = useState('dia');

  // Fecha seleccionada para análisis de un solo día (por defecto Hoy)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Opciones predefinidas de rango o personalizado
  const [tipoRango, setTipoRango] = useState('7dias'); // '7dias' | '30dias' | 'mesActual' | 'custom'
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);

  // Filtro de método de pago
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  // Navegar entre días
  const cambiarDia = (offset) => {
    const [y, m, d] = (fechaSeleccionada || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    const nuevoYear = date.getFullYear();
    const nuevoMes = String(date.getMonth() + 1).padStart(2, '0');
    const nuevoDia = String(date.getDate()).padStart(2, '0');
    setFechaSeleccionada(`${nuevoYear}-${nuevoMes}-${nuevoDia}`);
  };

  const irAHoy = () => {
    setFechaSeleccionada(new Date().toISOString().split('T')[0]);
    setModoAnalisis('dia');
  };

  const irAAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFechaSeleccionada(d.toISOString().split('T')[0]);
    setModoAnalisis('dia');
  };

  const seleccionarRangoPredefinido = (tipo) => {
    setTipoRango(tipo);
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    setFechaFin(hoyStr);

    if (tipo === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFechaInicio(d.toISOString().split('T')[0]);
    } else if (tipo === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFechaInicio(d.toISOString().split('T')[0]);
    } else if (tipo === 'mesActual') {
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    }
  };

  // Filtrado estricto de pedidos según el modo seleccionado
  const pedidosFiltrados = useMemo(() => {
    return pedidosHistorial.filter((p) => {
      if (p.estado === 'cancelado') return false;

      // Filtro por método de pago
      if (filtroMetodo !== 'todos' && p.metodoPago !== filtroMetodo) {
        return false;
      }

      // Filtro por Fecha
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';

      if (modoAnalisis === 'dia') {
        return fechaP === fechaSeleccionada;
      } else if (modoAnalisis === 'rango') {
        if (fechaInicio && fechaFin) {
          return fechaP >= fechaInicio && fechaP <= fechaFin;
        }
      } else if (modoAnalisis === 'todos') {
        return true;
      }

      return true;
    });
  }, [pedidosHistorial, modoAnalisis, fechaSeleccionada, fechaInicio, fechaFin, filtroMetodo]);

  // Cálculos de KPIs del conjunto filtrado
  const totalVendido = pedidosFiltrados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  
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

  const totalPedidos = pedidosFiltrados.length;
  const ticketPromedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0;

  // Agrupación para gráficos
  // Si estamos en modo de 1 solo día: Agrupar por HORA del día (12:00, 13:00...)
  // Si estamos en modo rango o todos: Agrupar por DÍA (YYYY-MM-DD)
  const datosGraficos = useMemo(() => {
    if (modoAnalisis === 'dia') {
      const mapaHoras = {};

      // Inicializar franjas de horas habituales de atención (11:00 a 23:00) o registrar las existentes
      pedidosFiltrados.forEach((p) => {
        let horaStr = '12:00';
        try {
          const dateObj = new Date(p.fecha);
          const h = dateObj.getHours();
          horaStr = `${String(h).padStart(2, '0')}:00`;
        } catch {
          horaStr = '12:00';
        }

        if (!mapaHoras[horaStr]) {
          mapaHoras[horaStr] = { hora: horaStr, efectivo: 0, transferencia: 0, total: 0, cantidad: 0 };
        }

        const monto = Number(p.total) || 0;
        mapaHoras[horaStr].total += monto;
        mapaHoras[horaStr].cantidad += 1;

        if (p.metodoPago === 'efectivo') {
          mapaHoras[horaStr].efectivo += monto;
        } else if (p.metodoPago === 'transferencia') {
          mapaHoras[horaStr].transferencia += monto;
        } else if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') {
          mapaHoras[horaStr].efectivo += Number(p.montoEfectivo) || 0;
          mapaHoras[horaStr].transferencia += Number(p.montoTransferencia) || 0;
        } else {
          mapaHoras[horaStr].efectivo += monto;
        }
      });

      return Object.values(mapaHoras).sort((a, b) => a.hora.localeCompare(b.hora));
    }

    // Modo rango o todos: agrupar por fecha
    const mapaDias = {};
    pedidosFiltrados.forEach((p) => {
      const f = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
      if (!mapaDias[f]) {
        mapaDias[f] = { fecha: f, efectivo: 0, transferencia: 0, total: 0, cantidad: 0 };
      }
      const monto = Number(p.total) || 0;
      mapaDias[f].total += monto;
      mapaDias[f].cantidad += 1;
      
      if (p.metodoPago === 'efectivo') {
        mapaDias[f].efectivo += monto;
      } else if (p.metodoPago === 'transferencia') {
        mapaDias[f].transferencia += monto;
      } else if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') {
        mapaDias[f].efectivo += Number(p.montoEfectivo) || 0;
        mapaDias[f].transferencia += Number(p.montoTransferencia) || 0;
      } else {
        mapaDias[f].efectivo += monto;
      }
    });

    return Object.values(mapaDias).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [pedidosFiltrados, modoAnalisis]);

  // Datos para gráfico de pastel
  const datosPastel = useMemo(() => {
    return [
      { name: 'Efectivo', value: totalEfectivo },
      { name: 'Transferencia', value: totalTransferencia },
    ];
  }, [totalEfectivo, totalTransferencia]);

  // Ranking de productos más vendidos en el período seleccionado
  const rankingProductos = useMemo(() => {
    const conteo = {};
    pedidosFiltrados.forEach((p) => {
      (p.productos || []).forEach((prod) => {
        const key = `${prod.nombre}${prod.variante ? ` (${prod.variante})` : ''}`;
        if (!conteo[key]) {
          conteo[key] = {
            nombre: key,
            cantidad: 0,
            totalGenerado: 0,
            categoria: prod.categoria || 'Menú',
          };
        }
        conteo[key].cantidad += Number(prod.cantidad) || 1;
        conteo[key].totalGenerado += (Number(prod.precioUnitario) || 0) * (Number(prod.cantidad) || 1);
      });
    });

    return Object.values(conteo).sort((a, b) => b.cantidad - a.cantidad);
  }, [pedidosFiltrados]);

  const handleExportarCSV = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay datos para exportar en este período', 'error');
      return;
    }
    const sufijo = modoAnalisis === 'dia' ? fechaSeleccionada : (modoAnalisis === 'rango' ? `${fechaInicio}_a_${fechaFin}` : 'total_completo');
    exportarACSV(pedidosFiltrados, `reporte_ventas_${sufijo}.csv`);
    mostrarNotificacion('Reporte CSV exportado exitosamente', 'success');
  };

  const handleExportarJSON = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay datos para exportar en este período', 'error');
      return;
    }
    const sufijo = modoAnalisis === 'dia' ? fechaSeleccionada : (modoAnalisis === 'rango' ? `${fechaInicio}_a_${fechaFin}` : 'total_completo');
    exportarAJSON(pedidosFiltrados, `reporte_ventas_${sufijo}.json`);
    mostrarNotificacion('Reporte JSON exportado exitosamente', 'success');
  };

  const esFechaHoy = fechaSeleccionada === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* Cabecera y Controles Principales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Análisis y Estadísticas de Ventas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Analiza un día específico, un rango de fechas o el total completo de tu negocio.
          </p>
        </div>

        {/* Acciones de exportación */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPDFModalOpen(true)}
            disabled={pedidosFiltrados.length === 0}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title="Generar reporte detallado en PDF con efectivo, transferencias y ganancias"
          >
            <FileText className="w-4 h-4" />
            <span>Reporte PDF Detallado</span>
          </button>
          <button
            type="button"
            onClick={handleExportarCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportarJSON}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Selector Separado de Modos de Análisis */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Modos Principales Separados */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            
            {/* Opción 1: Un Día Específico */}
            <button
              type="button"
              onClick={() => setModoAnalisis('dia')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoAnalisis === 'dia'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Un Solo Día</span>
            </button>

            {/* Opción 2: Rango de Días */}
            <button
              type="button"
              onClick={() => setModoAnalisis('rango')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoAnalisis === 'rango'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rango de Fechas</span>
            </button>

            {/* Opción 3: Total Completo */}
            <button
              type="button"
              onClick={() => setModoAnalisis('todos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoAnalisis === 'todos'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Total Completo</span>
            </button>

          </div>

          {/* Filtro de Método de Pago */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="todos">Todos los Métodos</option>
              <option value="efectivo">Solo Efectivo</option>
              <option value="transferencia">Solo Transferencia</option>
              <option value="mixto">Pago Combinado (Mixto)</option>
              <option value="dividido">Cuentas Separadas (Dividido)</option>
            </select>
          </div>

        </div>

        {/* Panel de Controles para MODO 'UN SOLO DÍA' */}
        {modoAnalisis === 'dia' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => cambiarDia(-1)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Día Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => cambiarDia(1)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Día Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botones rápidos */}
              <button
                type="button"
                onClick={irAHoy}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  esFechaHoy
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-black'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={irAAyer}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                Ayer
              </button>
            </div>

            {/* Fecha descriptiva */}
            <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatearDiaLegible(fechaSeleccionada)}</span>
            </div>

          </div>
        )}

        {/* Panel de Controles para MODO 'RANGO DE FECHAS' */}
        {modoAnalisis === 'rango' && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Predefinidos:</span>
              {[
                { id: '7dias', label: 'Últimos 7 Días' },
                { id: '30dias', label: 'Últimos 30 Días' },
                { id: 'mesActual', label: 'Mes Actual' },
                { id: 'custom', label: 'Personalizado' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => seleccionarRangoPredefinido(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    tipoRango === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setTipoRango('custom');
                  }}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setTipoRango('custom');
                  }}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* TARJETAS DE RESUMEN Y KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Facturado */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-slate-900 border border-amber-500/30">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            {modoAnalisis === 'dia' ? 'Venta del Día' : 'Total Vendido'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
            {formatearDinero(totalVendido)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {modoAnalisis === 'dia' ? `En ${pedidosFiltrados.length} comandas` : 'Ingresos del período'}
          </span>
        </div>

        {/* Total Efectivo */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">En Efectivo</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
            {formatearDinero(totalEfectivo)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {totalVendido > 0 ? `${((totalEfectivo / totalVendido) * 100).toFixed(0)}% del total` : '0%'}
          </span>
        </div>

        {/* Total Transferencias */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Transferencias</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">
            {formatearDinero(totalTransferencia)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {totalVendido > 0 ? `${((totalTransferencia / totalVendido) * 100).toFixed(0)}% del total` : '0%'}
          </span>
        </div>

        {/* Total de Pedidos / Comandas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              {modoAnalisis === 'dia' ? 'Órdenes Hoy' : 'Nº Comandas'}
            </span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {totalPedidos}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {modoAnalisis === 'dia' && totalPedidos > 0 ? `Órdenes #1 a #${totalPedidos}` : 'Comandas procesadas'}
          </span>
        </div>

        {/* Ticket Promedio */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Ticket Promedio</span>
            <ArrowUpRight className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {formatearDinero(ticketPromedio)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Gasto medio / comanda</span>
        </div>

      </div>

      {/* GRÁFICOS DINÁMICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Barras Efectivo vs Transferencia (Por Horas si es un día, por Días si es rango/todo) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>
                {modoAnalisis === 'dia'
                  ? `Ventas por Franja Horaria (${formatearDiaLegible(fechaSeleccionada)})`
                  : 'Comparativo Efectivo vs Transferencia por Día'
                }
              </span>
            </h3>
            {modoAnalisis === 'dia' && (
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horas pico</span>
              </span>
            )}
          </div>
          <GraficoBarrasVentas datos={datosGraficos} />
        </div>

        {/* Gráfico 2: Pastel de Distribución de Pagos */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>Distribución de Métodos de Pago</span>
            </h3>
          </div>
          <GraficoPastelMetodos datos={datosPastel} />
        </div>

        {/* Gráfico 3: Línea de Tendencia */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>
                {modoAnalisis === 'dia'
                  ? 'Evolución de Ventas a lo Largo del Día'
                  : 'Tendencia de Ventas Totales por Fecha'
                }
              </span>
            </h3>
          </div>
          <GraficoLineaVentas datos={datosGraficos} />
        </div>

        {/* Gráfico 4: Ranking Top Productos */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>
                {modoAnalisis === 'dia'
                  ? 'Platos Más Pedidos en Este Día'
                  : 'Top Productos Más Vendidos del Período'
                }
              </span>
            </h3>
          </div>
          <GraficoTopProductos datos={rankingProductos} />
        </div>

      </div>

      {/* TABLA DETALLADA DE PRODUCTOS VENDIDOS */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>
              {modoAnalisis === 'dia'
                ? `Detalle de Productos Vendidos el ${formatearDiaLegible(fechaSeleccionada)}`
                : 'Tabla Completa de Ventas por Producto'
              }
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {rankingProductos.length} productos diferentes vendidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Producto y Variante</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-center">Unidades Vendidas</th>
                <th className="py-3 px-4 text-right">Total Facturado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {rankingProductos.length > 0 ? (
                rankingProductos.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.nombre}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
                        {item.categoria || 'Menú'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {item.cantidad}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-white">
                      {formatearDinero(item.totalGenerado)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    {modoAnalisis === 'dia'
                      ? `No hubo productos registrados en la fecha ${fechaSeleccionada}`
                      : 'No hay productos vendidos en el rango seleccionado'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FirebaseModal />

      <ReportePDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        pedidos={pedidosFiltrados}
        titulo="Reporte Detallado de Ventas y Rendimiento"
        subtituloFecha={
          modoAnalisis === 'dia'
            ? formatearDiaLegible(fechaSeleccionada)
            : (modoAnalisis === 'rango' ? `Del ${fechaInicio} al ${fechaFin}` : 'Historial Total')
        }
        fechaReporte={fechaSeleccionada}
      />

    </div>
  );
}
