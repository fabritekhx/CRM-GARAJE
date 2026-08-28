/**
 * Costos base e iniciales de compra / insumo para todos los productos de El Garaje Calacaleño.
 * Estos valores representan el costo que le cuesta al restaurante comprar o elaborar cada ítem.
 * El usuario puede editar y personalizar estos costos en cualquier momento desde la sección "Costos y Ganancias".
 */

export const COSTOS_PREDETERMINADOS = {
  // Sábados: Fritadas y Caldos
  's-caldo-gallina': 1.80,     // Venta $4.00 -> Ganancia $2.20 (55.0%)
  's-fritada': 2.00,           // Venta $4.00 -> Ganancia $2.00 (50.0%)
  's-caldo-pata': 1.75,        // Venta $4.00 -> Ganancia $2.25 (56.3%)

  // Domingos: Encebollados y Mariscos
  'd-encebollado-normal': 1.30,   // Venta $3.00 -> Ganancia $1.70 (56.7%)
  'd-encebollado-pequeno': 0.95,  // Venta $2.25 -> Ganancia $1.30 (57.8%)
  'd-encebollado-camaron': 2.10,  // Venta $4.00 -> Ganancia $1.90 (47.5%)
  'd-corvina-entera': 1.90,       // Venta $4.00 -> Ganancia $2.10 (52.5%)
  'd-media-corvina': 1.10,        // Venta $2.25 -> Ganancia $1.15 (51.1%)
  'd-camaron-entero': 2.10,       // Venta $4.00 -> Ganancia $1.90 (47.5%)
  'd-camaron-medio': 1.15,        // Venta $2.25 -> Ganancia $1.10 (48.9%)
  'd-combo-camaron': 2.00,        // Venta $4.00 -> Ganancia $2.00 (50.0%)
  'd-combo-corvina': 1.95,        // Venta $4.00 -> Ganancia $2.05 (51.3%)

  // Viernes: Pescados Fritos ($4.00 a $6.00)
  'f-pargo': 2.00,
  'f-tilapia-roja': 1.90,
  'f-tilapia-negra': 1.85,
  'f-cola-amarilla': 1.90,
  'f-lenguado': 2.00,
  'f-picudo': 2.10,
  'f-cabezudo': 1.90,

  // Jugos Naturales
  'j-jarra': 0.70,             // Venta $2.00 -> Ganancia $1.30 (65.0%)
  'j-jarra-media': 0.45,       // Venta $1.25 -> Ganancia $0.80 (64.0%)
  'j-vaso-personal': 0.40,     // Venta $1.25 -> Ganancia $0.85 (68.0%)

  // Gaseosas y Bebidas (Colas)
  'g-cola-personal': 0.45,     // Venta $0.75 -> Ganancia $0.30 (40.0%)
  'g-cola-1lt': 0.65,          // Venta $1.00 -> Ganancia $0.35 (35.0%)
  'g-cola-135lt': 1.30,        // Venta $2.00 -> Ganancia $0.70 (35.0%)
  'g-agua-cielo': 0.35,        // Venta $0.75 -> Ganancia $0.40 (53.3%)
  'g-cola-retornable': 1.60,   // Venta $2.50 -> Ganancia $0.90 (36.0%)
  'g-fuisti-1lt': 1.10,        // Venta $1.75 -> Ganancia $0.65 (37.1%)

  // Cervezas
  'c-pilsener-750': 1.35,      // Venta $2.00 -> Ganancia $0.65 (32.5%)
  'c-cerveza-1lt': 2.25,       // Venta $3.00 -> Ganancia $0.75 (25.0%)

  // Porciones Extras
  'p-patacones': 0.35,         // Venta $1.00 -> Ganancia $0.65 (65.0%)
  'p-yuca': 0.30,              // Venta $1.00 -> Ganancia $0.70 (70.0%)
  'p-arroz': 0.25,             // Venta $1.00 -> Ganancia $0.75 (75.0%)
  'p-curtido': 0.30,           // Venta $1.00 -> Ganancia $0.70 (70.0%)
};

const STORAGE_COSTOS = 'el_garaje_costos_productos_v1';

/**
 * Obtiene el mapa completo de costos actualizados (mezclando predeterminados con los personalizados guardados)
 */
export const obtenerCostosProductos = () => {
  try {
    const guardados = localStorage.getItem(STORAGE_COSTOS);
    if (!guardados) return { ...COSTOS_PREDETERMINADOS };
    const parsed = JSON.parse(guardados);
    return { ...COSTOS_PREDETERMINADOS, ...parsed };
  } catch {
    return { ...COSTOS_PREDETERMINADOS };
  }
};

/**
 * Guarda los costos personalizados en localStorage
 */
export const guardarCostosProductos = (nuevosCostos) => {
  try {
    localStorage.setItem(STORAGE_COSTOS, JSON.stringify(nuevosCostos));
    return true;
  } catch (e) {
    console.error('Error guardando costos de productos:', e);
    return false;
  }
};

/**
 * Actualiza el costo de compra de un producto individual y lo guarda
 */
export const actualizarCostoProducto = (productoId, nuevoCosto) => {
  const actuales = obtenerCostosProductos();
  const costoNum = Math.max(0, Number(parseFloat(nuevoCosto).toFixed(2)) || 0);
  const actualizados = {
    ...actuales,
    [productoId]: costoNum,
  };
  guardarCostosProductos(actualizados);
  return actualizados;
};

/**
 * Restablece los costos de insumos a los valores de fábrica
 */
export const restaurarCostosPredeterminados = () => {
  try {
    localStorage.removeItem(STORAGE_COSTOS);
    return { ...COSTOS_PREDETERMINADOS };
  } catch {
    return { ...COSTOS_PREDETERMINADOS };
  }
};

/**
 * Obtiene el costo unitario estimado para un producto específico
 */
export const obtenerCostoUnitario = (productoId, precioUnitario = 0, costosMap = null) => {
  const mapa = costosMap || obtenerCostosProductos();
  
  if (productoId && mapa[productoId] !== undefined) {
    return Number(mapa[productoId]);
  }

  // Si no se encuentra ID exacto, buscar por nombre o aplicar ratio estimado (~45% del precio de venta)
  const precio = Number(precioUnitario) || 0;
  if (precio > 0) {
    return Number((precio * 0.45).toFixed(2));
  }
  return 0;
};
