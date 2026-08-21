import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  FileCheck,
  Receipt
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero } from '../utils/helpers';

export default function CobroModal() {
  const { 
    mesaSeleccionada, 
    pedidoActual, 
    isCobroModalOpen, 
    setIsCobroModalOpen,
    confirmarCobro,
    mostrarNotificacion
  } = usePedidos();

  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'transferencia'
  const [montoRecibido, setMontoRecibido] = useState('');
  const [banco, setBanco] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [procesando, setProcesando] = useState(false);

  const total = pedidoActual?.total || 0;

  // Inicializar con el monto exacto cuando se abre
  useEffect(() => {
    if (isCobroModalOpen && total > 0) {
      setMontoRecibido(total.toString());
      setMetodoPago('efectivo');
      setBanco('');
      setComprobante('');
    }
  }, [isCobroModalOpen, total]);

  if (!isCobroModalOpen || !pedidoActual) return null;

  const numMontoRecibido = parseFloat(montoRecibido) || 0;
  const cambio = Math.max(0, numMontoRecibido - total);
  const esMontoInsuficiente = metodoPago === 'efectivo' && numMontoRecibido < total;

  // Botones rápidos de efectivo
  const billetesSugeridos = [
    { label: 'Exacto', valor: total },
    { label: '$5', valor: 5 },
    { label: '$10', valor: 10 },
    { label: '$20', valor: 20 },
    { label: '$50', valor: 50 },
  ].filter((b) => b.valor >= total || b.label === 'Exacto');

  const handleConfirmar = async (e) => {
    e.preventDefault();
    if (metodoPago === 'efectivo' && esMontoInsuficiente) {
      mostrarNotificacion('El monto recibido no cubre el total de la cuenta', 'error');
      return;
    }

    setProcesando(true);
    try {
      await confirmarCobro({
        metodoPago,
        montoRecibido: metodoPago === 'efectivo' ? numMontoRecibido : total,
        cambio: metodoPago === 'efectivo' ? cambio : 0,
        banco: metodoPago === 'transferencia' ? banco : '',
        comprobante: metodoPago === 'transferencia' ? comprobante : '',
      });
    } catch (err) {
      console.error('Error al procesar cobro:', err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header del Cobro */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">
                Cobrar Mesa {mesaSeleccionada}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Orden #{pedidoActual.numeroOrden} • {pedidoActual.productos?.length || 0} productos
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCobroModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario de Pago */}
        <form onSubmit={handleConfirmar} className="p-6 space-y-5">
          
          {/* Tarjeta de Total */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-slate-800/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                Total a Pagar
              </span>
              <p className="text-xs text-slate-400">Restaurante El Garaje</p>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
              {formatearDinero(total)}
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Seleccionar Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Opción Efectivo */}
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  metodoPago === 'efectivo'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${metodoPago === 'efectivo' ? 'bg-slate-950/20' : 'bg-slate-700'}`}>
                  <Coins className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Efectivo</div>
                  <div className={`text-[11px] ${metodoPago === 'efectivo' ? 'text-slate-900' : 'text-slate-400'}`}>
                    Cálculo de cambio
                  </div>
                </div>
              </button>

              {/* Opción Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  metodoPago === 'transferencia'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${metodoPago === 'transferencia' ? 'bg-slate-950/20' : 'bg-slate-700'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Transferencia</div>
                  <div className={`text-[11px] ${metodoPago === 'transferencia' ? 'text-slate-900' : 'text-slate-400'}`}>
                    DeUna / Banco
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Campos Específicos para EFECTIVO */}
          {metodoPago === 'efectivo' && (
            <div className="space-y-4 pt-1">
              
              {/* Botones de montos rápidos */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Atajos de Billetes:</span>
                <div className="flex flex-wrap gap-2">
                  {billetesSugeridos.map((billete) => (
                    <button
                      key={billete.label}
                      type="button"
                      onClick={() => setMontoRecibido(billete.valor.toString())}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                        parseFloat(montoRecibido) === billete.valor
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {billete.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de Monto Recibido */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Monto Recibido ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 bg-slate-800 border rounded-xl text-xl font-bold font-mono text-white focus:outline-none transition-all ${
                      esMontoInsuficiente
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Cálculo del Cambio / Vuelto */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                esMontoInsuficiente
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {esMontoInsuficiente ? 'Monto Insuficiente' : 'Cambio / Vuelto a Entregar:'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {esMontoInsuficiente ? `Faltan ${formatearDinero(total - numMontoRecibido)}` : 'Entregar al cliente'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono">
                  {formatearDinero(cambio)}
                </div>
              </div>

            </div>
          )}

          {/* Campos Específicos para TRANSFERENCIA */}
          {metodoPago === 'transferencia' && (
            <div className="space-y-3.5 pt-1">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Banco / Billetera Digital:</span>
                </label>
                <select
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Seleccionar (opcional)</option>
                  <option value="DeUna">DeUna! (Banco Pichincha)</option>
                  <option value="Banco Pichincha">Banco Pichincha</option>
                  <option value="Banco Guayaquil">Banco Guayaquil (Pei)</option>
                  <option value="Produbanco">Produbanco / Be</option>
                  <option value="Banco Bolivariano">Banco Bolivariano</option>
                  <option value="Otro">Otro Banco / Cooperativa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nº de Comprobante / Referencia (opcional):</span>
                </label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. REF-983742"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Verifica que la transferencia haya ingresado a la cuenta del restaurante.</span>
              </div>

            </div>
          )}

          {/* Botones Finales de Acción */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCobroModalOpen(false)}
              className="w-1/3 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
            >
              Atrás
            </button>

            <button
              type="submit"
              disabled={procesando || (metodoPago === 'efectivo' && esMontoInsuficiente)}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{procesando ? 'Guardando en Firestore...' : `Confirmar Pago (${formatearDinero(total)})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
