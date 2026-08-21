import React from 'react';
import { 
  Users, 
  LayoutGrid, 
  DollarSign, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Receipt,
  UtensilsCrossed,
  Info
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import MesaCard from '../components/MesaCard';
import PedidoModal from '../components/PedidoModal';
import CobroModal from '../components/CobroModal';
import TicketModal from '../components/TicketModal';
import FirebaseModal from '../components/FirebaseModal';
import { formatearDinero } from '../utils/helpers';

export default function Mesas() {
  const { mesas, pedidosHistorial } = usePedidos();

  const mesasOcupadas = mesas.filter((m) => m.estado === 'ocupada');
  const totalEnMesas = mesas.reduce((sum, m) => {
    return sum + (m.pedidoActual?.total || 0);
  }, 0);

  // Pedidos cobrados hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const pedidosHoy = pedidosHistorial.filter((p) => {
    const f = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
    return f === hoyStr;
  });
  const totalVendidoHoy = pedidosHoy.reduce((acc, p) => acc + (p.total || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Banner Superior de Estado de Salón */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card Mesas Ocupadas */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Mesas Activas</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {mesasOcupadas.length} <span className="text-sm font-normal text-slate-500">/ 6</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>

        {/* Card Total en Salón */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total en Mesas</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">
              {formatearDinero(totalEnMesas)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card Pedidos Cobrados Hoy */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Ventas Cobradas Hoy</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
              {formatearDinero(totalVendidoHoy)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Card Órdenes Totales */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Órdenes del Día</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {pedidosHoy.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Título de la Sección de Mesas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Salón de Mesas</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              6 Mesas
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

      {/* Grid de las 6 Mesas (Requisito: Mesa 1, Mesa 2, Mesa 3, Mesa 4, Mesa 5 y Mesa 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            2. Selecciona categoría (Pescados, Gaseosas, Cervezas, Porciones Extras) y variantes (tamaños/sabores).
            3. Al terminar el servicio, presiona <strong>Cobrar</strong> (Efectivo con cálculo de vuelto automático o Transferencia bancaria). Al confirmar, la mesa se libera y el pedido se almacena en Firestore.
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
