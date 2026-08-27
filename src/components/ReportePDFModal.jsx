import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Coins, 
  CreditCard, 
  TrendingUp, 
  Receipt,
  UtensilsCrossed, 
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowDownToLine,
  Beer,
  CupSoda,
  Soup,
  Layers
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
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>{fechaTexto}</span>
                <span>•</span>
                <span>{metricas.numPedidos} {metricas.numPedidos === 1 ? 'comanda registrada' : 'comandas registradas'}</span>
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

          {/* Bloque 1: Resumen de Métodos de Pago y Ganancia Neta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Efectivo */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efectivo en Caja</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatearDinero(metricas.totalEfectivo)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Recibido en billetes y monedas</p>
              </div>
            </div>

            {/* Transferencias */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-blue-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transferencias</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-blue-400 font-mono tracking-tight">
                  {formatearDinero(metricas.totalTransferencia)}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">Comprobantes y bancos</p>
              </div>
            </div>

            {/* Ganancia Neta Real */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/50 shadow-lg shadow-amber-500/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Ganancia Neta Real</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {formatearDinero(metricas.gananciaNetaTotal)}
                </span>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Margen: {metricas.margenPromedio.toFixed(1)}% de ganancia
                </p>
              </div>
            </div>
          </div>

          {/* Bloque 2: Balance Rápido Venta vs Compra */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Total Venta Bruta:</span>
              <strong className="text-white font-mono text-sm">{formatearDinero(metricas.totalVentas)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Costo Compra / Insumos:</span>
              <strong className="text-rose-400 font-mono text-sm">{formatearDinero(metricas.totalCostoInsumos)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Comandas:</span>
              <strong className="text-amber-400 font-mono text-sm">{metricas.numPedidos} pedidos</strong>
            </div>
          </div>

          {/* Bloque 3: Desglose por Categorías Solicitadas (Porciones, Cervezas, Colas, etc.) */}
          <div>
            <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Desglose y Ganancias por Categoría:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {metricas.categoriasLista.map((cat) => (
                <div 
                  key={cat.id} 
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-white truncate">{cat.nombre}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 shrink-0">
                      {cat.cantidad} {cat.cantidad === 1 ? 'unidad' : 'unidades'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Venta</span>
                      <span className="font-mono font-bold text-slate-200">{formatearDinero(cat.venta)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Costo</span>
                      <span className="font-mono font-bold text-amber-400/90">{formatearDinero(cat.costo)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold block">Ganancia</span>
                      <span className="font-mono font-black text-emerald-400">{formatearDinero(cat.ganancia)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloque 4: Previsualización de Tabla de Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Detalle Ítem por Ítem ({metricas.productosLista.length} productos vendidos):</span>
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-850 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-2 text-center">Cant.</th>
                    <th className="py-2.5 px-2 text-right">P. Venta</th>
                    <th className="py-2.5 px-2 text-right">P. Compra</th>
                    <th className="py-2.5 px-2 text-right">Total Venta</th>
                    <th className="py-2.5 px-3 text-right">Ganancia Neta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {metricas.productosLista.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
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
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-400">
                        +{formatearDinero(prod.gananciaTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Barra de Acciones / Botones Inferiores */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            El PDF incluye todos los membretes, sellos, firmas y formato imprimible en hoja A4.
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
