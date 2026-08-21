/**
 * Funciones de utilidad para el sistema POS El Garaje
 */
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

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
      const productosStr = (p.productos || [])
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

/**
 * Imprime el ticket de venta usando la función de impresión nativa del navegador
 */
export const imprimirTicket = () => {
  window.print();
};
