import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Fish, 
  CupSoda, 
  Beer, 
  UtensilsCrossed, 
  Plus, 
  Check, 
  X,
  Layers,
  Citrus,
  Flame,
  Soup,
  Calendar
} from 'lucide-react';
import { CATEGORIAS, MENU, DIAS_ATENCION } from '../data/menu';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero } from '../utils/helpers';

export default function MenuPanel() {
  const { 
    agregarProductoAPedido, 
    mesaSeleccionada, 
    diaSeleccionado, 
    setDiaSeleccionado,
    preciosMap 
  } = usePedidos();
  
  const [categoriaActiva, setCategoriaActiva] = useState(() => {
    if (diaSeleccionado === 'sabado') return 'sabados';
    if (diaSeleccionado === 'domingo') return 'domingos';
    return 'pescados';
  });

  const [busqueda, setBusqueda] = useState('');
  
  // Estado para el modal de selección de producto / variantes
  const [productoParaVariante, setProductoParaVariante] = useState(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState('');
  const [precioSeleccionado, setPrecioSeleccionado] = useState(null);
  const [notasVariante, setNotasVariante] = useState('');
  
  // Estado para modo "Otro valor / Precio personalizado" (Exclusivo para la sección Pescados)
  const [esOtroValor, setEsOtroValor] = useState(false);
  const [valorPersonalizadoInput, setValorPersonalizadoInput] = useState('');

  // Cuando cambia el día seleccionado globalmente, ajustar la categoría activa
  useEffect(() => {
    if (diaSeleccionado === 'sabado') {
      setCategoriaActiva('sabados');
    } else if (diaSeleccionado === 'domingo') {
      setCategoriaActiva('domingos');
    } else if (diaSeleccionado === 'viernes') {
      setCategoriaActiva('pescados');
    }
  }, [diaSeleccionado]);

  // Filtrar categorías visibles según el día seleccionado
  const categoriasVisibles = useMemo(() => {
    if (diaSeleccionado === 'todos') {
      return CATEGORIAS;
    }
    return CATEGORIAS.filter(
      (cat) => cat.dia === 'todos' || cat.dia === diaSeleccionado
    );
  }, [diaSeleccionado]);

  // Filtrado de productos por categoría, día y búsqueda
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

  // Al hacer clic en un producto para ordenar
  const handleSeleccionarProducto = (prod) => {
    if (!mesaSeleccionada) return;

    const precioBaseActivo = preciosMap && preciosMap[prod.id] !== undefined 
      ? Number(preciosMap[prod.id]) 
      : Number(prod.precioBase);

    if (prod.tipoVariante === 'tamano_pescado') {
      // Pescados: Abre modal con los valores $4.00, $5.00, $6.00 y la opción de "Otro valor"
      setProductoParaVariante(prod);
      setVarianteSeleccionada(formatearDinero(prod.tamanos[1].precio)); // Default $5.00
      setPrecioSeleccionado(prod.tamanos[1].precio);
      setValorPersonalizadoInput(prod.tamanos[1].precio.toString());
      setEsOtroValor(false);
      setNotasVariante('');
    } else if (prod.tipoVariante === 'sabor' && prod.sabores?.length > 0) {
      if (prod.sabores.length === 1) {
        // Un solo sabor se agrega directamente
        agregarProductoAPedido(prod, prod.sabores[0], precioBaseActivo);
      } else {
        // Múltiples sabores: modal para elegir sabor
        setProductoParaVariante(prod);
        setVarianteSeleccionada(prod.sabores[0]);
        setPrecioSeleccionado(precioBaseActivo);
        setEsOtroValor(false);
        setNotasVariante('');
      }
    } else {
      // Platos principales y porciones directas (Fritadas, Caldos, Encebollados, Corvina, Camarón, Combos, etc.)
      agregarProductoAPedido(prod, null, precioBaseActivo);
    }
  };

  // Confirmar la variante / producto
  const handleConfirmarVariante = () => {
    if (!productoParaVariante) return;
    
    let precioFinal = precioSeleccionado;
    let varianteFinal = varianteSeleccionada;

    // Solo pescados pueden tener "esOtroValor"
    if (productoParaVariante.categoria === 'pescados' && esOtroValor) {
      const precioNumerico = parseFloat(valorPersonalizadoInput);
      precioFinal = !isNaN(precioNumerico) && precioNumerico >= 0 ? precioNumerico : (precioSeleccionado || 0);
      varianteFinal = `Valor: $${precioFinal.toFixed(2)}`;
    }

    agregarProductoAPedido(
      productoParaVariante,
      varianteFinal,
      precioFinal,
      notasVariante
    );

    setProductoParaVariante(null);
    setEsOtroValor(false);
    setValorPersonalizadoInput('');
  };

  const getCategoriaIcon = (id) => {
    switch (id) {
      case 'pescados': return <Fish className="w-4 h-4" />;
      case 'sabados': return <Flame className="w-4 h-4" />;
      case 'domingos': return <Soup className="w-4 h-4" />;
      case 'jugos': return <Citrus className="w-4 h-4" />;
      case 'gaseosas': return <CupSoda className="w-4 h-4" />;
      case 'cervezas': return <Beer className="w-4 h-4" />;
      case 'porciones': return <UtensilsCrossed className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
      
      {/* Barra superior: Selector de Día, Buscador y Categorías */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 space-y-3">
        
        {/* Selector de Día de Atención */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Día:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {DIAS_ATENCION.map((d) => {
              const esActivo = diaSeleccionado === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDiaSeleccionado(d.id);
                    if (d.categoriaPrincipal) {
                      setCategoriaActiva(d.categoriaPrincipal);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                    esActivo
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {d.corto}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buscador Rápido */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el menú (ej. Fritada, Encebollado, Tilapia, Jugo)..."
            className="w-full pl-10 pr-8 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pestañas de Categoría según el Día */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriasVisibles.map((cat) => {
            const esActiva = categoriaActiva === cat.id && !busqueda;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoriaActiva(cat.id);
                  setBusqueda('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
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
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto min-h-[300px]">
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productosFiltrados.map((prod) => {
              const tieneVariante = prod.tipoVariante !== null;
              const precioBaseActivo = preciosMap && preciosMap[prod.id] !== undefined 
                ? Number(preciosMap[prod.id]) 
                : Number(prod.precioBase);
              
              return (
                <div
                  key={prod.id}
                  onClick={() => handleSeleccionarProducto(prod)}
                  className="group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800/90 transition-all shadow-sm cursor-pointer select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <span className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {prod.nombre}
                      </span>
                    </div>

                    <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 mb-2">
                      {prod.descripcion}
                    </p>
                  </div>

                  {/* Precios y Botón */}
                  <div className="pt-2 border-t border-slate-700/50 mt-auto flex items-center justify-between">
                    <div>
                      {prod.tipoVariante === 'tamano_pescado' ? (
                        <span className="text-xs font-extrabold text-amber-400 font-mono">
                          $4.00 - $6.00
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono">
                          {formatearDinero(precioBaseActivo)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tieneVariante ? 'Elegir' : 'Agregar'}</span>
                    </button>
                  </div>
                </div>
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

      {/* MODAL DE SELECCIÓN DE PRODUCTO / VARIANTES */}
      {productoParaVariante && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Encabezado del Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">
                  {productoParaVariante.categoria === 'pescados' ? 'Seleccionar Valor' : 'Seleccionar Sabor'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {productoParaVariante.nombre}
                </h3>
              </div>
              <button
                onClick={() => {
                  setProductoParaVariante(null);
                  setEsOtroValor(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECCIÓN PESCADOS: SOLO LOS VALORES DEL PRECIO ($4.00, $5.00, $6.00) + OTRO VALOR */}
            {productoParaVariante.tipoVariante === 'tamano_pescado' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">
                  Elige el valor del pescado:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {productoParaVariante.tamanos.map((tam) => {
                    const seleccionado = !esOtroValor && precioSeleccionado === tam.precio;
                    return (
                      <button
                        key={tam.id}
                        type="button"
                        onClick={() => {
                          setEsOtroValor(false);
                          setVarianteSeleccionada(formatearDinero(tam.precio));
                          setPrecioSeleccionado(tam.precio);
                        }}
                        className={`py-3.5 px-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          seleccionado
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600 hover:bg-slate-750'
                        }`}
                      >
                        <span className="text-base sm:text-lg font-black font-mono">
                          {formatearDinero(tam.precio)}
                        </span>
                      </button>
                    );
                  })}

                  {/* Botón "Otro valor" SOLO en la sección de pescados */}
                  <button
                    type="button"
                    onClick={() => {
                      setEsOtroValor(true);
                      setVarianteSeleccionada('Otro valor');
                      if (!valorPersonalizadoInput) {
                        setValorPersonalizadoInput('5.00');
                      }
                    }}
                    className={`py-3.5 px-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      esOtroValor
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 text-amber-400 border-amber-500/40 hover:bg-slate-800 hover:border-amber-500'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">Otro valor</span>
                    <span className="text-sm font-extrabold font-mono mt-0.5">
                      {esOtroValor && valorPersonalizadoInput ? `$${parseFloat(valorPersonalizadoInput || 0).toFixed(2)}` : '$$$'}
                    </span>
                  </button>
                </div>

                {/* CAMPO DE ENTRADA Y ATAJOS PARA PESCADOS CUANDO SE ACTIVA "OTRO VALOR" */}
                {esOtroValor && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                      <span>Ingresa el valor del pescado:</span>
                      <span className="font-mono text-sm font-bold text-white">
                        ${parseFloat(valorPersonalizadoInput || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400 font-mono">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        autoFocus
                        inputMode="decimal"
                        value={valorPersonalizadoInput}
                        onChange={(e) => setValorPersonalizadoInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white font-mono font-bold text-base focus:outline-none"
                      />
                    </div>

                    {/* Atajos de valores rápidos para pescados */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 mr-1">Rápidos:</span>
                      {[3.50, 4.00, 4.50, 5.00, 6.00, 7.00, 8.00, 10.00].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setValorPersonalizadoInput(val.toString())}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 text-[11px] font-mono font-semibold transition-colors"
                        >
                          ${val.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN JUGOS Y GASEOSAS: SELECCIÓN SIMPLE DE SABOR */}
            {productoParaVariante.tipoVariante === 'sabor' && productoParaVariante.sabores?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Elige el sabor:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
                        <span className="truncate">{sabor}</span>
                        {seleccionado && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notas opcionales de cocina */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-300">
                Nota de preparación (opcional):
              </label>
              <input
                type="text"
                value={notasVariante}
                onChange={(e) => setNotasVariante(e.target.value)}
                placeholder="Ej. Bien frito, sin cebolla, poco hielo, extra porción..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Botones de acción del modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setProductoParaVariante(null);
                  setEsOtroValor(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarVariante}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Agregar (
                  {productoParaVariante.categoria === 'pescados' && esOtroValor 
                    ? `$${parseFloat(valorPersonalizadoInput || 0).toFixed(2)}` 
                    : formatearDinero(precioSeleccionado || productoParaVariante.precioBase)}
                  )
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
