import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Trash2, 
  DollarSign, 
  CreditCard, 
  Coins, 
  Calendar, 
  ArrowUpDown,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearFecha, exportarACSV, exportarAJSON } from '../utils/helpers';
import TicketModal from '../components/TicketModal';
import FirebaseModal from '../components/FirebaseModal';

export default function Pedidos() {
  const { 
    pedidosHistorial, 
    setTicketPedido, 
    setIsTicketModalOpen, 
    eliminarPedidoHistorial,
    mostrarNotificacion 
  } = usePedidos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('todos'); // 'todos' | 'efectivo' | 'transferencia'
  const [filtroFecha, setFiltroFecha] = useState('todos'); // 'todos' | 'hoy' | 'ayer' | 'semana'
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);

  // Filtrado de pedidos
  const pedidosFiltrados = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    
    return pedidosHistorial.filter((p) => {
      // 1. Filtro por texto / búsqueda
      const ordenStr = p.numeroOrden ? p.numeroOrden.toString() : '';
      const mesaStr = p.mesa ? `mesa ${p.mesa}` : '';
      const prodsStr = (p.productos || []).map((i) => i.nombre).join(' ').toLowerCase();
      const matchBusqueda = 
        ordenStr.includes(busqueda.toLowerCase()) ||
        mesaStr.includes(busqueda.toLowerCase()) ||
        prodsStr.includes(busqueda.toLowerCase());

      if (busqueda && !matchBusqueda) return false;

      // 2. Filtro por Método de Pago
      if (filtroMetodo !== 'todos' && p.metodoPago !== filtroMetodo) {
        return false;
      }

      // 3. Filtro por Fecha
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
      if (filtroFecha === 'hoy') {
        return fechaP === hoy;
      } else if (filtroFecha === 'semana') {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return new Date(p.fecha) >= hace7Dias;
      }

      return true;
    });
  }, [pedidosHistorial, busqueda, filtroMetodo, filtroFecha]);

  // Cálculos del resumen de la vista actual
  const totalVentas = pedidosFiltrados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalEfectivo = pedidosFiltrados
    .filter((p) => p.metodoPago === 'efectivo')
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalTransferencia = pedidosFiltrados
    .filter((p) => p.metodoPago === 'transferencia')
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  const handleVerTicket = (pedido) => {
    setTicketPedido(pedido);
    setIsTicketModalOpen(true);
  };

  const handleExportarCSV = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay pedidos para exportar', 'error');
      return;
    }
    exportarACSV(pedidosFiltrados, `el_garaje_pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    mostrarNotificacion('Archivo CSV exportado exitosamente', 'success');
  };

  const handleExportarJSON = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay pedidos para exportar', 'error');
      return;
    }
    exportarAJSON(pedidosFiltrados, `el_garaje_pedidos_${new Date().toISOString().split('T')[0]}.json`);
    mostrarNotificacion('Archivo JSON exportado exitosamente', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Encabezado y Botones de Exportación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>Historial de Pedidos Cobrados</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Registro de todas las órdenes procesadas y sincronizadas en Firestore.
          </p>
        </div>

        {/* Acciones de exportación */}
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

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total en Lista</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
            {formatearDinero(totalVentas)}
          </div>
          <span className="text-[11px] text-slate-500">{pedidosFiltrados.length} pedidos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total Efectivo</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
            {formatearDinero(totalEfectivo)}
          </div>
          <span className="text-[11px] text-slate-500">Recaudación en caja</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Total Transferencias</span>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">
            {formatearDinero(totalTransferencia)}
          </div>
          <span className="text-[11px] text-slate-500">DeUna / Bancos</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Ticket Promedio</span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {pedidosFiltrados.length > 0 ? formatearDinero(totalVentas / pedidosFiltrados.length) : '$0.00'}
          </div>
          <span className="text-[11px] text-slate-500">Por comanda</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por orden #, mesa o producto..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filtro Método de Pago */}
        <div className="flex items-center gap-2">
          <select
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Métodos de Pago</option>
            <option value="efectivo">Solo Efectivo</option>
            <option value="transferencia">Solo Transferencia</option>
          </select>
        </div>

        {/* Filtro de Rango Fecha */}
        <div className="flex items-center gap-2">
          <select
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todo el Historial</option>
            <option value="hoy">Solo Hoy</option>
            <option value="semana">Últimos 7 Días</option>
          </select>
        </div>

      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Orden</th>
                <th className="py-3.5 px-4">Mesa</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Productos</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-slate-800/50 transition-colors">
                    
                    {/* Orden # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      #{pedido.numeroOrden}
                    </td>

                    {/* Mesa */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-white">
                        Mesa {pedido.mesa}
                      </span>
                    </td>

                    {/* Fecha y Hora */}
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                      {formatearFecha(pedido.fecha)}
                    </td>

                    {/* Resumen de Productos */}
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {(pedido.productos || []).map((item, i) => (
                        <span key={i} className="inline-block mr-1.5 text-xs text-slate-300">
                          <span className="font-bold text-amber-400">{item.cantidad}x</span> {item.nombre}
                          {item.variante ? ` (${item.variante})` : ''}
                          {i < pedido.productos.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </td>

                    {/* Método de Pago */}
                    <td className="py-3.5 px-4">
                      {pedido.metodoPago === 'efectivo' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Coins className="w-3.5 h-3.5" />
                          <span>Efectivo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Transferencia {pedido.banco ? `(${pedido.banco})` : ''}</span>
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-black font-mono text-base text-white">
                      {formatearDinero(pedido.total)}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerTicket(pedido)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
                          title="Ver e Imprimir Ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrdenAEliminar(pedido)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                          title="Eliminar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No hay pedidos registrados</p>
                    <p className="text-xs">Los pedidos cobrados desde las mesas aparecerán aquí automáticamente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación para eliminar orden */}
      {ordenAEliminar && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">¿Eliminar Orden #{ordenAEliminar.numeroOrden}?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Esta acción eliminará el pedido de la base de datos de Firestore y de las estadísticas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOrdenAEliminar(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarPedidoHistorial(ordenAEliminar.id);
                  setOrdenAEliminar(null);
                }}
                className="py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <TicketModal />
      <FirebaseModal />

    </div>
  );
}
