import React, { useState } from 'react';
import { 
  Info,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import MesaCard from '../components/MesaCard';
import PedidoModal from '../components/PedidoModal';
import CobroModal from '../components/CobroModal';
import TicketModal from '../components/TicketModal';
import FirebaseModal from '../components/FirebaseModal';

export default function Mesas() {
  const { mesas, liberarTodasLasMesas } = usePedidos();
  const [mostrarConfirmacionLiberar, setMostrarConfirmacionLiberar] = useState(false);

  const mesasOcupadasCount = mesas.filter((m) => m.estado === 'ocupada').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Título de la Sección de Mesas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Salón y Domicilios</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              7 Mesas + A Domicilio
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Toca una mesa para abrir comanda, agregar productos o procesar el cobro.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {mesasOcupadasCount > 0 && (
            <button
              type="button"
              onClick={() => setMostrarConfirmacionLiberar(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Liberar todas las mesas activas"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Liberar todas ({mesasOcupadasCount})</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Libre
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              Ocupada
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Mesas y Domicilio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {mesas.map((mesa) => (
          <MesaCard key={mesa.id} mesa={mesa} />
        ))}
      </div>

      {/* Guía rápida de uso POS */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Operación Rápida de Restaurante:</span>
          <p>
            1. Toca cualquier <strong>mesa libre</strong> para iniciar comanda.
            2. Selecciona categoría (Pescados, Jugos, Gaseosas, Cervezas, Porciones Extras) y variantes.
            3. Al terminar el servicio, presiona <strong>Cobrar</strong> (Efectivo con cálculo de vuelto automático, Transferencia bancaria o Mixto). Al confirmar, la mesa se libera y el comprobante queda listo para impresión.
          </p>
        </div>
      </div>

      {/* Modales Compartidos */}
      <PedidoModal />
      <CobroModal />
      <TicketModal />
      <FirebaseModal />

      {/* Modal de confirmación para liberar todas las mesas */}
      {mostrarConfirmacionLiberar && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                ¿Liberar todas las mesas?
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Todas las mesas y pedidos abiertos volverán a estar <strong>vacías y libres</strong>. (El historial de ventas anteriores no se verá afectado).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionLiberar(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  liberarTodasLasMesas();
                  setMostrarConfirmacionLiberar(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sí, Vaciar Mesas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
