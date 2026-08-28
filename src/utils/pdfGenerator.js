/**
 * Generador de Reportes PDF Oficiales para El Garaje Calacaleño
 * Utiliza jsPDF para renderizado vectorial puro, nítido y compatible con todos los dispositivos.
 */
import jsPDF from 'jspdf';
import { formatearDinero, formatearFecha, formatearFechaConDiaSemana } from './helpers';
import { obtenerCostosProductos, obtenerCostoUnitario } from '../data/costos';

/**
 * Definición estructurada de categorías oficiales
 */
const CATEGORIAS_DEFINICION = [
  { id: 'pescados', orden: 1, nombre: 'Pescados Fritos (Viernes)' },
  { id: 'sabados', orden: 2, nombre: 'Platos de Sábado (Fritada y Caldos)' },
  { id: 'domingos', orden: 3, nombre: 'Platos de Domingo (Encebollados y Mariscos)' },
  { id: 'porciones', orden: 4, nombre: 'Porciones Extras (Patacones, Yuca, Arroz, Curtido)' },
  { id: 'cervezas', orden: 5, nombre: 'Cervezas (Pilsener 750ml, 1 L)' },
  { id: 'gaseosas', orden: 6, nombre: 'Gaseosas y Bebidas (Colas, Fuisti, Agua)' },
  { id: 'jugos', orden: 7, nombre: 'Jugos Naturales (Jarras y Vasos)' },
  { id: 'otros', orden: 8, nombre: 'Otros Productos / Varios' },
];

/**
 * Determina la categoría correspondiente de un ítem según categoría, ID o palabras clave
 */
export const clasificarCategoriaProducto = (item) => {
  const cat = (item.categoria || '').toLowerCase().trim();
  const id = (item.productoId || item.id || '').toLowerCase().trim();
  const nom = (item.nombre || '').toLowerCase().trim();

  // 1. Por categoría explícita
  if (cat === 'pescados' || cat.includes('pescado') || cat.includes('viernes')) return 'pescados';
  if (cat === 'sabados' || cat === 'sabado' || cat.includes('fritada') || cat.includes('caldo')) return 'sabados';
  if (cat === 'domingos' || cat === 'domingo' || cat.includes('encebollado') || cat.includes('marisco')) return 'domingos';
  if (cat === 'porciones' || cat.includes('porcion') || cat.includes('extra')) return 'porciones';
  if (cat === 'cervezas' || cat.includes('cerveza') || cat.includes('pilsener')) return 'cervezas';
  if (cat === 'gaseosas' || cat.includes('gaseosa') || cat.includes('bebida') || cat.includes('cola')) return 'gaseosas';
  if (cat === 'jugos' || cat.includes('jugo') || cat.includes('jarra')) return 'jugos';

  // 2. Por prefijo de ID
  if (id.startsWith('f-')) return 'pescados';
  if (id.startsWith('s-')) return 'sabados';
  if (id.startsWith('d-')) return 'domingos';
  if (id.startsWith('p-')) return 'porciones';
  if (id.startsWith('c-')) return 'cervezas';
  if (id.startsWith('g-')) return 'gaseosas';
  if (id.startsWith('j-')) return 'jugos';

  // 3. Por palabras clave en el nombre
  if (nom.includes('pilsener') || nom.includes('cerveza') || nom.includes('club')) return 'cervezas';
  if (nom.includes('cola') || nom.includes('gaseosa') || nom.includes('agua') || nom.includes('fuisti') || nom.includes('fiora') || nom.includes('cielo')) return 'gaseosas';
  if (nom.includes('jugo') || nom.includes('jarra') || nom.includes('vaso personal') || nom.includes('mora') || nom.includes('maracuya') || nom.includes('naranjilla') || nom.includes('guanabana')) return 'jugos';
  if (nom.includes('patacon') || nom.includes('yuca') || nom.includes('arroz') || nom.includes('curtido') || nom.includes('porcion') || nom.includes('porción')) return 'porciones';
  if (nom.includes('fritada') || nom.includes('caldo de gallina') || nom.includes('caldo de pata') || nom.includes('caldo')) return 'sabados';
  if (nom.includes('encebollado') || nom.includes('corvina') || nom.includes('camaron') || nom.includes('camarón')) return 'domingos';
  if (nom.includes('tilapia') || nom.includes('pargo') || nom.includes('lenguado') || nom.includes('picudo') || nom.includes('cabezudo') || nom.includes('cola amarilla') || nom.includes('pescado')) return 'pescados';

  return 'otros';
};

/**
 * Calcula todas las métricas detalladas agrupadas por categoría y producto
 */
export const calcularMetricasReporte = (pedidos = [], costosPersonalizados = null) => {
  const costosMap = costosPersonalizados || obtenerCostosProductos();

  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let totalVentas = 0;
  let totalCostoInsumos = 0;

  // Mapa de categorías con array de productos
  const categoriasMap = {};
  CATEGORIAS_DEFINICION.forEach((cat) => {
    categoriasMap[cat.id] = {
      id: cat.id,
      orden: cat.orden,
      nombre: cat.nombre,
      cantidad: 0,
      totalVenta: 0,
      totalCosto: 0,
      gananciaTotal: 0,
      productosMap: {},
    };
  });

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
    const prodsList = Array.isArray(p?.productos) ? p.productos : [];
    prodsList.forEach((item) => {
      const cant = Number(item.cantidad) || 1;
      const pVenta = Number(item.precioUnitario) || 0;
      const costoUnit = obtenerCostoUnitario(item.productoId, pVenta, costosMap);
      
      const vTotal = cant * pVenta;
      const cTotal = cant * costoUnit;
      const ganancia = vTotal - cTotal;

      totalCostoInsumos += cTotal;

      // Determinar categoría
      const catKey = clasificarCategoriaProducto(item);
      const targetCat = categoriasMap[catKey] || categoriasMap.otros;

      targetCat.cantidad += cant;
      targetCat.totalVenta += vTotal;
      targetCat.totalCosto += cTotal;
      targetCat.gananciaTotal += ganancia;

      // Agrupar producto dentro de la categoría
      const prodKey = `${item.nombre}__${item.variante || ''}__${pVenta.toFixed(2)}`;
      if (!targetCat.productosMap[prodKey]) {
        targetCat.productosMap[prodKey] = {
          id: item.productoId || item.id,
          nombre: item.nombre,
          variante: item.variante || '',
          categoria: catKey,
          precioUnitario: pVenta,
          costoUnitario: costoUnit,
          cantidad: 0,
          totalVenta: 0,
          totalCosto: 0,
          gananciaTotal: 0,
        };
      }

      targetCat.productosMap[prodKey].cantidad += cant;
      targetCat.productosMap[prodKey].totalVenta += vTotal;
      targetCat.productosMap[prodKey].totalCosto += cTotal;
      targetCat.productosMap[prodKey].gananciaTotal += ganancia;
    });
  });

  const gananciaNetaTotal = totalVentas - totalCostoInsumos;
  const margenPromedio = totalVentas > 0 ? (gananciaNetaTotal / totalVentas) * 100 : 0;

  // Convertir a lista y ordenar categorías por definición
  const categoriasLista = Object.values(categoriasMap)
    .filter((cat) => cat.cantidad > 0)
    .sort((a, b) => a.orden - b.orden)
    .map((cat) => ({
      ...cat,
      productos: Object.values(cat.productosMap).sort((a, b) => b.totalVenta - a.totalVenta),
    }));

  // Lista plana de todos los productos (para utilidades de exportación)
  const productosLista = categoriasLista.flatMap((cat) => cat.productos).sort((a, b) => b.totalVenta - a.totalVenta);

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
 * Genera un documento jsPDF completo en formato A4 estructurado por cuadros de categoría
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

  // Helper para salto de página automático y controlado
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 16) {
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
  doc.rect(margin, y, 3.5, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('EL GARAJE CALACALE\u00D1O', margin + 8, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text(titulo.toUpperCase(), margin + 8, y + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha/Per\u00EDodo: ${subtituloFecha || 'Fecha actual'}   |   Emisi\u00F3n: ${formatearFecha(new Date(), 'dd/MM/yyyy - hh:mm a')}`, margin + 8, y + 19.5);

  y += 28;

  // 2. TARJETAS DE RESUMEN: EFECTIVO Y TRANSFERENCIAS (SIN EL CUADRO AMARILLO DE GANANCIA NETA)
  checkPageBreak(36);

  const gap = 5;
  const cardWidth = (contentWidth - gap) / 2;
  const cardHeight = 22;

  // Tarjeta 1: Total en Efectivo
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('EFECTIVO EN CAJA', margin + 6, y + 6);

  doc.setFontSize(13.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatearDinero(metricas.totalEfectivo), margin + 6, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Monto f\u00EDsico recibido en caja', margin + 6, y + 19);

  // Tarjeta 2: Total en Transferencias
  const xCard2 = margin + cardWidth + gap;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(xCard2, y, cardWidth, cardHeight, 2, 2, 'F');
  doc.roundedRect(xCard2, y, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TRANSFERENCIAS BANCARIAS', xCard2 + 6, y + 6);

  doc.setFontSize(13.5);
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text(formatearDinero(metricas.totalTransferencia), xCard2 + 6, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Verificadas en banco y comprobantes', xCard2 + 6, y + 19);

  y += cardHeight + 4;

  // BANNER DE TOTALES GENERALES
  checkPageBreak(14);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 10.5, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 10.5, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Ventas Brutas: `, margin + 5, y + 6.8);
  doc.setFont('helvetica', 'bold');
  doc.text(formatearDinero(metricas.totalVentas), margin + 27, y + 6.8);

  doc.setFont('helvetica', 'normal');
  doc.text(`Costo Insumos: `, margin + 58, y + 6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatearDinero(metricas.totalCostoInsumos), margin + 81, y + 6.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Ganancia Neta: `, margin + 110, y + 6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatearDinero(metricas.gananciaNetaTotal), margin + 133, y + 6.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Comandas: `, margin + 155, y + 6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(`${metricas.numPedidos}`, margin + 172, y + 6.8);

  y += 16;

  // 3. UN CUADRO / TABLA POR CADA CATEGORÍA CON SUS RESPECTIVOS PRODUCTOS
  if (metricas.categoriasLista.length === 0) {
    checkPageBreak(20);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No hay pedidos registrados en el per\u00EDodo seleccionado.', margin + contentWidth / 2, y + 11, { align: 'center' });
    y += 24;
  } else {
    metricas.categoriasLista.forEach((cat, indexCat) => {
      // Estimar altura necesaria para la tabla de esta categoría
      const numProds = cat.productos.length;
      const alturaEstimada = 14 + (numProds * 6) + 7; // cabecera + filas + subtotal
      checkPageBreak(Math.min(alturaEstimada, 40));

      // 3.1 Cabecera de la Sección / Categoría
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(margin, y, contentWidth, 7, 'F');

      // Indicador de color en el borde de la categoría
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(margin, y, 2.5, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`${indexCat + 1}. ${cat.nombre.toUpperCase()}`, margin + 5, y + 4.8);

      doc.setFontSize(7.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`${cat.cantidad} unidades vendidas`, margin + contentWidth - 4, y + 4.8, { align: 'right' });

      y += 7;

      // 3.2 Encabezados de Columna de la Tabla de esta Categoría
      doc.setFillColor(51, 65, 85); // slate-700
      doc.rect(margin, y, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(226, 232, 240);

      doc.text('PRODUCTO', margin + 3, y + 3.8);
      doc.text('CANT', margin + 68, y + 3.8, { align: 'center' });
      doc.text('P. VENTA', margin + 88, y + 3.8, { align: 'right' });
      doc.text('P. COMPRA', margin + 110, y + 3.8, { align: 'right' });
      doc.text('TOTAL VENTA', margin + 135, y + 3.8, { align: 'right' });
      doc.text('COSTO TOTAL', margin + 158, y + 3.8, { align: 'right' });
      doc.text('GANANCIA NETA', margin + contentWidth - 3, y + 3.8, { align: 'right' });

      y += 5.5;

      // 3.3 Filas de productos de la categoría
      cat.productos.forEach((prod, pIdx) => {
        checkPageBreak(6.2);
        const bgRow = pIdx % 2 === 0 ? 255 : 248;
        doc.setFillColor(bgRow, bgRow, bgRow);
        doc.rect(margin, y, contentWidth, 5.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        const nombreProd = `${prod.nombre}${prod.variante ? ` (${prod.variante})` : ''}`;
        doc.text(nombreProd.substring(0, 36), margin + 3, y + 4.1);

        doc.setFont('helvetica', 'normal');
        doc.text(`${prod.cantidad}`, margin + 68, y + 4.1, { align: 'center' });

        doc.text(formatearDinero(prod.precioUnitario), margin + 88, y + 4.1, { align: 'right' });
        doc.setTextColor(120, 120, 120);
        doc.text(formatearDinero(prod.costoUnitario), margin + 110, y + 4.1, { align: 'right' });

        doc.setTextColor(30, 41, 59);
        doc.text(formatearDinero(prod.totalVenta), margin + 135, y + 4.1, { align: 'right' });

        doc.setTextColor(180, 83, 9);
        doc.text(formatearDinero(prod.totalCosto), margin + 158, y + 4.1, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(formatearDinero(prod.gananciaTotal), margin + contentWidth - 3, y + 4.1, { align: 'right' });

        y += 5.8;
      });

      // 3.4 Fila de Subtotal de esta Categoría
      checkPageBreak(6.5);
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);

      doc.text(`SUBTOTAL ${cat.nombre.toUpperCase()}`, margin + 3, y + 4.2);
      doc.text(`${cat.cantidad}`, margin + 68, y + 4.2, { align: 'center' });
      doc.text(formatearDinero(cat.totalVenta), margin + 135, y + 4.2, { align: 'right' });
      doc.setTextColor(180, 83, 9);
      doc.text(formatearDinero(cat.totalCosto), margin + 158, y + 4.2, { align: 'right' });
      doc.setTextColor(16, 185, 129);
      doc.text(formatearDinero(cat.gananciaTotal), margin + contentWidth - 3, y + 4.2, { align: 'right' });

      // Línea divisoria inferior de la caja
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      y += 10; // Espacio entre cada categoría
    });
  }

  // 4. GRAN TOTAL GENERAL
  checkPageBreak(16);
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 10.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAN TOTAL GENERAL (TODAS LAS CATEGOR\u00CDAS)', margin + 4, y + 6.8);

  const totalUnidades = metricas.categoriasLista.reduce((sum, c) => sum + c.cantidad, 0);
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(`${totalUnidades} un.`, margin + 85, y + 6.8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.text(formatearDinero(metricas.totalVentas), margin + 135, y + 6.8, { align: 'right' });

  doc.setTextColor(248, 113, 113); // red-400
  doc.text(formatearDinero(metricas.totalCostoInsumos), margin + 158, y + 6.8, { align: 'right' });

  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(formatearDinero(metricas.gananciaNetaTotal), margin + contentWidth - 3, y + 6.8, { align: 'right' });

  y += 18;

  // 5. PIE DE PÁGINA Y FIRMAS
  checkPageBreak(20);
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
    `📋 *DETALLE POR CATEGORÍAS Y PRODUCTOS:*`,
  ];

  metricas.categoriasLista.forEach((cat) => {
    lineas.push(`\n📁 *${cat.nombre.toUpperCase()}* (${cat.cantidad} un. - Venta ${formatearDinero(cat.totalVenta)}):`);
    cat.productos.forEach((prod) => {
      lineas.push(`  • ${prod.cantidad}x ${prod.nombre}${prod.variante ? ` (${prod.variante})` : ''} - Venta: ${formatearDinero(prod.totalVenta)} | Ganancia: *${formatearDinero(prod.gananciaTotal)}*`);
    });
  });

  lineas.push(`\n------------------------------------------`);
  lineas.push(`✅ *Reporte generado automáticamente por El Garaje POS*`);

  return lineas.join('\n');
};
