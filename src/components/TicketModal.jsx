import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Check, 
  Receipt, 
  Utensils, 
  Trash2,
  AlertTriangle,
  Bike
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero, formatearFecha, imprimirTicket } from '../utils/helpers';

export default function TicketModal() {
  const { 
    isTicketModalOpen, 
    setIsTicketModalOpen, 
    ticketPedido, 
    eliminarPedidoHistorial 
  } = usePedidos();

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);

  if (!isTicketModalOpen || !ticketPedido) return null;

  const productos = ticketPedido.productos || [];

  const handleAnularPedido = async () => {
    if (!ticketPedido) return;
    await eliminarPedidoHistorial(ticketPedido.id);
    setMostrarConfirmacionEliminar(false);
    setIsTicketModalOpen(false);
  };

  const esDomicilio = ticketPedido.mesa === 'Domicilio' || ticketPedido.mesa === 'A Domicilio';

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del Modal */}
        <div className="px-6 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Comprobante de Venta</h3>
          </div>
          <button
            onClick={() => setIsTicketModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENEDOR DEL TICKET TÉRMICO (Imprimible) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex justify-center">
          
          {/* Formato de Ticket Térmico de 80mm */}
          <div 
            id="ticket-termico"
            className="w-full max-w-[320px] bg-white text-slate-900 p-4 rounded-xl shadow-inner font-mono text-xs space-y-3 print:p-0 print:shadow-none print:w-full"
          >
            {/* Cabecera del Ticket */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
              <img 
                src="https://eyzcuxspypnnwzzatnzs.supabase.co/storage/v1/object/public/Imagen/EL%20GARAJE.png" 
                alt="El Garaje Calacaleño" 
                className="h-12 w-auto mx-auto object-contain filter grayscale contrast-125"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h2 className="font-black text-base tracking-tight text-slate-900 uppercase">
                EL GARAJE CALACALEÑO
              </h2>
              <p className="text-[10px] text-slate-700 font-sans font-semibold">
                Comida tradicional del Ecuador
              </p>
              <p className="text-[9px] text-slate-600 font-sans">
                RUC: 1710793256001 • Calacalí, Ecuador
              </p>
            </div>

            {/* Metadatos del Comprobante (Sin la parte de "ORDER") */}
            <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between items-center font-bold text-slate-950">
                <span>ATENCIÓN:</span>
                <span className="text-xs font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                  {esDomicilio ? '🛵 A DOMICILIO' : `MESA ${ticketPedido.mesa}`}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>FECHA: {formatearFecha(ticketPedido.fecha, "dd/MM/yyyy")}</span>
                <span>HORA: {formatearFecha(ticketPedido.fecha, "hh:mm a")}</span>
              </div>
              {ticketPedido.notas && (
                <div className="text-[10px] text-slate-700 bg-slate-100 p-1.5 rounded mt-1 font-sans border border-slate-200">
                  <strong>Nota / Dirección:</strong> {ticketPedido.notas}
                </div>
              )}
            </div>

            {/* Tabla de Productos */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
              <div className="grid grid-cols-12 font-bold text-[10px] text-slate-600 pb-1 border-b border-slate-200">
                <span className="col-span-2">CANT</span>
                <span className="col-span-7">DESCRIPCIÓN</span>
                <span className="col-span-3 text-right">TOTAL</span>
              </div>

              {productos.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] items-start leading-tight">
                  <span className="col-span-2 font-bold text-slate-800">
                    {item.cantidad}x
                  </span>
                  <div className="col-span-7">
                    <span className="font-semibold text-slate-900">{item.nombre}</span>
                    {item.variante && (
                      <span className="text-[10px] text-slate-600 block">
                        ({item.variante})
                      </span>
                    )}
                    {item.notas && (
                      <span className="text-[9px] text-slate-500 italic block">
                        * {item.notas}
                      </span>
                    )}
                  </div>
                  <span className="col-span-3 text-right font-bold text-slate-900">
                    {formatearDinero((Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 1))}
                  </span>
                </div>
              ))}
            </div>

            {/* Totales y Formas de Pago */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-black text-base text-slate-950 pt-1">
                <span>TOTAL:</span>
                <span>{formatearDinero(ticketPedido.total)}</span>
              </div>
              
              {/* Formas de Pago Específicas */}
              <div className="flex justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                <span>MÉTODO DE PAGO:</span>
                <span className="font-bold uppercase">
                  {ticketPedido.metodoPago === 'mixto' ? 'Pago Combinado (Mixto)' : 
                   ticketPedido.metodoPago === 'dividido' ? 'Cuentas Separadas' : 
                   ticketPedido.metodoPago || 'Efectivo'}
                </span>
              </div>

              {/* EFECTIVO SIMPLE */}
              {ticketPedido.metodoPago === 'efectivo' && (
                <>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>MONTO RECIBIDO:</span>
                    <span>{formatearDinero(ticketPedido.montoRecibido || ticketPedido.total)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>CAMBIO / VUELTO:</span>
                    <span>{formatearDinero(ticketPedido.cambio || 0)}</span>
                  </div>
                </>
              )}

              {/* TRANSFERENCIA SIMPLE */}
              {ticketPedido.metodoPago === 'transferencia' && (
                <>
                  {ticketPedido.banco && (
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>BANCO:</span>
                      <span>{ticketPedido.banco}</span>
                    </div>
                  )}
                  {ticketPedido.comprobante && (
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>REF / COMPROBANTE:</span>
                      <span>{ticketPedido.comprobante}</span>
                    </div>
                  )}
                </>
              )}

              {/* PAGO MIXTO (EFECTIVO + TRANSFERENCIA) */}
              {ticketPedido.metodoPago === 'mixto' && (
                <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-700">
                    <span>• Transferencia ({ticketPedido.banco || 'DeUna'}):</span>
                    <span className="font-bold font-mono">{formatearDinero(ticketPedido.montoTransferencia)}</span>
                  </div>
                  {ticketPedido.comprobante && (
                    <div className="text-[9px] text-slate-500 italic pl-2">
                      Ref: {ticketPedido.comprobante}
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>• Efectivo:</span>
                    <span className="font-bold font-mono">{formatearDinero(ticketPedido.montoEfectivo)}</span>
                  </div>
                  {ticketPedido.cambio > 0 && (
                    <div className="flex justify-between text-slate-900 font-bold pt-0.5 border-t border-slate-200">
                      <span>Vuelto entregado:</span>
                      <span className="font-mono">{formatearDinero(ticketPedido.cambio)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PAGO DIVIDIDO / CUENTAS SEPARADAS */}
              {ticketPedido.metodoPago === 'dividido' && (
                <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1 text-[10px]">
                  <span className="font-bold block text-slate-700">Desglose por Comensal:</span>
                  {(ticketPedido.desglosePagos || []).map((p, i) => (
                    <div key={i} className="flex justify-between text-slate-600 border-b border-slate-100 pb-0.5">
                      <span>{p.persona} ({p.metodo === 'efectivo' ? 'Efec' : 'Transf'}):</span>
                      <span className="font-mono font-semibold">{formatearDinero(p.monto)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-slate-800 pt-0.5">
                    <span>Total Efectivo: {formatearDinero(ticketPedido.montoEfectivo)}</span>
                    <span>Transf: {formatearDinero(ticketPedido.montoTransferencia)}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Pie del Ticket */}
            <div className="text-center pt-2 text-[10px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">¡GRACIAS POR SU PREFERENCIA!</p>
              <p>Esperamos verle pronto en El Garaje Calacaleño</p>
              <p className="text-[8px] text-slate-400 font-mono">
                Sistema El Garaje Calacaleño POS
              </p>
            </div>

          </div>

        </div>

        {/* Botonera de Acción */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 no-print shrink-0">
          <button
            type="button"
            onClick={() => setMostrarConfirmacionEliminar(true)}
            className="py-2.5 px-3 rounded-xl border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Anular o eliminar este pedido si hubo una equivocación"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Anular / Eliminar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={imprimirTicket}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal de confirmación para anular / eliminar pedido */}
      {mostrarConfirmacionEliminar && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-2xl p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                ¿Anular este comprobante?
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Este pedido será <strong>eliminado de la base de datos</strong>, del historial de ventas y de los cierres de caja.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionEliminar(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={handleAnularPedido}
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
