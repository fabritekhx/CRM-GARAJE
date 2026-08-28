/**
 * Menú oficial de "El Garaje Calacaleño"
 * Conforme a la programación semanal y pedidos.
 * 
 * - Viernes: Pescados
 * - Sábados: Fritadas y Caldos
 * - Domingos: Encebollados, Corvinas, Camarones y Combos
 * - Todos los días: Bebidas, Jugos, Cervezas y Porciones
 */

export const DIAS_ATENCION = [
  { 
    id: 'viernes', 
    nombre: 'Viernes: Pescados', 
    corto: 'Viernes', 
    subtitulo: 'Pescados fritos tradicionales ($4.00 - $6.00)',
    icono: 'Fish', 
    categoriaPrincipal: 'pescados',
    color: 'bg-cyan-500 text-slate-950 border-cyan-400'
  },
  { 
    id: 'sabado', 
    nombre: 'Sábado: Fritadas y Caldos', 
    corto: 'Sábado', 
    subtitulo: 'Fritada tradicional, Caldo de gallina y de pata ($4.00)',
    icono: 'UtensilsCrossed', 
    categoriaPrincipal: 'sabados',
    color: 'bg-amber-500 text-slate-950 border-amber-400'
  },
  { 
    id: 'domingo', 
    nombre: 'Domingo: Encebollados y Mariscos', 
    corto: 'Domingo', 
    subtitulo: 'Encebollados, Corvina, Camarón y Combos',
    icono: 'Soup', 
    categoriaPrincipal: 'domingos',
    color: 'bg-orange-500 text-slate-950 border-orange-400'
  },
  { 
    id: 'todos', 
    nombre: 'Todos los Días (Menú Completo)', 
    corto: 'Todos', 
    subtitulo: 'Ver todos los platos y bebidas disponibles',
    icono: 'Layers', 
    categoriaPrincipal: null,
    color: 'bg-slate-700 text-white border-slate-600'
  },
];

export const CATEGORIAS = [
  { id: 'pescados', nombre: 'Pescados (Viernes)', dia: 'viernes', icono: 'Fish', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'sabados', nombre: 'Fritadas y Caldos (Sábado)', dia: 'sabado', icono: 'Flame', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'domingos', nombre: 'Encebollados y Mariscos (Domingo)', dia: 'domingo', icono: 'Soup', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'jugos', nombre: 'Jugos Naturales', dia: 'todos', icono: 'Citrus', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'gaseosas', nombre: 'Gaseosas y Bebidas', dia: 'todos', icono: 'CupSoda', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'cervezas', nombre: 'Cervezas', dia: 'todos', icono: 'Beer', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  { id: 'porciones', nombre: 'Porciones Extras', dia: 'todos', icono: 'UtensilsCrossed', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
];

export const MENU = [
  // ==========================================
  // SÁBADOS: FRITADAS Y CALDOS
  // ==========================================
  {
    id: 's-caldo-gallina',
    nombre: 'Caldo de gallina',
    categoria: 'sabados',
    dia: 'sabado',
    precioBase: 4.00,
    descripcion: 'Delicioso y tradicional caldo de gallina criolla con presa',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 's-fritada',
    nombre: 'Fritada',
    categoria: 'sabados',
    dia: 'sabado',
    precioBase: 4.00,
    descripcion: 'Tradicional fritada calacaleña con mote, tostado y maduro',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 's-caldo-pata',
    nombre: 'Caldo de pata',
    categoria: 'sabados',
    dia: 'sabado',
    precioBase: 4.00,
    descripcion: 'Contundente caldo de pata con maní y mote',
    sabores: [],
    tipoVariante: null,
  },

  // ==========================================
  // DOMINGOS: ENCEBOLLADOS, MARISCOS Y COMBOS
  // ==========================================
  {
    id: 'd-encebollado-normal',
    nombre: 'Encebollado normal',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 3.00,
    descripcion: 'Encebollado tradicional de albacora tamaño normal con chifles',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-encebollado-pequeno',
    nombre: 'Encebollado pequeño',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 2.25,
    descripcion: 'Encebollado de albacora tamaño pequeño / porción media',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-encebollado-camaron',
    nombre: 'Encebollado con camarón',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 4.00,
    descripcion: 'Encebollado mixto con porción generosa de camarón',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-corvina-entera',
    nombre: 'Corvina entera',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 4.00,
    descripcion: 'Corvina fresca frita entera con arroz, patacones y curtido',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-media-corvina',
    nombre: 'Media corvina',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 2.25,
    descripcion: 'Media porción de corvina frita con guarnición',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-camaron-entero',
    nombre: 'Camarón entero',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 4.00,
    descripcion: 'Porción entera de camarones apanados / al ajillo con guarnición',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-camaron-medio',
    nombre: 'Camarón medio',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 2.25,
    descripcion: 'Media porción de camarón con guarnición',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-combo-camaron',
    nombre: 'Combo Camarón',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 4.00,
    descripcion: 'Medio de encebollado y medio de camarón con chifles y guarnición',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'd-combo-corvina',
    nombre: 'Combo Corvina',
    categoria: 'domingos',
    dia: 'domingo',
    precioBase: 4.00,
    descripcion: 'Medio encebollado y media corvina frita con guarnición',
    sabores: [],
    tipoVariante: null,
  },

  // ==========================================
  // VIERNES: PESCADOS (Valores $4, $5, $6 + Otro)
  // ==========================================
  {
    id: 'f-pargo',
    nombre: 'Pargo',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Pargo fresco frito con guarniciones tradicionales',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-tilapia-roja',
    nombre: 'Tilapia roja',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Tilapia roja frita al punto crocante',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-tilapia-negra',
    nombre: 'Tilapia negra',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Tilapia negra frita con patacones y curtido',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-cola-amarilla',
    nombre: 'Cola amarilla',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Pescado cola amarilla frito especial',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-lenguado',
    nombre: 'Lenguado',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Lenguado fresco frito calacaleño',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-picudo',
    nombre: 'Picudo',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Filete o porción de picudo fresco',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },
  {
    id: 'f-cabezudo',
    nombre: 'Cabezudo',
    categoria: 'pescados',
    dia: 'viernes',
    precioBase: 4.00,
    descripcion: 'Cabezudo frito con sabor tradicional de la casa',
    tipoVariante: 'tamano_pescado',
    tamanos: [
      { id: 'v4', nombre: '$4.00', precio: 4.00 },
      { id: 'v5', nombre: '$5.00', precio: 5.00 },
      { id: 'v6', nombre: '$6.00', precio: 6.00 },
    ],
  },

  // ==========================================
  // JUGOS NATURALES (Todos los días)
  // ==========================================
  {
    id: 'j-jarra',
    nombre: 'Jarra de jugo',
    categoria: 'jugos',
    dia: 'todos',
    precioBase: 2.00,
    descripcion: 'Jarra grande de jugo natural fresco',
    sabores: ['Mora', 'Maracuyá', 'Guanábana', 'Naranjilla', 'Tomate de Árbol', 'Taxo', 'Guanábana c/ leche'],
    tipoVariante: 'sabor',
  },
  {
    id: 'j-jarra-media',
    nombre: 'Jarra ½',
    categoria: 'jugos',
    dia: 'todos',
    precioBase: 1.25,
    descripcion: 'Media jarra (½) de jugo natural',
    sabores: ['Mora', 'Maracuyá', 'Guanábana', 'Naranjilla', 'Tomate de Árbol', 'Taxo', 'Guanábana c/ leche'],
    tipoVariante: 'sabor',
  },
  {
    id: 'j-vaso-personal',
    nombre: 'Vaso de jugo personal',
    categoria: 'jugos',
    dia: 'todos',
    precioBase: 1.25,
    descripcion: 'Vaso individual de jugo natural fresco',
    sabores: ['Mora', 'Maracuyá', 'Guanábana', 'Naranjilla', 'Tomate de Árbol', 'Taxo', 'Guanábana c/ leche'],
    tipoVariante: 'sabor',
  },

  // ==========================================
  // GASEOSAS Y BEBIDAS (Todos los días)
  // ==========================================
  {
    id: 'g-cola-personal',
    nombre: 'Cola personal',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 0.75,
    descripcion: 'Presentación individual de 300-350ml',
    sabores: ['Coca Cola', 'Fanta', 'Sprite', 'Fiora', 'Mora'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-cola-1lt',
    nombre: 'Cola de 1 litro',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 1.00,
    descripcion: 'Botella de 1 Litro',
    sabores: ['Fiora', 'Fanta', 'Sprite'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-cola-135lt',
    nombre: 'Cola de 1.35 lt',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 2.00,
    descripcion: 'Botella familiar de 1.35 Litros',
    sabores: ['Coca Cola Familiar'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-agua-cielo',
    nombre: 'Agua personal Cielo',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 0.75,
    descripcion: 'Agua purificada personal',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'g-cola-retornable',
    nombre: 'Cola retornable',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 2.50,
    descripcion: 'Envase retornable familiar',
    sabores: ['Coca Cola', 'Sprite', 'Fanta', 'Fiora Vanti'],
    tipoVariante: 'sabor',
  },
  {
    id: 'g-fuisti-1lt',
    nombre: 'Fuisti de 1 litro',
    categoria: 'gaseosas',
    dia: 'todos',
    precioBase: 1.75,
    descripcion: 'Té helado Fuisti familiar de 1L',
    sabores: ['Fuisti familiar'],
    tipoVariante: 'sabor',
  },

  // ==========================================
  // CERVEZAS (Todos los días)
  // ==========================================
  {
    id: 'c-pilsener-750',
    nombre: 'Pilsener 750 ml',
    categoria: 'cervezas',
    dia: 'todos',
    precioBase: 2.00,
    descripcion: 'Cerveza Pilsener Grande 750ml helada',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'c-cerveza-1lt',
    nombre: 'Cerveza 1 L',
    categoria: 'cervezas',
    dia: 'todos',
    precioBase: 3.00,
    descripcion: 'Cerveza de 1 Litro (1 L) helada',
    sabores: [],
    tipoVariante: null,
  },

  // ==========================================
  // PORCIONES EXTRAS (Todos los días)
  // ==========================================
  {
    id: 'p-patacones',
    nombre: 'Patacones',
    categoria: 'porciones',
    dia: 'todos',
    precioBase: 1.00,
    descripcion: 'Porción de patacones crocantes',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-yuca',
    nombre: 'Yuca',
    categoria: 'porciones',
    dia: 'todos',
    precioBase: 1.00,
    descripcion: 'Porción de yuca frita o cocinada',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-arroz',
    nombre: 'Arroz',
    categoria: 'porciones',
    dia: 'todos',
    precioBase: 1.00,
    descripcion: 'Porción de arroz blanco caliente',
    sabores: [],
    tipoVariante: null,
  },
  {
    id: 'p-curtido',
    nombre: 'Curtido',
    categoria: 'porciones',
    dia: 'todos',
    precioBase: 1.00,
    descripcion: 'Porción de curtido tradicional de cebolla y tomate',
    sabores: [],
    tipoVariante: null,
  },
];
