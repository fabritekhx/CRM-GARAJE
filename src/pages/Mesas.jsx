import React from 'react';
import { 
  Info
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import MesaCard from '../components/MesaCard';
import PedidoModal from '../components/PedidoModal';
import CobroModal from '../components/CobroModal';
import TicketModal from '../components/TicketModal';
import FirebaseModal from '../components/FirebaseModal';

export default function Mesas() {
  const { mesas } = usePedidos();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Título de la Sección de Mesas */}
      <div className="flex items-center justify-between">
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

    </div>
  );
}
