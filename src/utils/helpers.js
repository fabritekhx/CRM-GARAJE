/**
 * Funciones de utilidad para el sistema POS El Garaje
 */
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Extrae la fecha en formato YYYY-MM-DD en la zona horaria local del cliente/navegador.
 * Evita desfaces de UTC (que a partir de las 19:00 en Ecuador / GMT-5 cambiaba el día a mañana).
 */
export const obtenerFechaLocal = (fecha = new Date()) => {
  if (!fecha) return '';
  let d;
  if (fecha instanceof Date) {
    d = fecha;
  } else if (typeof fecha === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    d = new Date(fecha);
  } else if (fecha?.toDate && typeof fecha.toDate === 'function') {
    d = fecha.toDate();
  } else if (fecha?.seconds) {
    d = new Date(fecha.seconds * 1000);
  } else {
    d = new Date(fecha);
  }

  if (isNaN(d.getTime())) return '';
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Obtiene el ID del día de atención (viernes, sabado, domingo) según la fecha local
 */
export const obtenerDiaSemanaId = (fecha = new Date()) => {
  let d = fecha instanceof Date ? fecha : new Date(fecha);
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, dia] = fecha.split('-').map(Number);
    d = new Date(y, m - 1, dia, 12, 0, 0);
  }
  const diaNum = d.getDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado
  if (diaNum === 5) return 'viernes';
  if (diaNum === 6) return 'sabado';
  if (diaNum === 0) return 'domingo';
  return 'viernes';
};

/**
 * Formatea un número como monto en dólares ($0.00)
 */
export const formatearDinero = (monto) => {
  const num = Number(monto) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formatea una fecha u objeto Timestamp de Firestore a texto legible
 */
export const formatearFecha = (fecha, formatoPersonalizado = "d 'de' MMMM, yyyy - hh:mm a") => {
  if (!fecha) return 'Sin fecha';
  try {
    let dateObj;
    if (fecha?.toDate && typeof fecha.toDate === 'function') {
      dateObj = fecha.toDate();
    } else if (fecha instanceof Date) {
      dateObj = fecha;
    } else if (typeof fecha === 'string') {
      dateObj = parseISO(fecha);
    } else if (typeof fecha === 'number') {
      dateObj = new Date(fecha);
    } else if (fecha?.seconds) {
      dateObj = new Date(fecha.seconds * 1000);
    } else {
      dateObj = new Date(fecha);
    }

    if (!isValid(dateObj)) return 'Fecha inválida';
    return format(dateObj, formatoPersonalizado, { locale: es });
  } catch (err) {
    console.error('Error formateando fecha:', err);
    return 'Fecha inválida';
  }
};

/**
 * Formatea solo la hora
 */
export const formatearHora = (fecha) => {
  return formatearFecha(fecha, 'hh:mm a');
};

/**
 * Formatea solo la fecha corta (DD/MM/YYYY)
 */
export const formatearFechaCorta = (fecha) => {
  return formatearFecha(fecha, 'dd/MM/yyyy');
};

/**
 * Formatea una fecha en formato "DD/MM/YYYY   día" (Ej: 27/08/2026   jueves)
 */
export const formatearFechaConDiaSemana = (fecha) => {
  if (!fecha) return '';
  const str = typeof fecha === 'string' && fecha.length === 10 ? `${fecha}T12:00:00` : fecha;
  const fechaCorta = formatearFecha(str, 'dd/MM/yyyy');
  const diaSemana = formatearFecha(str, 'EEEE');
  return `${fechaCorta}   ${diaSemana}`;
};

/**
 * Formatea una fecha a formato amigable completo en español (Ej: Miércoles, 26 de agosto de 2026)
 */
export const formatearDiaLegible = (fecha) => {
  if (!fecha) return '';
  // Si viene en formato YYYY-MM-DD, parsear con T12:00:00 para evitar desfaces por zona horaria UTC
  const str = typeof fecha === 'string' && fecha.length === 10 ? `${fecha}T12:00:00` : fecha;
  return formatearFecha(str, "EEEE, d 'de' MMMM 'de' yyyy");
};

/**
 * Exporta un array de objetos a un archivo JSON
 */
export const exportarAJSON = (datos, nombreArchivo = 'el_garaje_reporte.json') => {
  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', nombreArchivo);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (error) {
    console.error('Error exportando a JSON:', error);
    return false;
  }
};

/**
 * Exporta un array de pedidos o datos a un archivo CSV estructurado
 */
export const exportarACSV = (datos, nombreArchivo = 'el_garaje_ventas.csv') => {
  try {
    if (!datos || !datos.length) return false;

    // Encabezados de CSV
    const headers = [
      'ID Pedido',
      'Orden #',
      'Mesa',
      'Fecha y Hora',
      'Total ($)',
      'Metodo de Pago',
      'Productos y Cantidades',
      'Estado'
    ];

    const rows = datos.map((p) => {
      const fechaStr = formatearFecha(p.fecha || p.createdAt, 'yyyy-MM-dd HH:mm:ss');
      const prods = Array.isArray(p?.productos) ? p.productos : [];
      const productosStr = prods
        .map((prod) => `${prod.cantidad}x ${prod.nombre} (${prod.variante || 'Normal'})`)
        .join(' | ');

      return [
        `"${p.id || ''}"`,
        p.numeroOrden || '',
        `"Mesa ${p.mesa || ''}"`,
        `"${fechaStr}"`,
        (p.total || 0).toFixed(2),
        `"${p.metodoPago || 'efectivo'}"`,
        `"${productosStr.replace(/"/g, '""')}"`,
        `"${p.estado || 'pagado'}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    return false;
  }
};

import jsPDF from 'jspdf';

/**
 * Crea el documento jsPDF vectorial para el ticket térmico (80mm)
 * Sin dependencias de renderizado HTML/CSS ni errores de color oklch.
 */
export const crearDocumentoPDFTicket = (pedido) => {
  if (!pedido) return null;

  const productos = pedido.productos || [];
  
  // Calcular altura dinámica estimada
  let alturaCalculada = 95;
  alturaCalculada += productos.length * 8;
  if (pedido.notas) alturaCalculada += 12;
  if (pedido.metodoPago === 'mixto' || pedido.metodoPago === 'dividido') alturaCalculada += 20;
  if (pedido.banco || pedido.comprobante) alturaCalculada += 10;

  const ancho = 80; // 80mm ancho estándar
  const alto = Math.max(115, Math.ceil(alturaCalculada));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [ancho, alto],
  });

  const margen = 5;
  const anchoContenido = ancho - margen * 2; // 70mm
  let y = 7;

  // Cabecera
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('EL GARAJE CALACALE\u00D1O', ancho / 2, y, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Comida tradicional del Ecuador', ancho / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('RUC: 1710793256001 \u2022 Calacal\u00ED, Ecuador', ancho / 2, y, { align: 'center' });
  y += 4;

  // Línea punteada
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  doc.line(margen, y, ancho - margen, y);
  y += 4;

  // Datos de la comanda / mesa
  doc.setFontSize(8.5);
  const esDomicilio = String(pedido.mesa).toLowerCase().includes('dom');
  const atendidoTexto = esDomicilio ? `DOMICILIO: ${pedido.mesa}` : `MESA: ${pedido.mesa}`;
  
  doc.setFont('helvetica', 'bold');
  doc.text(atendidoTexto, margen, y);
  doc.text(`ORDEN #${pedido.numeroOrden || '---'}`, ancho - margen, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const fechaStr = formatearFecha(pedido.fecha, 'dd/MM/yyyy');
  const horaStr = formatearFecha(pedido.fecha, 'hh:mm a');
  doc.text(`Fecha: ${fechaStr}`, margen, y);
  doc.text(`Hora: ${horaStr}`, ancho - margen, y, { align: 'right' });
  y += 4;

  if (pedido.notas) {
    doc.setFontSize(7);
    const lineasNotas = doc.splitTextToSize(`Nota: ${pedido.notas}`, anchoContenido);
    doc.text(lineasNotas, margen, y);
    y += lineasNotas.length * 3.2 + 1;
    doc.setFontSize(7.5);
  }

  // Línea separadora
  doc.line(margen, y, ancho - margen, y);
  y += 4;

  // Encabezados de productos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CANT', margen, y);
  doc.text('DESCRIPCI\u00D3N', margen + 10, y);
  doc.text('TOTAL', ancho - margen, y, { align: 'right' });
  y += 3.5;

  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.2);
  doc.line(margen, y - 0.5, ancho - margen, y - 0.5);
  y += 1;

  // Lista de Productos
  productos.forEach((item) => {
    const cant = item.cantidad || 1;
    const precio = Number(item.precioUnitario) || 0;
    const totalItem = cant * precio;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${cant}x`, margen, y);

    doc.setFont('helvetica', 'normal');
    let desc = item.nombre || '';
    if (item.variante) desc += ` (${item.variante})`;
    const lineasDesc = doc.splitTextToSize(desc, 44);
    doc.text(lineasDesc, margen + 10, y);

    doc.setFont('helvetica', 'bold');
    doc.text(formatearDinero(totalItem), ancho - margen, y, { align: 'right' });

    const alturaItem = Math.max(lineasDesc.length * 3.2, 4);
    y += alturaItem;

    if (item.notas) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.text(`* ${item.notas}`, margen + 10, y);
      y += 2.8;
      doc.setFontSize(7.5);
    }
  });

  // Línea de totales
  y += 1;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margen, y, ancho - margen, y);
  y += 4.5;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TOTAL A PAGAR:', margen, y);
  doc.text(formatearDinero(pedido.total), ancho - margen, y, { align: 'right' });
  y += 4.5;

  // Método de pago
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const metodoPagoStr =
    pedido.metodoPago === 'mixto'
      ? 'Pago Combinado (Mixto)'
      : pedido.metodoPago === 'dividido'
      ? 'Cuentas Separadas'
      : (pedido.metodoPago ? pedido.metodoPago.toUpperCase() : 'EFECTIVO');

  doc.text(`M\u00E9todo de pago: ${metodoPagoStr}`, margen, y);
  y += 3.5;

  if (pedido.metodoPago === 'efectivo') {
    if (pedido.montoRecibido > 0) {
      doc.text(`Recibido: ${formatearDinero(pedido.montoRecibido)}`, margen, y);
      doc.text(`Cambio: ${formatearDinero(pedido.cambio || 0)}`, ancho - margen, y, { align: 'right' });
      y += 3.5;
    }
  } else if (pedido.metodoPago === 'transferencia') {
    if (pedido.banco) {
      doc.text(`Banco: ${pedido.banco}`, margen, y);
      y += 3.5;
    }
    if (pedido.comprobante) {
      doc.text(`Ref/Comprobante: ${pedido.comprobante}`, margen, y);
      y += 3.5;
    }
  } else if (pedido.metodoPago === 'mixto') {
    doc.text(`\u2022 Transf (${pedido.banco || 'DeUna'}): ${formatearDinero(pedido.montoTransferencia)}`, margen, y);
    y += 3.5;
    doc.text(`\u2022 Efectivo: ${formatearDinero(pedido.montoEfectivo)}`, margen, y);
    y += 3.5;
    if (pedido.cambio > 0) {
      doc.text(`\u2022 Vuelto: ${formatearDinero(pedido.cambio)}`, margen, y);
      y += 3.5;
    }
  }

  // Pie de comprobante
  y += 2;
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margen, y, ancho - margen, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('\u00A1GRACIAS POR SU PREFERENCIA!', ancho / 2, y, { align: 'center' });
  y += 3.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Esperamos verle pronto en El Garaje Calacale\u00F1o', ancho / 2, y, { align: 'center' });
  y += 2.8;
  doc.text('Sistema El Garaje Calacale\u00F1o POS', ancho / 2, y, { align: 'center' });

  return doc;
};

/**
 * Imprime el ticket de venta con máxima compatibilidad (móvil, iframe de vista previa, ventana emergente y CSS print).
 * Garantiza texto nítido, sin fondos negros ni páginas en blanco.
 */
export const imprimirTicket = (elementoId = 'ticket-termico') => {
  try {
    const elemento = document.getElementById(elementoId);
    
    // Método 1: Apertura de ventana dedicada de impresión limpia
    // Esto asegura que en cualquier navegador, iframe o webview móvil se abra la orden limpia en blanco
    if (elemento) {
      const ticketHtml = elemento.innerHTML;
      const printWindow = window.open('', '_blank', 'width=380,height=600,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
      
      if (printWindow && printWindow.document) {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="utf-8">
              <title>Comprobante El Garaje Calacaleño</title>
              <style>
                @page {
                  margin: 0;
                  size: 80mm auto;
                }
                * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  font-family: monospace, 'Courier New', Courier, sans-serif;
                  font-size: 12px;
                  color: #000000 !important;
                  background-color: #ffffff !important;
                  padding: 12px 8px;
                  width: 100%;
                  max-width: 80mm;
                  margin: 0 auto;
                }
                img {
                  max-height: 48px;
                  width: auto;
                  display: block;
                  margin: 0 auto 6px auto;
                  filter: grayscale(100%) contrast(150%);
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .font-black { font-weight: 900; }
                .border-b { border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 8px; }
                .border-t { border-top: 1px dashed #444; padding-top: 6px; margin-top: 6px; }
                .grid-item { display: flex; justify-content: space-between; margin-bottom: 4px; }
                .grid-cols-12 { display: flex; width: 100%; justify-content: space-between; margin-bottom: 4px; }
                .col-span-2 { width: 15%; font-weight: bold; }
                .col-span-7 { width: 60%; }
                .col-span-3 { width: 25%; text-align: right; font-weight: bold; }
                .space-y-1 > * + * { margin-top: 4px; }
                .space-y-1\\.5 > * + * { margin-top: 6px; }
                .space-y-3 > * + * { margin-top: 10px; }
                .bg-white { background-color: #ffffff !important; }
                .text-black { color: #000000 !important; }
                .text-neutral-900 { color: #171717 !important; }
                .text-neutral-700 { color: #404040 !important; }
                .text-neutral-600 { color: #525252 !important; }
                .text-neutral-800 { color: #262626 !important; }
                .bg-neutral-100, .bg-neutral-50 { background-color: #f5f5f5 !important; border: 1px solid #ddd; }
              </style>
            </head>
            <body>
              <div id="print-area">
                ${ticketHtml}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 200);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    }

    // Método 2 (Fallback si popup está bloqueado): Iframe oculto
    const iframeId = 'print-iframe-pos';
    let iframe = document.getElementById(iframeId);
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc && elemento) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Comprobante El Garaje Calacaleño</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: monospace, 'Courier New', Courier, sans-serif;
                font-size: 12px;
                color: #000000 !important;
                background-color: #ffffff !important;
                padding: 10px;
                width: 100%;
                max-width: 80mm;
                margin: 0 auto;
              }
              img { max-height: 48px; width: auto; display: block; margin: 0 auto 6px auto; filter: grayscale(100%); }
            </style>
          </head>
          <body>
            ${elemento.innerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 200);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
      return;
    }

    // Método 3 (Fallback directo): window.print()
    window.print();
  } catch (error) {
    console.error('Error al imprimir comprobante:', error);
    window.print();
  }
};

/**
 * Genera y descarga el comprobante en formato PDF nítido (80mm)
 */
export const descargarTicketPDF = async (pedido) => {
  try {
    const pdf = crearDocumentoPDFTicket(pedido);
    if (!pdf) {
      alert('No se pudo generar el comprobante');
      return false;
    }

    const ordenNum = pedido?.numeroOrden || 'POS';
    const mesaTexto = pedido?.mesa ? `_${pedido.mesa.toString().replace(/\s+/g, '_')}` : '';
    const nombreArchivo = `Comprobante_ElGaraje_Orden_${ordenNum}${mesaTexto}.pdf`;

    pdf.save(nombreArchivo);
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Hubo un error al generar el PDF del comprobante.');
    return false;
  }
};

/**
 * Genera el texto formateado del comprobante para WhatsApp
 */
export const generarTextoTicketWhatsApp = (pedido) => {
  if (!pedido) return '';

  const fechaStr = formatearFecha(pedido.fecha, 'dd/MM/yyyy hh:mm a');
  const esDomicilio = String(pedido.mesa).toLowerCase().includes('dom');
  const atendidoEn = esDomicilio ? '🛵 A Domicilio' : `🍽️ Mesa ${pedido.mesa}`;

  let texto = `*EL GARAJE CALACALEÑO*\n`;
  texto += `_Comida tradicional del Ecuador_\n`;
  texto += `RUC: 1710793256001 • Calacalí\n`;
  texto += `--------------------------------\n`;
  texto += `📄 *Orden #${pedido.numeroOrden || '---'}*\n`;
  texto += `📍 *Atención:* ${atendidoEn}\n`;
  texto += `📅 *Fecha:* ${fechaStr}\n`;
  if (pedido.notas) {
    texto += `📝 *Nota/Ref:* ${pedido.notas}\n`;
  }
  texto += `--------------------------------\n`;
  texto += `*DETALLE DEL CONSUMO:*\n`;

  const itemsDetalle = Array.isArray(pedido?.productos) ? pedido.productos : [];
  itemsDetalle.forEach((item) => {
    const subtotal = (Number(item.precioUnitario) || 0) * (Number(item.cantidad) || 1);
    const varianteStr = item.variante ? ` (${item.variante})` : '';
    texto += `• ${item.cantidad}x ${item.nombre}${varianteStr} ➔ *${formatearDinero(subtotal)}*\n`;
    if (item.notas) {
      texto += `  _Nota: ${item.notas}_\n`;
    }
  });

  texto += `--------------------------------\n`;
  texto += `💰 *TOTAL A PAGAR: ${formatearDinero(pedido.total)}*\n`;
  texto += `💳 *Método de pago:* ${pedido.metodoPago ? pedido.metodoPago.toUpperCase() : 'EFECTIVO'}\n`;
  if (pedido.banco) texto += `🏦 *Banco:* ${pedido.banco}\n`;
  if (pedido.comprobante) texto += `🔢 *Comprobante:* ${pedido.comprobante}\n`;
  if (pedido.montoRecibido > 0) {
    texto += `💵 *Recibido:* ${formatearDinero(pedido.montoRecibido)}\n`;
    texto += `🪙 *Cambio / Vuelto:* ${formatearDinero(pedido.cambio || 0)}\n`;
  }
  texto += `--------------------------------\n`;
  texto += `_¡Muchas gracias por su preferencia!_ 🍗🐟🍲`;

  return texto;
};

/**
 * Comparte el comprobante ya sea como archivo PDF nativo o vía WhatsApp
 */
export const compartirTicket = async (pedido) => {
  try {
    const pdf = crearDocumentoPDFTicket(pedido);
    
    // Si el navegador soporta compartir archivos nativos (móviles Android/iOS)
    if (navigator.canShare && pdf) {
      try {
        const pdfBlob = pdf.output('blob');
        const ordenNum = pedido?.numeroOrden || 'POS';
        const file = new File([pdfBlob], `Comprobante_ElGaraje_Orden_${ordenNum}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Comprobante Orden #${ordenNum} - El Garaje`,
            text: `Comprobante de consumo en El Garaje Calacaleño - Total: ${formatearDinero(pedido.total)}`,
            files: [file],
          });
          return true;
        }
      } catch (shareErr) {
        console.log('Error o cancelación de compartir archivo nativo, usando WhatsApp/descarga:', shareErr);
      }
    }

    // Fallback: Abrir WhatsApp con el comprobante detallado
    const textoMensaje = encodeURIComponent(generarTextoTicketWhatsApp(pedido));
    const urlWhatsApp = `https://api.whatsapp.com/send?text=${textoMensaje}`;
    window.open(urlWhatsApp, '_blank');
    return true;
  } catch (error) {
    console.error('Error al compartir comprobante:', error);
    return false;
  }
};

/**
 * Sanitiza la lista de mesas para asegurar integridad absoluta:
 * 1. Limpia mesas con pedidos ya cobrados en el historial (evita pedidos zombies).
 * 2. Purga pedidos activos de jornadas anteriores que hayan quedado huérfanos.
 * 3. Garantiza que mesas sin productos reales figuren como libres sin comanda.
 * 4. Elimina cuadros de domicilio temporales que ya no tienen pedido activo.
 */
export const sanitizarMesasActivas = (mesas = [], pedidosPagados = []) => {
  if (!Array.isArray(mesas)) return [];

  const hoyStr = obtenerFechaLocal();
  const idsPedidosPagados = new Set(
    (pedidosPagados || [])
      .filter((p) => p && (p.estado === 'pagado' || p.estado === 'cobrado'))
      .map((p) => String(p.id))
  );

  const limpias = mesas
    .filter((m) => {
      if (!m) return false;
      const esDomicilio = m.tipo === 'domicilio';
      if (esDomicilio) {
        // Un domicilio sin pedido o con 0 productos no debe existir como mesa ocupada
        if (!m.pedidoActual || !Array.isArray(m.pedidoActual.productos) || m.pedidoActual.productos.length === 0) {
          return false;
        }
        // Si el pedido del domicilio ya fue pagado en el historial, descartar el cuadro
        if (idsPedidosPagados.has(String(m.pedidoActual.id))) {
          return false;
        }
        // Si el pedido del domicilio es de una jornada anterior, descartar
        const fechaPedido = m.pedidoActual.fecha ? obtenerFechaLocal(m.pedidoActual.fecha) : '';
        if (fechaPedido && fechaPedido !== hoyStr) {
          return false;
        }
      }
      return true;
    })
    .map((m) => {
      if (!m.pedidoActual || !Array.isArray(m.pedidoActual.productos) || m.pedidoActual.productos.length === 0) {
        return { ...m, estado: 'libre', pedidoActual: null };
      }

      // Si el pedido de la mesa ya fue cobrado en el historial, la mesa debe estar libre
      if (idsPedidosPagados.has(String(m.pedidoActual.id))) {
        return { ...m, estado: 'libre', pedidoActual: null };
      }

      // Si el pedido activo de la mesa pertenece a una fecha anterior (sesión pasada no cerrada)
      const fechaPedido = m.pedidoActual.fecha ? obtenerFechaLocal(m.pedidoActual.fecha) : '';
      if (fechaPedido && fechaPedido !== hoyStr) {
        return { ...m, estado: 'libre', pedidoActual: null };
      }

      return m;
    });

  // Normalización estricta de números de orden de mesas activas hoy (evita saltos y huecos como 11 y 13)
  const ordenesHistorialHoy = (pedidosPagados || [])
    .filter((p) => {
      if (!p || p.estado === 'cancelado' || p.estado === 'config' || String(p.id).startsWith('SYS_')) return false;
      const f = obtenerFechaLocal(p.fecha);
      return f === hoyStr;
    })
    .map((p) => Number(p.numeroOrden !== undefined ? p.numeroOrden : p.numero_orden))
    .filter((n) => !isNaN(n) && n > 0);

  const maxPagadoHoy = ordenesHistorialHoy.length > 0 ? Math.max(...ordenesHistorialHoy) : 0;

  // Filtrar mesas que realmente tienen productos en curso hoy y ordenarlas cronológicamente
  const activasConProductos = limpias
    .filter((m) => m && m.estado === 'ocupada' && m.pedidoActual && Array.isArray(m.pedidoActual.productos) && m.pedidoActual.productos.length > 0)
    .sort((a, b) => {
      const fechaA = new Date(a.pedidoActual?.fecha || 0).getTime() || (a.updatedAt || 0);
      const fechaB = new Date(b.pedidoActual?.fecha || 0).getTime() || (b.updatedAt || 0);
      return fechaA - fechaB;
    });

  // Mapa de identificador a número correlativo sin saltos
  const mapaNumeroOrden = new Map();
  activasConProductos.forEach((m, idx) => {
    const key = String(m.id || m.numero);
    mapaNumeroOrden.set(key, maxPagadoHoy + idx + 1);
  });

  return limpias.map((m) => {
    if (!m || m.estado !== 'ocupada' || !m.pedidoActual) return m;
    const key = String(m.id || m.numero);
    if (mapaNumeroOrden.has(key)) {
      const numCorregido = mapaNumeroOrden.get(key);
      if (m.pedidoActual.numeroOrden !== numCorregido) {
        return {
          ...m,
          pedidoActual: {
            ...m.pedidoActual,
            numeroOrden: numCorregido,
          },
        };
      }
    }
    return m;
  });
};

/**
 * Fusiona inteligentemente dos conjuntos de mesas (locales y remotas)
 * para evitar sobrescrituras destructivas y resolver concurrencia multi-dispositivo.
 */
export const fusionarMesasInteligente = (locales = [], remotas = [], pedidosPagados = []) => {
  if (!Array.isArray(remotas) || remotas.length === 0) return sanitizarMesasActivas(locales || [], pedidosPagados);
  if (!Array.isArray(locales) || locales.length === 0) return sanitizarMesasActivas(remotas || [], pedidosPagados);

  const mapa = new Map();

  // 1. Añadir todas las mesas remotas primero
  remotas.forEach((m) => {
    if (!m) return;
    const key = String(m.id || m.numero);
    mapa.set(key, { ...m });
  });

  // 2. Evaluar y fusionar con mesas locales
  locales.forEach((localMesa) => {
    if (!localMesa) return;
    const key = String(localMesa.id || localMesa.numero);
    const remotaMesa = mapa.get(key);

    if (!remotaMesa) {
      // Mesa creada localmente (ej. domicilio agregado), conservarla
      mapa.set(key, { ...localMesa });
      return;
    }

    const localTienePedido = Boolean(
      localMesa.pedidoActual &&
      Array.isArray(localMesa.pedidoActual.productos) &&
      localMesa.pedidoActual.productos.length > 0
    );

    const remotaTienePedido = Boolean(
      remotaMesa.pedidoActual &&
      Array.isArray(remotaMesa.pedidoActual.productos) &&
      remotaMesa.pedidoActual.productos.length > 0
    );

    const localTimestamp = Number(localMesa.updatedAt) || 0;
    const remotaTimestamp = Number(remotaMesa.updatedAt) || 0;

    // Regla 1: Si la local tiene pedido activo y la remota está vacía (posible nuevo cliente/dispositivo con estado vacío)
    if (localTienePedido && !remotaTienePedido) {
      if (remotaTimestamp > localTimestamp) {
        mapa.set(key, { ...remotaMesa });
      } else {
        mapa.set(key, { ...localMesa });
      }
      return;
    }

    // Regla 2: Si la remota tiene pedido activo y la local está vacía (ej. comanda cancelada/vaciada localmente o abriendo en móvil)
    if (!localTienePedido && remotaTienePedido) {
      if (localTimestamp > remotaTimestamp) {
        mapa.set(key, { ...localMesa });
      } else {
        mapa.set(key, { ...remotaMesa });
      }
      return;
    }

    // Regla 3: Si ambas tienen pedido activo, gana la que tenga el timestamp de modificación más reciente
    if (localTienePedido && remotaTienePedido) {
      if (localTimestamp > remotaTimestamp) {
        mapa.set(key, { ...localMesa });
      } else {
        mapa.set(key, { ...remotaMesa });
      }
      return;
    }

    // Regla 4: Ambas están libres/vacías
    mapa.set(key, localTimestamp > remotaTimestamp ? { ...localMesa } : { ...remotaMesa });
  });

  const resultadoBruto = Array.from(mapa.values());
  return sanitizarMesasActivas(resultadoBruto, pedidosPagados);
};

/**
 * Calcula el número de orden consecutivo más alto usado en el día especificado.
 * Si no hay órdenes hoy, retorna 0 (para que la siguiente comanda empiece en 1).
 * Reutiliza automáticamente el consecutivo si la última orden se canceló o eliminó.
 */
export const calcularUltimoNumeroOrdenDelDia = (fechaStr, listaPedidos = [], listaMesas = []) => {
  const hoyStr = fechaStr ? obtenerFechaLocal(fechaStr) : obtenerFechaLocal();

  // 1. Números de pedidos ya cobrados hoy en el historial
  const ordenesHistorialHoy = (listaPedidos || [])
    .filter((p) => {
      if (!p || p.estado === 'cancelado' || p.estado === 'config' || String(p.id).startsWith('SYS_')) return false;
      const f = obtenerFechaLocal(p.fecha);
      return f === hoyStr;
    })
    .map((p) => Number(p.numeroOrden !== undefined ? p.numeroOrden : p.numero_orden))
    .filter((n) => !isNaN(n) && n > 0);

  // 2. Números de pedidos actualmente activos en mesas hoy (que tengan productos cargados)
  const ordenesMesasActivasHoy = (listaMesas || [])
    .filter((m) => {
      if (!m || !m.pedidoActual || !m.pedidoActual.numeroOrden) return false;
      // Una mesa sin productos no consume consecutivo para evitar saltos si solo se abrió por error
      if (!Array.isArray(m.pedidoActual.productos) || m.pedidoActual.productos.length === 0) return false;
      const f = m.pedidoActual.fecha ? obtenerFechaLocal(m.pedidoActual.fecha) : '';
      return f === hoyStr || !f;
    })
    .map((m) => Number(m.pedidoActual.numeroOrden))
    .filter((n) => !isNaN(n) && n > 0);

  const todos = [...ordenesHistorialHoy, ...ordenesMesasActivasHoy];
  return todos.length > 0 ? Math.max(...todos) : 0;
};

