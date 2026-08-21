/**
 * Menú oficial de "El Garaje"
 * Conforme a las especificaciones exactas solicitadas.
 */

export const CATEGORIAS = [
  { id: 'pescados', nombre: 'Pescados', icono: 'Fish', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'gaseosas', nombre: 'Gaseosas', icono: 'CupSoda', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'cervezas', nombre: 'Cervezas', icono: 'Beer', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { id: 'porciones', nombre: 'Porciones Extras', icono: 'UtensilsCrossed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
];

export const MENU = [
  // GASEOSAS
  {
    id: 'g-cola-personal',
    nombre: 'Cola personal',
    categoria: 'gaseosas',
    precioBase: 0.75,
    descripcion: 'Presentación individual de 300-350ml',
    sabores: ['Coca Cola', 'Fanta', 'Sprite', 'Fiora', 'Mora'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-cola-1lt',
    nombre: 'Cola de 1 litro',
    categoria: 'gaseosas',
    precioBase: 1.00,
    descripcion: 'Botella de 1 Litro',
    sabores: ['Fiora', 'Fanta', 'Sprite'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-cola-135lt',
    nombre: 'Cola de 1.35 lt',
    categoria: 'gaseosas',
    precioBase: 2.00,
    descripcion: 'Botella de 1.35 Litros',
    sabores: ['Coca Cola Familiar'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-agua-cielo',
    nombre: 'Agua personal Cielo',
    categoria: 'gaseosas',
    precioBase: 0.75,
    descripcion: 'Agua purificada personal',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'g-cola-retornable',
    nombre: 'Cola retornable',
    categoria: 'gaseosas',
    precioBase: 2.50,
    descripcion: 'Envase retornable familiar',
    sabores: ['Coca Cola', 'Sprite', 'Fanta', 'Fiora Vanti'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-fuisti-1lt',
    nombre: 'Fuisti de 1 litro',
    categoria: 'gaseosas',
    precioBase: 1.75,
    descripcion: 'Té helado Fuisti familiar',
    sabores: ['Fuisti familiar'],
    tipoVariante: 'sabor',
  },

  // CERVEZAS
  {
    id: 'c-pilsener-750',
    nombre: 'Pilsener 750 ml',
    categoria: 'cervezas',
    precioBase: 2.00,
    descripcion: 'Cerveza Pilsener Grande 750ml',
    sabores: [],
    tipoVariante: null,
  },

  // PORCIONES EXTRAS
  {
    id: 'p-patacones',
    nombre: 'Patacones',
    categoria: 'porciones',
    precioBase: 1.00,
    descripcion: 'Porción de patacones crocantes',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-yuca',
    nombre: 'Yuca',
    categoria: 'porciones',
    precioBase: 1.00,
    descripcion: 'Porción de yuca frita o cocinada',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-arroz',
    nombre: 'Arroz',
    categoria: 'porciones',
    precioBase: 1.00,
    descripcion: 'Porción de arroz blanco',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-curtido',
    nombre: 'Curtido',
    categoria: 'porciones',
    precioBase: 1.00,
    descripcion: 'Porción de curtido tradicional de cebolla y tomate',
    sabores: [],
    tipoVariante: null,
  },

  // PESCADOS
  // Para los pescados, al seleccionar el tipo se debe elegir tamaño/precio:
  // 4 = pequeño, 5 = mediano, 6 = grande.
  {
    id: 'f-pargo',
    nombre: 'Pargo',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Pargo fresco frito con guarniciones',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-tilapia-roja',
    nombre: 'Tilapia roja',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Tilapia roja frita al punto',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-tilapia-negra',
    nombre: 'Tilapia negra',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Tilapia negra frita crocante',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-cola-amarilla',
    nombre: 'Cola amarilla',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Pescado cola amarilla frito especial',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-lenguado',
    nombre: 'Lenguado',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Lenguado fresco frito',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-picudo',
    nombre: 'Picudo',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Filete o porción de picudo fresco',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
  {
    id: 'f-cabezudo',
    nombre: 'Cabezudo',
    categoria: 'pescados',
    precioBase: 4.00,
    descripcion: 'Cabezudo frito con sabor tradicional',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'pequeno', nombre: 'Pequeño', precio: 4.00 },
      { id: 'mediano', nombre: 'Mediano', precio: 5.00 },
      { id: 'grande', nombre: 'Grande', precio: 6.00 },
    ],
  },
];
