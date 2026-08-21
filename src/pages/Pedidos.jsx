import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Coins, 
  CreditCard, 
  Layers,
  Users,
  Printer, 
  Trash2, 
  FileSpreadsheet, 
  FileCode,
  AlertTriangle,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearFecha, exportarAJSON, exportarACSV } from '../utils/helpers';
import TicketModal from '../components/TicketModal';
import DatabaseModal from '../components/DatabaseModal';

export default function Pedidos() {
  const { 
    pedidosHistorial, 
    setTicketPedido, 
    setIsTicketModalOpen, 
    eliminarPedidoHistorial,
    mostrarNotificacion 
  } = usePedidos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('todos'); // 'todos' | 'efectivo' | 'transferencia' | 'mixto' | 'dividido'
  const [filtroFecha, setFiltroFecha] = useState('todos'); // 'todos' | 'hoy' | 'semana'
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  // Filtrar pedidos
  const pedidosFiltrados = useMemo(() => {
    return pedidosHistorial.filter((p) => {
      // 1. Filtro de búsqueda texto
      const texto = busqueda.toLowerCase().trim();
      const matchTexto = 
        !texto ||
        (p.numeroOrden && p.numeroOrden.toString().includes(texto)) ||
        (p.mesa && `mesa ${p.mesa}`.toLowerCase().includes(texto)) ||
        (p.banco && p.banco.toLowerCase().includes(texto)) ||
        (p.comprobante && p.comprobante.toLowerCase().includes(texto)) ||
        (p.productos && p.productos.some((prod) => prod.nombre.toLowerCase().includes(texto)));

      // 2. Filtro por Método de Pago
      const matchMetodo = 
        filtroMetodo === 'todos' || 
        p.metodoPago === filtroMetodo;

      // 3. Filtro por Fecha
      let matchFecha = true;
      if (filtroFecha === 'hoy') {
        const hoy = new Date().toISOString().split('T')[0];
        const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
        matchFecha = fechaP === hoy;
      } else if (filtroFecha === 'semana') {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        const fechaP = new Date(p.fecha);
        matchFecha = fechaP >= hace7Dias;
      }

      return matchTexto && matchMetodo && matchFecha;
    });
  }, [pedidosHistorial, busqueda, filtroMetodo, filtroFecha]);

  // Cálculos de métricas filtradas considerando pagos mixtos y divididos
  const totalVentas = pedidosFiltrados.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  
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

  const handleVerTicket = (pedido) => {
    setTicketPedido(pedido);
    setIsTicketModalOpen(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!pedidoAEliminar) return;
    await eliminarPedidoHistorial(pedidoAEliminar.id);
    setPedidoAEliminar(null);
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
            Registro sincronizado en Supabase y guardado en memoria local.
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
            <option value="mixto">Pago Combinado (Mixto)</option>
            <option value="dividido">Cuentas Separadas (Dividido)</option>
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
                <th className="py-3.5 px-4">Método de Pago</th>
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

                    {/* Mesa / Domicilio */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-white text-xs">
                        {pedido.mesa === 'Domicilio' || pedido.mesa === 'A Domicilio' ? '🛵 A Domicilio' : `Mesa ${pedido.mesa}`}
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

                    {/* Método de Pago con Badges Adaptados */}
                    <td className="py-3.5 px-4">
                      {pedido.metodoPago === 'efectivo' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Coins className="w-3.5 h-3.5" />
                          <span>Efectivo</span>
                        </span>
                      )}

                      {pedido.metodoPago === 'transferencia' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Transf {pedido.banco ? `(${pedido.banco})` : ''}</span>
                        </span>
                      )}

                      {pedido.metodoPago === 'mixto' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Mixto (${pedido.montoEfectivo || 0} + ${pedido.montoTransferencia || 0})</span>
                        </span>
                      )}

                      {pedido.metodoPago === 'dividido' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Users className="w-3.5 h-3.5" />
                          <span>Dividido ({pedido.desglosePagos?.length || 2} pers.)</span>
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
                          title="Ver, Imprimir y Compartir Ticket"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVerTicket(pedido)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Imprimir Comprobante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPedidoAEliminar(pedido)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/50 transition-colors"
                          title="Anular / Eliminar Pedido"
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
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-sm font-semibold">No se encontraron pedidos con estos filtros</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Las comandas cobradas en las mesas aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ticket Térmico */}
      <TicketModal />

      {/* Modal de Database / Supabase */}
      <DatabaseModal />

      {/* Modal de Confirmación para Anular / Eliminar Pedido */}
      {pedidoAEliminar && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-2xl p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                ¿Anular Orden #{pedidoAEliminar.numeroOrden}?
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Este pedido (Mesa {pedidoAEliminar.mesa} • {formatearDinero(pedidoAEliminar.total)}) será <strong>eliminado de Supabase</strong> y del historial de ventas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPedidoAEliminar(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Anular y Borrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
