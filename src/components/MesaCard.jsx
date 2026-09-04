import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Plus, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Bike,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearHora } from '../utils/helpers';

function MesaCard({ mesa }) {
  const { abrirMesa, setMesaSeleccionada, setIsCobroModalOpen, eliminarMesa } = usePedidos();
  const [mostrarConfirmacionBorrar, setMostrarConfirmacionBorrar] = useState(false);

  const estaOcupada = mesa.estado === 'ocupada' && mesa.pedidoActual;
  const pedido = mesa.pedidoActual;
  const cantidadItems = pedido?.productos?.reduce((acc, item) => acc + (item.cantidad || 0), 0) || 0;
  const total = pedido?.total || 0;
  const esDomicilio = mesa.tipo === 'domicilio' || String(mesa.numero).toLowerCase().includes('dom');

  const handleCobroRapido = (e) => {
    e.stopPropagation();
    if (!estaOcupada || cantidadItems === 0) return;
    setMesaSeleccionada(mesa.numero);
    setIsCobroModalOpen(true);
  };

  const handleAbrirConfirmarBorrado = (e) => {
    e.stopPropagation();
    setMostrarConfirmacionBorrar(true);
  };

  const handleConfirmarBorrado = (e) => {
    e.stopPropagation();
    eliminarMesa(mesa.numero !== undefined ? mesa.numero : mesa.id);
    setMostrarConfirmacionBorrar(false);
  };

  const handleCancelarBorrado = (e) => {
    e.stopPropagation();
    setMostrarConfirmacionBorrar(false);
  };

  return (
    <div
      onClick={() => abrirMesa(mesa.numero !== undefined ? mesa.numero : mesa.id)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
        estaOcupada
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/50 shadow-xl shadow-amber-950/20 hover:border-amber-400 hover:shadow-amber-500/10'
          : esDomicilio 
            ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-cyan-950/20 border-cyan-500/40 hover:border-cyan-400 hover:bg-slate-850 hover:shadow-lg'
            : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-850 hover:shadow-lg'
      }`}
    >
      {/* Indicador de estado superior */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg tracking-tight transition-transform group-hover:scale-105 shrink-0 ${
                estaOcupada
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : esDomicilio
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {esDomicilio ? <Bike className="w-6 h-6" /> : `M${mesa.numero}`}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors truncate">
                {mesa.nombre || (esDomicilio ? 'A Domicilio' : `Mesa ${mesa.numero}`)}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                {esDomicilio ? (
                  <>
                    <Bike className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-cyan-300/90 truncate">
                      {pedido?.notas ? pedido.notas.replace('Cliente: ', '') : 'Entrega / Para Llevar'}
                    </span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Salón Principal</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badges y Botón Eliminar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botón para eliminar mesa / domicilio */}
            <button
              type="button"
              onClick={handleAbrirConfirmarBorrado}
              title={esDomicilio ? 'Eliminar este pedido a domicilio' : 'Eliminar esta mesa'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors opacity-80 hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Badge de Estado */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                estaOcupada
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  estaOcupada ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              {estaOcupada ? 'Ocupada' : 'Libre'}
            </span>
          </div>
        </div>

        {/* Contenido según el estado */}
        {estaOcupada ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                {pedido?.fecha ? formatearHora(pedido.fecha) : 'Ahora'}
              </span>
              <span className="font-mono text-slate-300 font-semibold">
                Orden #{pedido?.numeroOrden || '---'}
              </span>
            </div>

            {/* Resumen de productos en el pedido */}
            <div className="min-h-[56px]">
              {pedido?.productos && pedido.productos.length > 0 ? (
                <div className="space-y-1">
                  {pedido.productos.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-300">
                      <span className="truncate pr-2 text-slate-200">
                        <span className="font-bold text-amber-400">{item.cantidad}x</span> {item.nombre}
                        {item.variante ? <span className="text-slate-400"> ({item.variante})</span> : ''}
                      </span>
                      <span className="font-mono text-slate-400 shrink-0">
                        {formatearDinero(item.precioUnitario * item.cantidad)}
                      </span>
                    </div>
                  ))}
                  {pedido.productos.length > 2 && (
                    <p className="text-[11px] text-amber-400/80 font-medium">
                      +{pedido.productos.length - 2} productos más...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic flex items-center gap-1 py-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {esDomicilio ? 'Pedido a domicilio abierto, sin productos' : 'Mesa abierta, sin productos aún'}
                </div>
              )}
            </div>

            {/* Total acumulado */}
            <div className="pt-2 flex items-baseline justify-between border-t border-slate-800/80">
              <span className="text-xs font-medium text-slate-400">Total a pagar:</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono tracking-tight">
                {formatearDinero(total)}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 mb-2 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">
              {esDomicilio ? <Bike className="w-6 h-6 text-cyan-400" /> : <Plus className="w-6 h-6" />}
            </div>
            <p className="text-xs font-semibold text-slate-300">
              {esDomicilio ? 'Domicilio disponible' : 'Mesa disponible'}
            </p>
            <p className="text-[11px] text-slate-500">
              {esDomicilio ? 'Toca para tomar pedido para llevar / entrega' : 'Toca para abrir y tomar pedido'}
            </p>
          </div>
        )}
      </div>

      {/* Barra de acción inferior */}
      <div
        className={`px-5 py-3 border-t flex items-center justify-between text-xs font-semibold transition-colors ${
          estaOcupada
            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
            : 'bg-slate-900/40 border-slate-800/60 text-slate-400 group-hover:text-emerald-400'
        }`}
      >
        {estaOcupada ? (
          <>
            <span className="text-slate-400">
              {cantidadItems} {cantidadItems === 1 ? 'ítem' : 'ítems'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCobroRapido}
                disabled={cantidadItems === 0}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Cobrar</span>
              </button>
              <div className="flex items-center text-amber-400 hover:text-amber-300">
                <span>Editar</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span>{esDomicilio ? 'Abrir Pedido A Domicilio' : `Abrir Mesa ${mesa.numero}`}</span>
            <Plus className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar mesa o domicilio */}
      {mostrarConfirmacionBorrar && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm p-4 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-150"
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              {estaOcupada 
                ? `¿Cancelar orden de ${esDomicilio ? 'este Domicilio' : `Mesa ${mesa.numero}`}?`
                : `¿Eliminar ${esDomicilio ? 'este Domicilio' : `Mesa ${mesa.numero}`}?`
              }
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {estaOcupada 
                ? 'Se vaciará la comanda y la mesa volverá a estar Libre. Las órdenes siguientes se reordenarán automáticamente sin huecos.'
                : 'Se quitará del tablero principal.'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 w-full pt-1">
            <button
              type="button"
              onClick={handleCancelarBorrado}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarBorrado}
              className="flex-1 py-1.5 px-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-colors shadow-md shadow-red-500/20"
            >
              {estaOcupada ? 'Sí, Cancelar Orden' : 'Sí, Eliminar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(MesaCard);
