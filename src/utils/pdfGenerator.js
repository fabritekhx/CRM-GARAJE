/**
 * Generador de Reportes PDF Oficiales para El Garaje Calacaleño
 * Utiliza jsPDF para renderizado vectorial puro, nítido y compatible con todos los navegadores.
 */
import jsPDF from 'jspdf';
import { formatearDinero, formatearFecha, formatearDiaLegible } from './helpers';
import { obtenerCostosProductos, obtenerCostoUnitario } from '../data/costos';

/**
 * Calcula todas las métricas detalladas para una lista de pedidos dada
 */
export const calcularMetricasReporte = (pedidos = [], costosPersonalizados = null) => {
  const costosMap = costosPersonalizados || obtenerCostosProductos();

  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let totalVentas = 0;
  let totalCostoInsumos = 0;

  // Conteo por producto
  const productosDetalleMap = {};

  // Categorías de agrupación
  const categoriasResumen = {
    porciones: { id: 'porciones', nombre: 'Porciones Extras (Patacones, Yuca, Arroz, Curtido)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    cervezas: { id: 'cervezas', nombre: 'Cervezas (Pilsener 750ml)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    gaseosas: { id: 'gaseosas', nombre: 'Gaseosas y Bebidas (Colas, Fuisti, Agua)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    jugos: { id: 'jugos', nombre: 'Jugos Naturales (Jarras y Vasos)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    sabados: { id: 'sabados', nombre: 'Platos de Sábado (Fritada y Caldos)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    domingos: { id: 'domingos', nombre: 'Platos de Domingo (Encebollados y Mariscos)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    pescados: { id: 'pescados', nombre: 'Pescados Fritos (Viernes)', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
    otros: { id: 'otros', nombre: 'Otros Productos / Varios', venta: 0, costo: 0, ganancia: 0, cantidad: 0 },
  };

  pedidos.forEach((p) => {
    if (p.estado === 'cancelado') return;
    
    const tot = Number(p.total) || 0;
    totalVentas += tot;

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

    // Iterar productos
    (p.productos || []).forEach((item) => {
      const cant = Number(item.cantidad) || 1;
      const pVenta = Number(item.precioUnitario) || 0;
      const costoUnit = obtenerCostoUnitario(item.productoId, pVenta, costosMap);
      
      const vTotal = cant * pVenta;
      const cTotal = cant * costoUnit;
      const ganancia = vTotal - cTotal;

      totalCostoInsumos += cTotal;

      // Agrupar por producto
      const key = `${item.nombre}${item.variante ? ` (${item.variante})` : ''}__${pVenta.toFixed(2)}`;
      if (!productosDetalleMap[key]) {
        productosDetalleMap[key] = {
          id: item.productoId,
          nombre: item.nombre,
          variante: item.variante || '',
          categoria: item.categoria || 'general',
          precioUnitario: pVenta,
          costoUnitario: costoUnit,
          cantidad: 0,
          totalVenta: 0,
          totalCosto: 0,
          gananciaTotal: 0,
        };
      }

      productosDetalleMap[key].cantidad += cant;
      productosDetalleMap[key].totalVenta += vTotal;
      productosDetalleMap[key].totalCosto += cTotal;
      productosDetalleMap[key].gananciaTotal += ganancia;

      // Agrupar por categoría
      const catKey = item.categoria || 'otros';
      let targetCat = categoriasResumen[catKey];
      if (!targetCat) {
        // Asignación inteligente por nombre si no tiene categoría estándar
        const nom = (item.nombre || '').toLowerCase();
        if (nom.includes('pilsener') || nom.includes('cerveza')) targetCat = categoriasResumen.cervezas;
        else if (nom.includes('cola') || nom.includes('gaseosa') || nom.includes('agua') || nom.includes('fuisti')) targetCat = categoriasResumen.gaseosas;
        else if (nom.includes('patac') || nom.includes('yuca') || nom.includes('arroz') || nom.includes('curtido')) targetCat = categoriasResumen.porciones;
        else if (nom.includes('jugo') || nom.includes('jarra')) targetCat = categoriasResumen.jugos;
        else if (nom.includes('fritada') || nom.includes('caldo')) targetCat = categoriasResumen.sabados;
        else if (nom.includes('encebollado') || nom.includes('corvina') || nom.includes('camar')) targetCat = categoriasResumen.domingos;
        else if (nom.includes('pargo') || nom.includes('tilapia') || nom.includes('pescado')) targetCat = categoriasResumen.pescados;
        else targetCat = categoriasResumen.otros;
      }

      if (targetCat) {
        targetCat.cantidad += cant;
        targetCat.venta += vTotal;
        targetCat.costo += cTotal;
        targetCat.ganancia += ganancia;
      }
    });
  });

  const gananciaNetaTotal = totalVentas - totalCostoInsumos;
  const margenPromedio = totalVentas > 0 ? (gananciaNetaTotal / totalVentas) * 100 : 0;

  const productosLista = Object.values(productosDetalleMap).sort((a, b) => b.totalVenta - a.totalVenta);
  const categoriasLista = Object.values(categoriasResumen).filter((c) => c.cantidad > 0);

  return {
    numPedidos: pedidos.length,
    totalVentas,
    totalEfectivo,
    totalTransferencia,
    totalCostoInsumos,
    gananciaNetaTotal,
    margenPromedio,
    productosLista,
    categoriasLista,
  };
};

/**
 * Genera un documento jsPDF completo en formato A4 con todo el desglose
 */
export const generarReportePDFCompleto = ({
  pedidos = [],
  titulo = 'REPORTE DE VENTAS Y GANANCIAS',
  subtituloFecha = '',
  costosPersonalizados = null,
  nombreArchivo = 'el_garaje_reporte_ganancias.pdf'
}) => {
  const metricas = calcularMetricasReporte(pedidos, costosPersonalizados);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let y = 16;

  // Helper para nueva página si es necesario
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = 16;
      // Header sutil en páginas siguientes
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`EL GARAJE CALACALE\u00D1O \u2022 ${titulo} (Continuaci\u00F3n)`, margin, y);
      y += 8;
    }
  };

  // 1. BANNER CABECERA ELEGANTE
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Borde acento ámbar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, y, 3, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('EL GARAJE CALACALE\u00D1O', margin + 7, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text(titulo.toUpperCase(), margin + 7, y + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha/Per\u00EDodo: ${subtituloFecha || 'Fecha actual'}   |   Emisi\u00F3n: ${formatearFecha(new Date(), 'dd/MM/yyyy - hh:mm a')}`, margin + 7, y + 19.5);

  y += 28;

  // 2. TARJETAS DE RESUMEN EJECUTIVO (METODOS DE PAGO + GANANCIA)
  checkPageBreak(38);

  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 24;

  // Tarjeta 1: Total en Efectivo
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('EFECTIVO EN CAJA', margin + 4, y + 6);

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatearDinero(metricas.totalEfectivo), margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Monto f\u00EDsico recibido', margin + 4, y + 19.5);

  // Tarjeta 2: Total en Transferencias
  const xCard2 = margin + cardWidth + 3;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(xCard2, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.roundedRect(xCard2, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TRANSFERENCIAS BANCARIAS', xCard2 + 4, y + 6);

  doc.setFontSize(13);
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text(formatearDinero(metricas.totalTransferencia), xCard2 + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Verificadas en banco', xCard2 + 4, y + 19.5);

  // Tarjeta 3: Ganancia Neta Total
  const xCard3 = margin + (cardWidth + 3) * 2;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(xCard3, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(xCard3, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('GANANCIA NETA REAL', xCard3 + 4, y + 6);

  doc.setFontSize(13);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(formatearDinero(metricas.gananciaNetaTotal), xCard3 + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text(`Margen promedio: ${metricas.margenPromedio.toFixed(1)}%`, xCard3 + 4, y + 19.5);

  y += cardHeight + 6;

  // BANNER DE TOTALES GENERALES
  checkPageBreak(16);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Ventas Brutas Totales: `, margin + 4, y + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(formatearDinero(metricas.totalVentas), margin + 35, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`Costo de Compra/Insumos: `, margin + 65, y + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatearDinero(metricas.totalCostoInsumos), margin + 104, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Comandas: `, margin + 130, y + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${metricas.numPedidos} pedidos`, margin + 147, y + 7.5);

  y += 18;

  // 3. DESGLOSE POR CATEGORÍAS Y RENTABILIDAD (Porciones, Cervezas, Gaseosas, etc.)
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RENDIMIENTO Y GANANCIAS POR CATEGOR\u00CDAS', margin, y);
  y += 4;

  // Encabezado de la tabla de categorías
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('CATEGOR\u00CDA / GRUPO', margin + 3, y + 4.2);
  doc.text('CANT', margin + 85, y + 4.2, { align: 'center' });
  doc.text('TOTAL VENTA', margin + 115, y + 4.2, { align: 'right' });
  doc.text('COSTO COMPRA', margin + 145, y + 4.2, { align: 'right' });
  doc.text('GANANCIA NETA', margin + contentWidth - 3, y + 4.2, { align: 'right' });

  y += 6;

  metricas.categoriasLista.forEach((cat, idx) => {
    checkPageBreak(7);
    const bgRow = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(bgRow, bgRow, bgRow);
    doc.rect(margin, y, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(cat.nombre, margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.text(`${cat.cantidad} un.`, margin + 85, y + 4.2, { align: 'center' });

    doc.text(formatearDinero(cat.venta), margin + 115, y + 4.2, { align: 'right' });

    doc.setTextColor(180, 83, 9);
    doc.text(formatearDinero(cat.costo), margin + 145, y + 4.2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(formatearDinero(cat.ganancia), margin + contentWidth - 3, y + 4.2, { align: 'right' });

    y += 6;
  });

  // Fila total categorías
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CATEGOR\u00CDAS', margin + 3, y + 4.5);
  doc.text(formatearDinero(metricas.totalVentas), margin + 115, y + 4.5, { align: 'right' });
  doc.setTextColor(180, 83, 9);
  doc.text(formatearDinero(metricas.totalCostoInsumos), margin + 145, y + 4.5, { align: 'right' });
  doc.setTextColor(16, 185, 129);
  doc.text(formatearDinero(metricas.gananciaNetaTotal), margin + contentWidth - 3, y + 4.5, { align: 'right' });

  y += 12;

  // 4. DETALLE PRODUCTO POR PRODUCTO
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DETALLE PRODUCTO POR PRODUCTO (COMPRA VS VENTA)', margin, y);
  y += 4;

  // Encabezado de la tabla de productos
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  doc.text('PRODUCTO', margin + 3, y + 4.2);
  doc.text('CANT', margin + 65, y + 4.2, { align: 'center' });
  doc.text('P. VENTA', margin + 85, y + 4.2, { align: 'right' });
  doc.text('P. COMPRA', margin + 105, y + 4.2, { align: 'right' });
  doc.text('TOTAL VENTA', margin + 130, y + 4.2, { align: 'right' });
  doc.text('COSTO TOTAL', margin + 155, y + 4.2, { align: 'right' });
  doc.text('GANANCIA NETA', margin + contentWidth - 3, y + 4.2, { align: 'right' });

  y += 6;

  metricas.productosLista.forEach((prod, idx) => {
    checkPageBreak(6.5);
    const bgRow = idx % 2 === 0 ? 255 : 248;
    doc.setFillColor(bgRow, bgRow, bgRow);
    doc.rect(margin, y, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const nombreCompleto = `${prod.nombre}${prod.variante ? ` (${prod.variante})` : ''}`;
    doc.text(nombreCompleto.substring(0, 32), margin + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.text(`${prod.cantidad}`, margin + 65, y + 4.2, { align: 'center' });

    doc.text(formatearDinero(prod.precioUnitario), margin + 85, y + 4.2, { align: 'right' });
    doc.setTextColor(120, 120, 120);
    doc.text(formatearDinero(prod.costoUnitario), margin + 105, y + 4.2, { align: 'right' });

    doc.setTextColor(30, 41, 59);
    doc.text(formatearDinero(prod.totalVenta), margin + 130, y + 4.2, { align: 'right' });

    doc.setTextColor(180, 83, 9);
    doc.text(formatearDinero(prod.totalCosto), margin + 155, y + 4.2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatearDinero(prod.gananciaTotal), margin + contentWidth - 3, y + 4.2, { align: 'right' });

    y += 6;
  });

  // Fila gran total
  checkPageBreak(8);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GENERAL', margin + 3, y + 4.5);
  doc.text(formatearDinero(metricas.totalVentas), margin + 130, y + 4.5, { align: 'right' });
  doc.setTextColor(180, 83, 9);
  doc.text(formatearDinero(metricas.totalCostoInsumos), margin + 155, y + 4.5, { align: 'right' });
  doc.setTextColor(16, 185, 129);
  doc.text(formatearDinero(metricas.gananciaNetaTotal), margin + contentWidth - 3, y + 4.5, { align: 'right' });

  y += 14;

  // 5. PIE DE PÁGINA Y FIRMAS
  checkPageBreak(25);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Reporte financiero generado por El Garaje Calacale\u00F1o POS.', margin, y);
  doc.text('Documento v\u00E1lido para liquidaci\u00F3n y control interno de caja.', margin + contentWidth, y, { align: 'right' });

  return doc;
};

/**
 * Descarga directamente el PDF en el navegador
 */
export const descargarReportePDF = (opciones) => {
  try {
    const doc = generarReportePDFCompleto(opciones);
    if (!doc) return false;
    const nombre = opciones.nombreArchivo || `el_garaje_reporte_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombre);
    return true;
  } catch (error) {
    console.error('Error al descargar reporte PDF:', error);
    return false;
  }
};

/**
 * Genera el resumen en texto estructurado con formato amigable para WhatsApp
 */
export const generarTextoReporteWhatsApp = ({ pedidos = [], subtituloFecha = '', costosPersonalizados = null }) => {
  const metricas = calcularMetricasReporte(pedidos, costosPersonalizados);

  const lineas = [
    `📊 *EL GARAJE CALACALEÑO - CUADRE Y GANANCIAS* 📊`,
    `📅 *Fecha:* ${subtituloFecha || 'Hoy'}`,
    `⏰ *Generado:* ${formatearFecha(new Date(), 'hh:mm a')}`,
    `------------------------------------------`,
    `💰 *RESUMEN DE CAJA Y FORMAS DE PAGO:*`,
    `💵 *Efectivo en Caja:* ${formatearDinero(metricas.totalEfectivo)}`,
    `📱 *Transferencias:* ${formatearDinero(metricas.totalTransferencia)}`,
    `🧾 *Total Ventas Brutas:* ${formatearDinero(metricas.totalVentas)} (${metricas.numPedidos} pedidos)`,
    `------------------------------------------`,
    `📈 *BALANCE DE GANANCIAS:*`,
    `🛒 *Costo Compra / Insumos:* ${formatearDinero(metricas.totalCostoInsumos)}`,
    `💵 *GANANCIA NETA TOTAL:* ${formatearDinero(metricas.gananciaNetaTotal)} (Margen: ${metricas.margenPromedio.toFixed(1)}%)`,
    `------------------------------------------`,
    `📋 *DETALLE POR CATEGORÍAS:*`,
  ];

  metricas.categoriasLista.forEach((cat) => {
    lineas.push(`• *${cat.nombre}:* Venta ${formatearDinero(cat.venta)} | Ganancia *${formatearDinero(cat.ganancia)}*`);
  });

  lineas.push(`------------------------------------------`);
  lineas.push(`✅ *Reporte generado automáticamente por El Garaje POS*`);

  return lineas.join('\n');
};
