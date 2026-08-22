import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Users, 
  User,
  ChevronLeft, 
  MessageSquare, 
  Sparkles, 
  ShoppingBag, 
  Bike,
  Cloud 
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearHora } from '../utils/helpers';
import MenuPanel from './MenuPanel';

export default function PedidoModal() {
  const { 
    mesaSeleccionada, 
    mesaActual, 
    pedidoActual, 
    isPedidoModalOpen, 
    setIsPedidoModalOpen, 
    setIsCobroModalOpen,
    cambiarCantidad, 
    eliminarProducto, 
    actualizarNotasItem, 
    actualizarPrecioItem,
    actualizarNotasPedido,
    cancelarPedidoMesa,
    cerrarModalPedido,
    mostrarNotificacion
  } = usePedidos();

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [tabMovil, setTabMovil] = useState('menu'); // 'menu' | 'pedido' en pantallas pequeñas
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [tempNote, setTempNote] = useState('');
  const [editingPriceIndex, setEditingPriceIndex] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  if (!isPedidoModalOpen || !mesaSeleccionada) return null;

  const productos = pedidoActual?.productos || [];
  const cantidadTotal = productos.reduce((acc, p) => acc + (p.cantidad || 0), 0);
  const total = pedidoActual?.total || 0;

  const handleProcederCobro = () => {
    if (productos.length === 0) {
      mostrarNotificacion('Agrega al menos un producto al pedido antes de cobrar', 'error');
      return;
    }
    setIsCobroModalOpen(true);
  };

  const handleGuardarNotaItem = (index) => {
    actualizarNotasItem(index, tempNote);
    setEditingNoteIndex(null);
    setTempNote('');
  };

  const handleGuardarPrecioItem = (index) => {
    const num = parseFloat(tempPrice);
    if (!isNaN(num) && num >= 0) {
      actualizarPrecioItem(index, num);
    }
    setEditingPriceIndex(null);
    setTempPrice('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full h-full max-w-7xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header del POS */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-amber-500/20">
              {mesaSeleccionada === 'Domicilio' ? <Bike className="w-5 h-5" /> : `M${mesaSeleccionada}`}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">
                  {mesaSeleccionada === 'Domicilio' ? 'A Domicilio' : `Mesa ${mesaSeleccionada}`}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                  Orden #{pedidoActual?.numeroOrden || '---'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                  <Cloud className="w-3 h-3" />
                  <span>Sincronización multidispositivo</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Iniciado: {pedidoActual?.fecha ? formatearHora(pedidoActual.fecha) : 'Ahora'}
              </p>
            </div>
          </div>

          {/* Toggle en pantallas pequeñas */}
          <div className="flex items-center gap-2">
            <div className="flex lg:hidden items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setTabMovil('menu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tabMovil === 'menu' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Menú
              </button>
              <button
                onClick={() => setTabMovil('pedido')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                  tabMovil === 'pedido' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                <span>Pedido</span>
                {cantidadTotal > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-950 text-white text-[10px]">
                    {cantidadTotal}
                  </span>
                )}
              </button>
            </div>

            {/* Botón Cerrar Modal */}
            <button
              onClick={cerrarModalPedido}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Volver a mesas"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal del POS: Dos Columnas (Menú + Comanda) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Columna Izquierda: Menú (lg: 7 columnas) */}
          <div
            className={`lg:col-span-7 p-3 sm:p-4 overflow-hidden h-full ${
              tabMovil === 'menu' ? 'block' : 'hidden lg:block'
            }`}
          >
            <MenuPanel />
          </div>

          {/* Columna Derecha: Comanda / Resumen del Pedido (lg: 5 columnas) */}
          <div
            className={`lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 flex flex-col justify-between overflow-hidden h-full ${
              tabMovil === 'pedido' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            
            {/* Cabecera de la Comanda */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Detalle de la Comanda ({cantidadTotal} {cantidadTotal === 1 ? 'producto' : 'productos'})
                </h3>
              </div>

              {productos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar mesa</span>
                </button>
              )}
            </div>

            {/* Lista de Productos Agregados */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
              {productos.length > 0 ? (
                productos.map((item, index) => (
                  <div
                    key={`${item.productoId}_${item.variante}_${index}`}
                    className="p-3 bg-slate-800/80 border border-slate-700/70 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">
                            {item.nombre}
                          </span>
                          {item.variante && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                              {item.variante}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">
                            {formatearDinero(item.precioUnitario)} c/u
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceIndex(index);
                              setTempPrice(item.precioUnitario.toString());
                            }}
                            className="text-[10px] text-amber-400/80 hover:text-amber-300 underline font-semibold transition-colors"
                            title="Cambiar precio unitario de este ítem"
                          >
                            Editar precio
                          </button>
                        </div>
                      </div>

                      {/* Subtotal del ítem */}
                      <span className="font-extrabold text-sm text-white font-mono shrink-0">
                        {formatearDinero(item.precioUnitario * item.cantidad)}
                      </span>
                    </div>

                    {/* Nota del ítem si existe */}
                    {item.notas && (
                      <div className="text-xs text-amber-300/90 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="italic">{item.notas}</span>
                      </div>
                    )}

                    {/* Controles de Cantidad y Acciones */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                      
                      {/* Botón para agregar/editar nota */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteIndex(index);
                          setTempNote(item.notas || '');
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{item.notas ? 'Editar nota' : '+ Nota'}</span>
                      </button>

                      {/* Contador +/- */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(index, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="w-7 text-center font-extrabold text-sm font-mono text-white">
                          {item.cantidad}
                        </span>

                        <button
                          type="button"
                          onClick={() => cambiarCantidad(index, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarProducto(index)}
                          className="p-1 text-slate-500 hover:text-rose-400 ml-1 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Formulario rápido para editar precio / otro valor */}
                    {editingPriceIndex === index && (
                      <div className="pt-2 flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-amber-500/30">
                        <span className="text-xs font-bold text-amber-400 font-mono">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          inputMode="decimal"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold font-mono text-white focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleGuardarPrecioItem(index)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPriceIndex(null)}
                          className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Formulario rápido para editar nota */}
                    {editingNoteIndex === index && (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="Ej. Con poco hielo, bien dorado..."
                          className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleGuardarNotaItem(index)}
                          className="p-1 bg-emerald-500 text-slate-950 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNoteIndex(null)}
                          className="p-1 bg-slate-700 text-slate-300 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-600">
                    <ShoppingBag className="w-7 h-7 stroke-1" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Comanda vacía</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Selecciona productos del menú a la izquierda para agregarlos a la Mesa {mesaSeleccionada}.
                  </p>
                </div>
              )}
            </div>

            {/* Totalizador y Acciones de Cobro */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              
              {/* Notas generales del pedido / Nombre del Cliente */}
              <div className="relative flex items-center">
                <User className="absolute left-3 w-3.5 h-3.5 text-amber-400" />
                <input
                  type="text"
                  value={pedidoActual?.notas || ''}
                  onChange={(e) => actualizarNotasPedido(e.target.value)}
                  placeholder="Nombre del cliente o notas (ej. Carlos, sin cebolla)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Fila de Total */}
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-semibold">TOTAL A COBRAR</span>
                  <span className="text-xs text-slate-500">Impuestos y servicio incluidos</span>
                </div>
                <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                  {formatearDinero(total)}
                </span>
              </div>

              {/* Botonera de Acción */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={cerrarModalPedido}
                  className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Volver a Mesas</span>
                </button>

                <button
                  type="button"
                  onClick={handleProcederCobro}
                  disabled={productos.length === 0}
                  className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Cobrar {formatearDinero(total)}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Modal de confirmación para cancelar pedido / vaciar mesa */}
      {confirmandoEliminar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">¿Cancelar pedido de Mesa {mesaSeleccionada}?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Se vaciarán todos los productos agregados y la mesa volverá al estado Libre.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelarPedidoMesa(mesaSeleccionada);
                  setConfirmandoEliminar(false);
                }}
                className="py-2 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
