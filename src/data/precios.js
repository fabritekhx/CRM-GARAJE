/**
 * Gestión y persistencia de Precios de Venta para El Garaje Calacaleño.
 * Permite que cuando el usuario edite o establezca el precio de un producto,
 * este se guarde de forma permanente (fijo) en el sistema hasta que decida cambiarlo de nuevo.
 */
import { MENU } from './menu';

export const STORAGE_PRECIOS = 'el_garaje_precios_productos_v1';

/**
 * Obtiene el mapa de precios predeterminados de fábrica a partir de menu.js
 */
export const PRECIOS_PREDETERMINADOS = MENU.reduce((acc, item) => {
  acc[item.id] = Number(item.precioBase) || 0;
  return acc;
}, {});

/**
 * Obtiene el mapa completo de precios de venta activos (mezclando predeterminados con los personalizados guardados)
 */
export const obtenerPreciosProductos = () => {
  try {
    const guardados = localStorage.getItem(STORAGE_PRECIOS);
    if (!guardados) return { ...PRECIOS_PREDETERMINADOS };
    const parsed = JSON.parse(guardados);
    return { ...PRECIOS_PREDETERMINADOS, ...parsed };
  } catch {
    return { ...PRECIOS_PREDETERMINADOS };
  }
};

/**
 * Guarda los precios personalizados de venta en localStorage
 */
export const guardarPreciosProductos = (nuevosPrecios) => {
  try {
    localStorage.setItem(STORAGE_PRECIOS, JSON.stringify(nuevosPrecios));
    return true;
  } catch (e) {
    console.error('Error guardando precios de productos:', e);
    return false;
  }
};

/**
 * Actualiza el precio de venta de un producto individual y lo guarda
 */
export const actualizarPrecioProducto = (productoId, nuevoPrecio) => {
  const actuales = obtenerPreciosProductos();
  const precioNum = Math.max(0, Number(parseFloat(nuevoPrecio).toFixed(2)) || 0);
  const actualizados = {
    ...actuales,
    [productoId]: precioNum,
  };
  guardarPreciosProductos(actualizados);
  return actualizados;
};

/**
 * Restablece los precios de venta a los valores de fábrica
 */
export const restaurarPreciosPredeterminados = () => {
  try {
    localStorage.removeItem(STORAGE_PRECIOS);
    return { ...PRECIOS_PREDETERMINADOS };
  } catch {
    return { ...PRECIOS_PREDETERMINADOS };
  }
};

/**
 * Obtiene el precio de venta activo para un producto
 */
export const obtenerPrecioVentaProducto = (productoId, preciosMap = null) => {
  const mapa = preciosMap || obtenerPreciosProductos();
  if (productoId && mapa[productoId] !== undefined) {
    return Number(mapa[productoId]);
  }
  const itemMenu = MENU.find((m) => m.id === productoId);
  return itemMenu ? Number(itemMenu.precioBase) : 0;
};

/**
 * Retorna la lista del menú con los precios de venta actualizados
 */
export const obtenerMenuConPreciosActualizados = (preciosMap = null) => {
  const mapa = preciosMap || obtenerPreciosProductos();
  return MENU.map((item) => {
    const precioBase = mapa[item.id] !== undefined ? Number(mapa[item.id]) : Number(item.precioBase);
    return {
      ...item,
      precioBase,
    };
  });
};
