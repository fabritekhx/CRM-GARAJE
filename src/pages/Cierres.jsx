import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Lock, 
  Coins, 
  CreditCard, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  TrendingUp, 
  Receipt,
  UtensilsCrossed,
  Eye,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearFecha, formatearFechaCorta } from '../utils/helpers';
import FirebaseModal from '../components/FirebaseModal';

export default function Cierres() {
  const { 
    pedidosHistorial, 
    cierresHistorial, 
    fechaActualApp,
    realizarCierreCaja, 
    mostrarNotificacion 
  } = usePedidos();

  // Fecha seleccionada para el nuevo cierre (por defecto hoy en base a fechaActualApp)
  const [fechaCierre, setFechaCierre] = useState(fechaActualApp || new Date().toISOString().split('T')[0]);
  const [cierreSeleccionadoDetalle, setCierreSeleccionadoDetalle] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Sincronizar fechaCierre cuando cambie de día en vivo si el usuario está viendo "hoy"
  const esHoy = fechaCierre === (fechaActualApp || new Date().toISOString().split('T')[0]);

  // Calcular métricas en vivo para la fecha seleccionada
  const resumenVivo = useMemo(() => {
    const pedidosDelDia = pedidosHistorial.filter((p) => {
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
      return fechaP === fechaCierre && p.estado === 'pagado';
    });

    let totalEfectivo = 0;
    let totalTransferencia = 0;
    const conteo = {};

    pedidosDelDia.forEach((p) => {
      const tot = Number(p.total) || 0;
      if (p.metodoPago === 'efectivo') {
        totalEfectivo += tot;
      } else if (p.metodoPago === 'transferencia') {
        totalTransferencia += tot;
      } else if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') {
        totalEfectivo += Number(p.montoEfectivo) || 0;
        totalTransferencia += Number(p.montoTransferencia) || 0;
      } else {
        totalEfectivo += tot;
      }

      (p.productos || []).forEach((item) => {
        const key = `${item.nombre}${item.variante ? ` (${item.variante})` : ''}`;
        conteo[key] = (conteo[key] || 0) + (Number(item.cantidad) || 1);
      });
    });

    const productosMasVendidos = Object.entries(conteo)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const totalGeneral = totalEfectivo + totalTransferencia;

    return {
      numPedidos: pedidosDelDia.length,
      totalEfectivo,
      totalTransferencia,
      totalGeneral,
      productosMasVendidos,
      pedidos: pedidosDelDia,
    };
  }, [pedidosHistorial, fechaCierre]);

  // Verificar si ya existe un cierre guardado para esa fecha
  const cierreGuardadoExistente = cierresHistorial.find((c) => c.id === fechaCierre);

  const handleEjecutarCierre = async () => {
    if (resumenVivo.numPedidos === 0) {
      mostrarNotificacion(`No hay pedidos registrados el día ${fechaCierre}`, 'error');
      return;
    }

    setProcesando(true);
    try {
      const res = await realizarCierreCaja(fechaCierre);
      if (res) {
        setCierreSeleccionadoDetalle(res);
      }
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimirCierre = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-400" />
            <span>Cierre Diario de Caja</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Arqueo y balance de caja diario con guardado automático en la nube y reinicio a medianoche.
          </p>
        </div>

        {/* Selector de Fecha de Cierre con Accesos Rápidos */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFechaCierre(fechaActualApp || new Date().toISOString().split('T')[0])}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                esHoy ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy (En Vivo)
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setFechaCierre(d.toISOString().split('T')[0]);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                fechaCierre === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ayer
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-4 h-4 text-amber-400 ml-2" />
            <input
              type="date"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-white font-mono focus:outline-none pr-2"
            />
          </div>
        </div>
      </div>

      {/* Banner Informativo de Cierre Automático a las 23:59:59 */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <span>Cierre Automático Programado a las 23:59:59</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVO
              </span>
            </span>
            <p className="text-slate-400 text-xs mt-0.5">
              A las 23:59:59 se archiva el cierre del día actual en el historial. A las 00:00:00 los valores en pantalla se reinician automáticamente a $0.00 para iniciar el nuevo día.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            Fecha activa: <strong className="text-amber-400">{fechaActualApp}</strong>
          </span>
        </div>
      </div>

      {/* PANEL PRINCIPAL: Resumen de Caja para la Fecha Seleccionada */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                Arqueo de Ventas en Vivo
              </span>
              {cierreGuardadoExistente && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Cierre ya guardado
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              Ventas del {fechaCierre}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEjecutarCierre}
              disabled={procesando || resumenVivo.numPedidos === 0}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>
                {cierreGuardadoExistente ? 'Actualizar Cierre del Día' : 'Cerrar Caja del Día'}
              </span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Totales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total General */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800/80 to-slate-900 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Total General
              </span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
              {formatearDinero(resumenVivo.totalGeneral)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Suma efectivo + transferencias</p>
          </div>

          {/* Total Efectivo */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Efectivo en Caja
              </span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {formatearDinero(resumenVivo.totalEfectivo)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Efectivo físico recaudado</p>
          </div>

          {/* Total Transferencia */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Transferencias
              </span>
              <CreditCard className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
              {formatearDinero(resumenVivo.totalTransferencia)}
            </div>
            <p className="text-xs text-slate-400 mt-1">DeUna / Bancos</p>
          </div>

          {/* Cantidad de Pedidos */}
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Total de Comandas
              </span>
              <Receipt className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {resumenVivo.numPedidos}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Promedio: {resumenVivo.numPedidos > 0 ? formatearDinero(resumenVivo.totalGeneral / resumenVivo.numPedidos) : '$0.00'}
            </p>
          </div>

        </div>

        {/* Ranking de Productos Más Vendidos del Día */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <span>Productos Más Vendidos en este Día ({resumenVivo.productosMasVendidos.length} items)</span>
          </h3>

          {resumenVivo.productosMasVendidos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {resumenVivo.productosMasVendidos.slice(0, 9).map((prod, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-700 font-bold text-xs text-slate-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                      {prod.nombre}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 font-mono font-bold text-xs">
                    {prod.cantidad} {prod.cantidad === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-800/40 text-center text-slate-500 text-xs">
              No hay productos vendidos en la fecha seleccionada.
            </div>
          )}
        </div>

      </div>

      {/* HISTORIAL DE CIERRES REGISTRADOS EN FIRESTORE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Historial de Cierres de Caja Guardados</span>
            </h2>
            <p className="text-xs text-slate-400">
              Registros históricos persistidos en Firestore para auditoría y contabilidad.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fecha Cierre</th>
                  <th className="py-3.5 px-4">Órdenes</th>
                  <th className="py-3.5 px-4">Efectivo</th>
                  <th className="py-3.5 px-4">Transferencia</th>
                  <th className="py-3.5 px-4">Total Diario</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {cierresHistorial.length > 0 ? (
                  cierresHistorial.map((cierre) => (
                    <tr key={cierre.id} className="hover:bg-slate-800/50 transition-colors">
                      
                      <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{cierre.id}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-semibold">
                          {cierre.numPedidos} pedidos
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {formatearDinero(cierre.totalEfectivo)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400">
                        {formatearDinero(cierre.totalTransferencia)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-amber-400 text-base">
                        {formatearDinero(cierre.totalGeneral)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setCierreSeleccionadoDetalle(cierre)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Calculator className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-slate-400">No hay cierres guardados aún</p>
                      <p className="text-xs">Usa el botón "Cerrar Caja del Día" para guardar el balance de hoy.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL / REPORTE DE DETALLE DE CIERRE (Imprimible) */}
      {cierreSeleccionadoDetalle && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Reporte de Cierre de Caja - {cierreSeleccionadoDetalle.id}
                </h3>
              </div>
              <button
                onClick={() => setCierreSeleccionadoDetalle(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Total Recaudado</span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {formatearDinero(cierreSeleccionadoDetalle.totalGeneral)}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Total Comandas</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {cierreSeleccionadoDetalle.numPedidos}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-emerald-400 uppercase font-bold">Efectivo</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {formatearDinero(cierreSeleccionadoDetalle.totalEfectivo)}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-cyan-400 uppercase font-bold">Transferencias</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                    {formatearDinero(cierreSeleccionadoDetalle.totalTransferencia)}
                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Desglose de Productos Vendidos:
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {(cierreSeleccionadoDetalle.productosMasVendidos || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between text-xs p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <span className="text-slate-200">{p.nombre}</span>
                      <span className="font-mono font-bold text-amber-400">{p.cantidad} unidades</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCierreSeleccionadoDetalle(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      <FirebaseModal />

    </div>
  );
}
