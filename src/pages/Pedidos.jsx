import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
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
  User,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  CalendarDays,
  ArrowUpDown,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { 
  formatearDinero, 
  formatearFecha, 
  formatearHora,
  formatearDiaLegible, 
  exportarAJSON, 
  exportarACSV,
  obtenerFechaLocal 
} from '../utils/helpers';
import TicketModal from '../components/TicketModal';
import DatabaseModal from '../components/DatabaseModal';

export default function Pedidos() {
  const { 
    pedidosHistorial, 
    fechaActualApp,
    setTicketPedido, 
    setIsTicketModalOpen, 
    eliminarPedidoHistorial,
    mostrarNotificacion 
  } = usePedidos();

  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('todos'); // 'todos' | 'efectivo' | 'transferencia' | 'mixto' | 'dividido'
  
  // Modos de filtrado por fecha: 'dia' (por defecto) | 'rango' | 'todos'
  const [modoFecha, setModoFecha] = useState('dia');
  
  // Fecha seleccionada para el modo 'dia' (por defecto la fecha de hoy local)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return fechaActualApp || obtenerFechaLocal();
  });

  // Rango de fechas para el modo 'rango'
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return obtenerFechaLocal(d);
  });
  const [fechaFin, setFechaFin] = useState(() => fechaActualApp || obtenerFechaLocal());

  // Dirección de ordenamiento persistente: 'asc' (Primero al Último) | 'desc' (Último al Primero)
  const [ordenDireccion, setOrdenDireccion] = useState(() => {
    try {
      const guardado = localStorage.getItem('el_garaje_orden_direccion_pedidos');
      return guardado === 'desc' ? 'desc' : 'asc';
    } catch {
      return 'asc';
    }
  });

  const cambiarOrdenDireccion = (nuevaDireccion) => {
    setOrdenDireccion(nuevaDireccion);
    try {
      localStorage.setItem('el_garaje_orden_direccion_pedidos', nuevaDireccion);
    } catch {
      // ignore
    }
  };

  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  // Navegar de día (día anterior / día siguiente)
  const cambiarDia = (offset) => {
    const [y, m, d] = (fechaSeleccionada || obtenerFechaLocal()).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    setFechaSeleccionada(obtenerFechaLocal(date));
  };

  const irAHoy = () => {
    setFechaSeleccionada(fechaActualApp || obtenerFechaLocal());
    setModoFecha('dia');
  };

  const irAAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFechaSeleccionada(obtenerFechaLocal(d));
    setModoFecha('dia');
  };

  // Filtrar pedidos según fecha, método de pago y texto de búsqueda
  const pedidosFiltrados = useMemo(() => {
    return pedidosHistorial.filter((p) => {
      if (!p || p.estado === 'cancelado' || p.estado === 'config' || String(p.id).startsWith('SYS_')) return false;

      // 1. Filtro por Fecha Local
      const fechaP = obtenerFechaLocal(p.fecha);
      let matchFecha = true;

      if (modoFecha === 'dia') {
        matchFecha = fechaP === fechaSeleccionada;
      } else if (modoFecha === 'rango') {
        if (fechaInicio && fechaFin) {
          matchFecha = fechaP >= fechaInicio && fechaP <= fechaFin;
        }
      } else if (modoFecha === 'todos') {
        matchFecha = true;
      }

      if (!matchFecha) return false;

      // 2. Filtro por Método de Pago
      const matchMetodo = 
        filtroMetodo === 'todos' || 
        p.metodoPago === filtroMetodo;

      if (!matchMetodo) return false;

      // 3. Filtro de búsqueda texto (Nombres de cliente, notas, comensales, productos, mesa, orden #, banco, comprobante)
      const texto = busqueda.toLowerCase().trim();
      if (!texto) return true;

      const matchNumeroOrden = p.numeroOrden && p.numeroOrden.toString().includes(texto);
      const matchMesa = p.mesa && `mesa ${p.mesa}`.toLowerCase().includes(texto);
      const matchNotas = p.notas && p.notas.toLowerCase().includes(texto);
      const matchCliente = p.cliente && p.cliente.toLowerCase().includes(texto);
      const matchNombreCliente = p.nombreCliente && p.nombreCliente.toLowerCase().includes(texto);
      const matchBanco = p.banco && p.banco.toLowerCase().includes(texto);
      const matchComprobante = p.comprobante && p.comprobante.toLowerCase().includes(texto);
      
      const matchProductos = Array.isArray(p.productos) && p.productos.some((prod) => 
        (prod.nombre && prod.nombre.toLowerCase().includes(texto)) ||
        (prod.variante && prod.variante.toLowerCase().includes(texto)) ||
        (prod.notas && prod.notas.toLowerCase().includes(texto))
      );

      const matchDesglose = Array.isArray(p.desglosePagos) && p.desglosePagos.some((item) =>
        (item.persona && item.persona.toLowerCase().includes(texto)) ||
        (item.nombre && item.nombre.toLowerCase().includes(texto)) ||
        (item.banco && item.banco.toLowerCase().includes(texto)) ||
        (item.comprobante && item.comprobante.toLowerCase().includes(texto))
      );

      return (
        matchNumeroOrden ||
        matchMesa ||
        matchNotas ||
        matchCliente ||
        matchNombreCliente ||
        matchBanco ||
        matchComprobante ||
        matchProductos ||
        matchDesglose
      );
    });
  }, [pedidosHistorial, modoFecha, fechaSeleccionada, fechaInicio, fechaFin, filtroMetodo, busqueda]);

  // Si estamos en modo de 1 solo día:
  // 1. Asignamos primero la numeración correlativa del día en orden cronológico (#1 al inicio, #2 después...)
  // 2. Luego ordenamos según `ordenDireccion`:
  //    - 'asc': Del primero al último (#1, #2, #3...)
  //    - 'desc': Del último al primero (la orden más reciente primero, conservando su # correlativo)
  const pedidosConOrdenDelDia = useMemo(() => {
    if (modoFecha === 'dia') {
      // Ordenar por hora/fecha ascendente para que la primera orden del día sea la #1
      const ordenadosAsc = [...pedidosFiltrados].sort((a, b) => {
        const timeA = new Date(a.fecha).getTime() || 0;
        const timeB = new Date(b.fecha).getTime() || 0;
        return timeA - timeB;
      });

      // Mapear con su correlativo diario exacto (1..N)
      const mapeados = ordenadosAsc.map((p, idx) => ({
        ...p,
        ordenCorrelativaDia: idx + 1,
        // Usar numeroOrden registrado o fallback a correlativo
        ordenMostrar: p.numeroOrden ? Number(p.numeroOrden) : (idx + 1)
      }));

      // Si el usuario seleccionó de último a primero, invertimos el array
      if (ordenDireccion === 'desc') {
        return [...mapeados].reverse();
      }
      return mapeados;
    }

    // Modo rango o todo:
    return [...pedidosFiltrados].sort((a, b) => {
      const timeA = new Date(a.fecha).getTime() || 0;
      const timeB = new Date(b.fecha).getTime() || 0;
      return ordenDireccion === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [pedidosFiltrados, modoFecha, ordenDireccion]);

  // Cálculos de métricas del conjunto filtrado
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

  const totalPlatosVendidos = pedidosFiltrados.reduce((sum, p) => {
    const prods = Array.isArray(p?.productos) ? p.productos : [];
    return sum + prods.reduce((sub, item) => sub + (Number(item.cantidad) || 1), 0);
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
    const sufijo = modoFecha === 'dia' ? fechaSeleccionada : (modoFecha === 'rango' ? `${fechaInicio}_a_${fechaFin}` : 'todo');
    exportarACSV(pedidosFiltrados, `el_garaje_pedidos_${sufijo}.csv`);
    mostrarNotificacion('Archivo CSV exportado exitosamente', 'success');
  };

  const handleExportarJSON = () => {
    if (pedidosFiltrados.length === 0) {
      mostrarNotificacion('No hay pedidos para exportar', 'error');
      return;
    }
    const sufijo = modoFecha === 'dia' ? fechaSeleccionada : (modoFecha === 'rango' ? `${fechaInicio}_a_${fechaFin}` : 'todo');
    exportarAJSON(pedidosFiltrados, `el_garaje_pedidos_${sufijo}.json`);
    mostrarNotificacion('Archivo JSON exportado exitosamente', 'success');
  };

  const esFechaHoy = fechaSeleccionada === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Encabezado Principal y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>Historial y Detalle de Pedidos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Consulta qué vendiste, a quién se entregó y las órdenes detalladas por fecha.
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

      {/* Selector de Modo de Fecha */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Pestañas de Modo de Fecha */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setModoFecha('dia')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoFecha === 'dia'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Día Específico</span>
            </button>

            <button
              type="button"
              onClick={() => setModoFecha('rango')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoFecha === 'rango'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rango de Días</span>
            </button>

            <button
              type="button"
              onClick={() => setModoFecha('todos')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                modoFecha === 'todos'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Todo el Historial</span>
            </button>
          </div>

          {/* Filtro por Método de Pago */}
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

        {/* Controles para MODO 'DÍA ESPECÍFICO' */}
        {modoFecha === 'dia' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            
            {/* Botones de navegación y selector de fecha */}
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

              {/* Botones rápidos Hoy / Ayer */}
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

            {/* Texto descriptivo del día seleccionado */}
            <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatearDiaLegible(fechaSeleccionada)}</span>
            </div>

          </div>
        )}

        {/* Controles para MODO 'RANGO DE FECHAS' */}
        {modoFecha === 'rango' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
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

        {/* Buscador inteligente */}
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, notas, plato, variante, orden #, mesa, banco..."
              className="w-full pl-10 pr-9 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Tabla de Pedidos y Detalles de Venta */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              {modoFecha === 'dia'
                ? `Comandas del ${formatearDiaLegible(fechaSeleccionada)}`
                : (modoFecha === 'rango' ? `Comandas del período (${fechaInicio} a ${fechaFin})` : 'Todas las Comandas Registradas')
              }
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Control de Orden: Primero a Último vs Último a Primero */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 px-2 hidden md:inline-flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                <span>Ordenar:</span>
              </span>

              <button
                type="button"
                onClick={() => cambiarOrdenDireccion('asc')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ordenDireccion === 'asc'
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mostrar en orden cronológico: Primero al Último (Orden #1, #2, #3...)"
              >
                <ArrowUpWideNarrow className="w-3.5 h-3.5" />
                <span>Primero al Último</span>
              </button>

              <button
                type="button"
                onClick={() => cambiarOrdenDireccion('desc')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ordenDireccion === 'desc'
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mostrar las órdenes más recientes arriba: Último al Primero"
              >
                <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                <span>Último al Primero</span>
              </button>
            </div>

            <span className="text-xs font-bold text-slate-300 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 shrink-0">
              {pedidosConOrdenDelDia.length} {pedidosConOrdenDelDia.length === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nº Orden</th>
                <th className="py-3.5 px-4">A Quién se Vendió / Mesa</th>
                <th className="py-3.5 px-4">Hora</th>
                <th className="py-3.5 px-4">Qué se Vendió (Productos)</th>
                <th className="py-3.5 px-4">Método de Pago</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pedidosConOrdenDelDia.length > 0 ? (
                pedidosConOrdenDelDia.map((pedido, idx) => {
                  const esDomicilio = pedido.mesa === 'Domicilio' || pedido.mesa === 'A Domicilio';
                  const nombreCliente = pedido.nombreCliente || pedido.cliente || pedido.notas;
                  const numeroOrdenMostrar = modoFecha === 'dia' 
                    ? (pedido.ordenCorrelativaDia || pedido.numeroOrden || idx + 1)
                    : (pedido.numeroOrden || idx + 1);

                  return (
                    <tr key={pedido.id || idx} className="hover:bg-slate-800/50 transition-colors">
                      
                      {/* Nº Orden del Día */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-xs">
                            Orden #{numeroOrdenMostrar}
                          </span>
                        </div>
                      </td>

                      {/* A Quién se Vendió / Mesa / Domicilio */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-xs whitespace-nowrap ${
                            esDomicilio 
                              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' 
                              : 'bg-slate-800 border-slate-700 text-white'
                          }`}>
                            {esDomicilio ? '🛵 A Domicilio' : `Mesa ${pedido.mesa}`}
                          </span>

                          {/* Nombre del cliente o referencia clara */}
                          {nombreCliente ? (
                            <span 
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-200 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md max-w-[220px] truncate"
                              title={nombreCliente}
                            >
                              <User className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{nombreCliente}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Consumo en local
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hora */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatearHora(pedido.fecha)}</span>
                        </div>
                        {modoFecha !== 'dia' && (
                          <span className="text-[10px] text-slate-500 block">
                            {formatearFecha(pedido.fecha, 'dd/MM/yyyy')}
                          </span>
                        )}
                      </td>

                      {/* Resumen Detallado de Productos */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          {(pedido.productos || []).map((item, i) => (
                            <div key={i} className="text-xs text-slate-300 flex items-start gap-1">
                              <span className="font-bold text-amber-400 shrink-0 font-mono">
                                {item.cantidad}x
                              </span>
                              <span>
                                <span className="font-medium text-white">{item.nombre}</span>
                                {item.variante && (
                                  <span className="text-[11px] text-cyan-300 font-semibold"> ({item.variante})</span>
                                )}
                                {item.notas && (
                                  <span className="text-[11px] text-slate-400 italic"> [{item.notas}]</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {pedido.metodoPago === 'efectivo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Coins className="w-3.5 h-3.5" />
                            <span>Efectivo</span>
                          </span>
                        )}

                        {pedido.metodoPago === 'transferencia' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Transferencia</span>
                            </span>
                            {pedido.banco && (
                              <span className="text-[10px] text-cyan-300/80 font-mono">
                                Banco: {pedido.banco}
                              </span>
                            )}
                            {pedido.comprobante && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Ref: {pedido.comprobante}
                              </span>
                            )}
                          </div>
                        )}

                        {pedido.metodoPago === 'mixto' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Layers className="w-3.5 h-3.5" />
                              <span>Mixto</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Efec: ${pedido.montoEfectivo || 0} • Transf: ${pedido.montoTransferencia || 0}
                            </span>
                          </div>
                        )}

                        {pedido.metodoPago === 'dividido' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <Users className="w-3.5 h-3.5" />
                              <span>Dividido ({pedido.desglosePagos?.length || 2} pers.)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right font-black font-mono text-base text-white whitespace-nowrap">
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-400">
                      {modoFecha === 'dia' 
                        ? `No se registraron ventas el ${formatearDiaLegible(fechaSeleccionada)}`
                        : 'No se encontraron pedidos con los filtros actuales'
                      }
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {modoFecha === 'dia' && !esFechaHoy && (
                        <button
                          type="button"
                          onClick={irAHoy}
                          className="text-amber-400 hover:underline font-bold"
                        >
                          Ir a las ventas de Hoy
                        </button>
                      )}
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
                ¿Anular Orden #{pedidoAEliminar.numeroOrden || pedidoAEliminar.id}?
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Este pedido ({pedidoAEliminar.mesa === 'Domicilio' ? 'A Domicilio' : `Mesa ${pedidoAEliminar.mesa}`} • {formatearDinero(pedidoAEliminar.total)}) será <strong>eliminado de Supabase</strong> y del historial de ventas.
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
