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
  PieChart as PieIcon, 
  UtensilsCrossed, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { 
  formatearDinero, 
  formatearFechaCorta, 
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

export default function Analisis() {
  const { pedidosHistorial, mostrarNotificacion } = usePedidos();

  const [periodo, setPeriodo] = useState('mes'); // 'hoy' | 'semana' | 'mes' | 'todos' | 'custom'
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  // Filtrado de pedidos según fecha y método
  const pedidosFiltrados = useMemo(() => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    return pedidosHistorial.filter((p) => {
      if (p.estado !== 'pagado') return false;

      // Filtro por método de pago
      if (filtroMetodo !== 'todos' && p.metodoPago !== filtroMetodo) {
        return false;
      }

      // Filtro por fecha
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';

      if (periodo === 'hoy') {
        return fechaP === hoyStr;
      } else if (periodo === 'semana') {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return new Date(p.fecha) >= hace7Dias;
      } else if (periodo === 'mes') {
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        return new Date(p.fecha) >= hace30Dias;
      } else if (periodo === 'custom') {
        if (fechaInicio && fechaFin) {
          return fechaP >= fechaInicio && fechaP <= fechaFin;
        }
      }

      return true;
    });
  }, [pedidosHistorial, periodo, fechaInicio, fechaFin, filtroMetodo]);

  // Cálculos de KPIs
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

  // Agrupación por días para los gráficos
  const datosPorDia = useMemo(() => {
    const mapa = {};

    pedidosFiltrados.forEach((p) => {
      const f = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
      if (!mapa[f]) {
        mapa[f] = { fecha: f, efectivo: 0, transferencia: 0, total: 0, cantidad: 0 };
      }
      const monto = Number(p.total) || 0;
      mapa[f].total += monto;
      mapa[f].cantidad += 1;
      
      if (p.metodoPago === 'efectivo') {
        mapa[f].efectivo += monto;
      } else if (p.metodoPago === 'transferencia') {
        mapa[f].transferencia += monto;
      } else if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') {
        mapa[f].efectivo += Number(p.montoEfectivo) || 0;
        mapa[f].transferencia += Number(p.montoTransferencia) || 0;
      } else {
        mapa[f].efectivo += monto;
      }
    });

    return Object.values(mapa).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [pedidosFiltrados]);

  // Datos para gráfico de pastel
  const datosPastel = useMemo(() => {
    return [
      { name: 'Efectivo', value: totalEfectivo },
      { name: 'Transferencia', value: totalTransferencia },
    ];
  }, [totalEfectivo, totalTransferencia]);

  // Ranking de productos más vendidos
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
            categoria: prod.categoria,
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
      mostrarNotificacion('No hay datos para exportar', 'error');
      return;
    }
    exportarACSV(pedidosFiltrados, `reporte_ventas_${periodo}.csv`);
    mostrarNotificacion('Reporte CSV exportado exitosamente', 'success');
  };

  const handleExportarJSON = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay datos para exportar', 'error');
      return;
    }
    exportarAJSON(pedidosFiltrados, `reporte_ventas_${periodo}.json`);
    mostrarNotificacion('Reporte JSON exportado exitosamente', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* Cabecera y Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Análisis y Estadísticas de Ventas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Métricas de rendimiento comercial, distribución de pagos y productos estrella.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Barra de Filtros de Período y Método */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Botones de Período Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Últimos 7 días' },
              { id: 'mes', label: 'Últimos 30 días' },
              { id: 'todos', label: 'Todo el Historial' },
              { id: 'custom', label: 'Personalizado' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriodo(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  periodo === item.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Filtro de Método de Pago */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="todos">Todos los Métodos</option>
              <option value="efectivo">Solo Efectivo</option>
              <option value="transferencia">Solo Transferencia</option>
              <option value="mixto">Pago Combinado (Mixto)</option>
              <option value="dividido">Cuentas Separadas (Dividido)</option>
            </select>
          </div>

        </div>

        {/* Inputs de rango personalizado */}
        {periodo === 'custom' && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* TARJETAS DE RESUMEN DEL PERÍODO (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Vendido */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-slate-900 border border-amber-500/30">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Total Vendido</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
            {formatearDinero(totalVendido)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ingresos totales</span>
        </div>

        {/* Total en Efectivo */}
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

        {/* Total por Transferencia */}
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

        {/* Total de Pedidos */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Nº Comandas</span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {totalPedidos}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Órdenes procesadas</span>
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
          <span className="text-[11px] text-slate-400 mt-0.5 block">Gasto medio / mesa</span>
        </div>

      </div>

      {/* GRÁFICOS INTERACTIVOS CON RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Barras Efectivo vs Transferencia por Día (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Comparativo Efectivo vs Transferencia por Día</span>
            </h3>
          </div>
          <GraficoBarrasVentas datos={datosPorDia} />
        </div>

        {/* Gráfico 2: Pastel de Participación de Pagos (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <span>Distribución de Métodos de Pago</span>
            </h3>
          </div>
          <GraficoPastelMetodos datos={datosPastel} />
        </div>

        {/* Gráfico 3: Línea de Tendencia Diaria (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Tendencia de Ventas Diarias Totales</span>
            </h3>
          </div>
          <GraficoLineaVentas datos={datosPorDia} />
        </div>

        {/* Gráfico 4: Ranking de Productos Estrella (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Top Productos Más Vendidos</span>
            </h3>
          </div>
          <GraficoTopProductos datos={rankingProductos} />
        </div>

      </div>

      {/* TABLA DETALLADA DE PRODUCTOS VENDIDOS */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          <span>Tabla Completa de Ventas por Producto</span>
        </h3>

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
                    No hay productos vendidos en el rango seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FirebaseModal />

    </div>
  );
}
