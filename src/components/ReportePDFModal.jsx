import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Coins, 
  CreditCard, 
  Receipt,
  UtensilsCrossed, 
  Calendar,
  ArrowDownToLine,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatearDinero, formatearFecha, formatearDiaLegible } from '../utils/helpers';
import { calcularMetricasReporte, descargarReportePDF, generarTextoReporteWhatsApp } from '../utils/pdfGenerator';
import { obtenerCostosProductos } from '../data/costos';

export default function ReportePDFModal({
  isOpen,
  onClose,
  pedidos = [],
  titulo = 'Reporte Detallado de Ventas y Ganancias',
  subtituloFecha = '',
  fechaReporte = '',
  costosPersonalizados = null,
}) {
  const [descargando, setDescargando] = useState(false);
  const [compartido, setCompartido] = useState(false);

  if (!isOpen) return null;

  const costosMap = costosPersonalizados || obtenerCostosProductos();
  const metricas = calcularMetricasReporte(pedidos, costosMap);

  const fechaTexto = subtituloFecha || (fechaReporte ? formatearDiaLegible(fechaReporte) : 'Hoy');

  const handleDescargar = () => {
    setDescargando(true);
    try {
      const nombreLimpio = `el_garaje_reporte_${fechaReporte || new Date().toISOString().split('T')[0]}.pdf`;
      descargarReportePDF({
        pedidos,
        titulo: 'Reporte Detallado de Liquidación y Ganancias',
        subtituloFecha: fechaTexto,
        costosPersonalizados: costosMap,
        nombreArchivo: nombreLimpio
      });
    } finally {
      setTimeout(() => setDescargando(false), 800);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleCompartirWhatsApp = () => {
    const texto = generarTextoReporteWhatsApp({
      pedidos,
      subtituloFecha: fechaTexto,
      costosPersonalizados: costosMap
    });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
    setCompartido(true);
    setTimeout(() => setCompartido(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {titulo}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PDF Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 capitalize">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{fechaTexto}</span>
                <span className="normal-case">•</span>
                <span className="normal-case">{metricas.numPedidos} {metricas.numPedidos === 1 ? 'comanda registrada' : 'comandas registradas'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">

          {/* Bloque 1: Resumen de Métodos de Pago (Efectivo y Transferencias) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Efectivo */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo en Caja</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatearDinero(metricas.totalEfectivo)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Recibido físicamente en caja</p>
              </div>
            </div>

            {/* Transferencias */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transferencias Bancarias</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tracking-tight">
                  {formatearDinero(metricas.totalTransferencia)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Verificadas en banco y comprobantes</p>
              </div>
            </div>
          </div>

          {/* Bloque 2: Balance Rápido */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Total Facturado:</span>
              <strong className="text-white font-mono text-sm">{formatearDinero(metricas.totalVentas)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Costo Compra / Insumos:</span>
              <strong className="text-rose-400 font-mono text-sm">{formatearDinero(metricas.totalCostoInsumos)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Ganancia Neta:</span>
              <strong className="text-emerald-400 font-mono text-sm">{formatearDinero(metricas.gananciaNetaTotal)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Comandas:</span>
              <strong className="text-amber-400 font-mono text-sm">{metricas.numPedidos}</strong>
            </div>
          </div>

          {/* Bloque 3: Tablas por Cada Categoría y sus Productos */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span>Detalle Organizado por Categorías y Productos:</span>
              </h3>
            </div>

            {metricas.categoriasLista.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                No hay pedidos registrados en este período.
              </div>
            ) : (
              metricas.categoriasLista.map((cat, idx) => (
                <div key={cat.id} className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
                  {/* Encabezado de la Categoría */}
                  <div className="px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        {idx + 1}. {cat.nombre}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400">
                      {cat.cantidad} {cat.cantidad === 1 ? 'unidad vendida' : 'unidades vendidas'}
                    </span>
                  </div>

                  {/* Tabla de Productos de la Categoría */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Producto</th>
                          <th className="py-2 px-2 text-center">Cant.</th>
                          <th className="py-2 px-2 text-right">P. Venta</th>
                          <th className="py-2 px-2 text-right">P. Compra</th>
                          <th className="py-2 px-2 text-right">Total Venta</th>
                          <th className="py-2 px-2 text-right">Total Costo</th>
                          <th className="py-2 px-3 text-right">Ganancia Neta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
                        {cat.productos.map((prod, pIdx) => (
                          <tr key={pIdx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-200">
                              {prod.nombre} {prod.variante && <span className="text-[10px] text-amber-400">({prod.variante})</span>}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-slate-300">
                              {prod.cantidad}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-300">
                              {formatearDinero(prod.precioUnitario)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-400">
                              {formatearDinero(prod.costoUnitario)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-100">
                              {formatearDinero(prod.totalVenta)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-amber-400/90">
                              {formatearDinero(prod.totalCosto)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-400">
                              +{formatearDinero(prod.gananciaTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Subtotal de la Categoría */}
                      <tfoot className="bg-slate-850/90 font-bold border-t border-slate-800 text-xs">
                        <tr>
                          <td className="py-2 px-3 text-slate-300 uppercase text-[11px]">
                            Subtotal {cat.nombre}
                          </td>
                          <td className="py-2 px-2 text-center text-amber-400 font-mono font-bold">
                            {cat.cantidad}
                          </td>
                          <td colSpan={2} className="py-2 px-2"></td>
                          <td className="py-2 px-2 text-right text-white font-mono">
                            {formatearDinero(cat.totalVenta)}
                          </td>
                          <td className="py-2 px-2 text-right text-amber-400 font-mono">
                            {formatearDinero(cat.totalCosto)}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-mono font-black">
                            +{formatearDinero(cat.gananciaTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bloque 4: Gran Total General */}
          {metricas.categoriasLista.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                  Gran Total General
                </span>
                <span className="text-xs text-slate-400">
                  Suma acumulada de todas las categorías
                </span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Venta</span>
                  <span className="text-base sm:text-lg font-mono font-black text-white">
                    {formatearDinero(metricas.totalVentas)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">Total Insumos</span>
                  <span className="text-base sm:text-lg font-mono font-bold text-rose-400">
                    {formatearDinero(metricas.totalCostoInsumos)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Ganancia Neta</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                    +{formatearDinero(metricas.gananciaNetaTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Barra de Acciones / Botones Inferiores */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            El PDF incluye los cuadros por categoría, membretes oficiales y formato A4.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCompartirWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Compartir resumen estructurado por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>{compartido ? '¡Enviando!' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Imprimir vista del reporte"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDescargar}
              disabled={descargando}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{descargando ? 'Generando PDF...' : 'Descargar PDF Oficial'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
