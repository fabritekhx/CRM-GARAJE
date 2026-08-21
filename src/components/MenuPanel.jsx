import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Fish, 
  CupSoda, 
  Beer, 
  UtensilsCrossed, 
  Plus, 
  Check, 
  Sparkles,
  X,
  Layers
} from 'lucide-react';
import { CATEGORIAS, MENU } from '../data/menu';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero } from '../utils/helpers';

export default function MenuPanel() {
  const { agregarProductoAPedido, mesaSeleccionada } = usePedidos();
  
  const [categoriaActiva, setCategoriaActiva] = useState('pescados');
  const [busqueda, setBusqueda] = useState('');
  
  // Estado para el modal de selección de variante (Sabor o Tamaño de Pescado)
  const [productoParaVariante, setProductoParaVariante] = useState(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState('');
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
  const [notasVariante, setNotasVariante] = useState('');

  // Filtrado de productos por categoría y búsqueda
  const productosFiltrados = useMemo(() => {
    return MENU.filter((item) => {
      const coincideBusqueda = 
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.sabores && item.sabores.some(s => s.toLowerCase().includes(busqueda.toLowerCase())));

      if (busqueda.trim() !== '') {
        return coincideBusqueda;
      }
      return item.categoria === categoriaActiva;
    });
  }, [categoriaActiva, busqueda]);

  // Al hacer clic en un producto
  const handleSeleccionarProducto = (prod) => {
    if (!mesaSeleccionada) return;

    if (prod.tipoVariante === 'tamano_pescado') {
      // Abrir modal para elegir tamaño: pequeño (4), mediano (5), grande (6)
      setProductoParaVariante(prod);
      setVarianteSeleccionada(prod.tamanos[1].nombre); // Default mediano
      setPrecioSeleccionado(prod.tamanos[1].precio);
      setNotasVariante('');
    } else if (prod.tipoVariante === 'sabor' && prod.sabores.length > 0) {
      if (prod.sabores.length === 1) {
        // Solo un sabor definido (ej. Coca Cola Familiar o Fuisti familiar)
        agregarProductoAPedido(prod, prod.sabores[0], prod.precioBase);
      } else {
        // Múltiples sabores disponibles (ej. Coca Cola, Sprite, Fanta, Fiora, Mora)
        setProductoParaVariante(prod);
        setVarianteSeleccionada(prod.sabores[0]);
        setPrecioSeleccionado(prod.precioBase);
        setNotasVariante('');
      }
    } else {
      // Producto sin variante (ej. Cerveza Pilsener, Porciones Extras, Agua Cielo)
      agregarProductoAPedido(prod, null, prod.precioBase);
    }
  };

  // Confirmar la variante seleccionada
  const handleConfirmarVariante = () => {
    if (!productoParaVariante) return;
    agregarProductoAPedido(
      productoParaVariante,
      varianteSeleccionada,
      precioSeleccionado,
      notasVariante
    );
    setProductoParaVariante(null);
  };

  const getCategoriaIcon = (id) => {
    switch (id) {
      case 'pescados': return <Fish className="w-4 h-4" />;
      case 'gaseosas': return <CupSoda className="w-4 h-4" />;
      case 'cervezas': return <Beer className="w-4 h-4" />;
      case 'porciones': return <UtensilsCrossed className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
      
      {/* Barra superior de categorías y búsqueda */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
        
        {/* Buscador Rápido */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el menú (ej. Tilapia, Coca Cola, Patacones)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pestañas de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIAS.map((cat) => {
            const esActiva = categoriaActiva === cat.id && !busqueda;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoriaActiva(cat.id);
                  setBusqueda('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                  esActiva
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {getCategoriaIcon(cat.id)}
                <span>{cat.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px]">
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productosFiltrados.map((prod) => {
              const tieneVariante = prod.tipoVariante !== null;
              
              return (
                <button
                  key={prod.id}
                  onClick={() => handleSeleccionarProducto(prod)}
                  className="group relative flex flex-col justify-between text-left p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-amber-500/60 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {prod.nombre}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {prod.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-auto">
                    <div>
                      {prod.tipoVariante === 'tamano_pescado' ? (
                        <span className="text-xs font-extrabold text-amber-400 font-mono">
                          $4.00 - $6.00
                        </span>
                      ) : (
                        <span className="text-sm font-extrabold text-amber-400 font-mono">
                          {formatearDinero(prod.precioBase)}
                        </span>
                      )}
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Search className="w-8 h-8 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">No se encontraron productos</p>
            <p className="text-xs">Intenta con otro término o selecciona una categoría.</p>
          </div>
        )}
      </div>

      {/* MODAL DE SELECCIÓN DE VARIANTE (Tamaño de pescado o Sabores) */}
      {productoParaVariante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  {productoParaVariante.categoria === 'pescados' ? 'Seleccionar Tamaño' : 'Seleccionar Sabor'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {productoParaVariante.nombre}
                </h3>
              </div>
              <button
                onClick={() => setProductoParaVariante(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones de Pescado (Tamaño: Pequeño $4, Mediano $5, Grande $6) */}
            {productoParaVariante.tipoVariante === 'tamano_pescado' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Tamaño de pescado preparado:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {productoParaVariante.tamanos.map((tam) => {
                    const seleccionado = precioSeleccionado === tam.precio && varianteSeleccionada === tam.nombre;
                    return (
                      <button
                        key={tam.id}
                        type="button"
                        onClick={() => {
                          setVarianteSeleccionada(tam.nombre);
                          setPrecioSeleccionado(tam.precio);
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          seleccionado
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-sm">{tam.nombre}</span>
                        <span className="text-base font-extrabold font-mono mt-1">
                          {formatearDinero(tam.precio)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Opciones de Sabor para Gaseosas */}
            {productoParaVariante.tipoVariante === 'sabor' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Elige el sabor deseado:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {productoParaVariante.sabores.map((sabor) => {
                    const seleccionado = varianteSeleccionada === sabor;
                    return (
                      <button
                        key={sabor}
                        type="button"
                        onClick={() => setVarianteSeleccionada(sabor)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                          seleccionado
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span>{sabor}</span>
                        {seleccionado && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notas opcionales de preparación */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nota de cocina / preparación (opcional):
              </label>
              <input
                type="text"
                value={notasVariante}
                onChange={(e) => setNotasVariante(e.target.value)}
                placeholder="Ej. Bien frito, sin cebolla, hielo extra..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Acciones del Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProductoParaVariante(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarVariante}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Agregar {precioSeleccionado !== null ? `(${formatearDinero(precioSeleccionado)})` : ''}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
