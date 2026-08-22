import React, { useState } from 'react';
import { 
  Info,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Fish,
  Flame,
  Soup,
  Layers,
  Sparkles,
  Plus,
  Bike,
  Users,
  X,
  Phone,
  User,
  MapPin,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { DIAS_ATENCION } from '../data/menu';
import MesaCard from '../components/MesaCard';
import PedidoModal from '../components/PedidoModal';
import CobroModal from '../components/CobroModal';
import TicketModal from '../components/TicketModal';
import FirebaseModal from '../components/FirebaseModal';

export default function Mesas() {
  const { 
    mesas, 
    liberarTodasLasMesas, 
    diaSeleccionado, 
    setDiaSeleccionado,
    agregarMesa,
    agregarDomicilio,
    sincronizarConSupabase,
    sincronizando
  } = usePedidos();

  const [mostrarConfirmacionLiberar, setMostrarConfirmacionLiberar] = useState(false);
  
  // Modales de creación
  const [modalNuevaMesa, setModalNuevaMesa] = useState(false);
  const [nombreNuevaMesa, setNombreNuevaMesa] = useState('');

  const [modalNuevoDomicilio, setModalNuevoDomicilio] = useState(false);
  const [clienteDomicilio, setClienteDomicilio] = useState('');
  const [telefonoDomicilio, setTelefonoDomicilio] = useState('');

  const mesasOcupadasCount = mesas.filter((m) => m.estado === 'ocupada').length;
  const domiciliosCount = mesas.filter((m) => m.tipo === 'domicilio').length;
  const mesasSalonCount = mesas.filter((m) => m.tipo === 'mesa').length;

  const diaActualInfo = DIAS_ATENCION.find((d) => d.id === diaSeleccionado) || DIAS_ATENCION[0];

  const getDiaIcon = (id) => {
    switch (id) {
      case 'viernes': return <Fish className="w-4 h-4" />;
      case 'sabado': return <Flame className="w-4 h-4" />;
      case 'domingo': return <Soup className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  // Siguiente número de mesa sugerido
  const numerosMesa = mesas
    .filter((m) => m.tipo === 'mesa' && typeof m.numero === 'number')
    .map((m) => m.numero);
  const siguienteNumeroSugerido = numerosMesa.length > 0 ? Math.max(...numerosMesa) + 1 : 1;

  const handleCrearMesaRapida = () => {
    agregarMesa(nombreNuevaMesa);
    setNombreNuevaMesa('');
    setModalNuevaMesa(false);
  };

  const handleCrearDomicilio = () => {
    agregarDomicilio(clienteDomicilio, telefonoDomicilio);
    setClienteDomicilio('');
    setTelefonoDomicilio('');
    setModalNuevoDomicilio(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* Título y Acciones Principales de la Sección */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Salón y Domicilios</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {mesasSalonCount} Mesas
              </span>
              {domiciliosCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  {domiciliosCount} {domiciliosCount === 1 ? 'Domicilio' : 'Domicilios'}
                </span>
              )}
            </div>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Crea pedidos para mesas o envíos a domicilio. Los domicilios pagados se archivan automáticamente.
          </p>
        </div>

        {/* Botonera de Acciones: Sincronizar, + Mesa, + Domicilio, Liberar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Botón Sincronizar */}
          <button
            type="button"
            onClick={() => sincronizarConSupabase(true)}
            disabled={sincronizando}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            title="Sincronizar mesas y pedidos con Supabase en la nube"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${sincronizando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{sincronizando ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>

          {/* Botón Nuevo Domicilio */}
          <button
            type="button"
            onClick={() => setModalNuevoDomicilio(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/20 active:scale-95"
          >
            <Bike className="w-4 h-4" />
            <span>+ Pedido A Domicilio</span>
          </button>

          {/* Botón Nueva Mesa */}
          <button
            type="button"
            onClick={() => {
              setNombreNuevaMesa(`Mesa ${siguienteNumeroSugerido}`);
              setModalNuevaMesa(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Mesa</span>
          </button>

          {/* Botón Liberar Todas */}
          {mesasOcupadasCount > 0 && (
            <button
              type="button"
              onClick={() => setMostrarConfirmacionLiberar(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Liberar todas las mesas activas"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Liberar todas ({mesasOcupadasCount})</span>
              <span className="sm:hidden">Liberar ({mesasOcupadasCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* SELECTOR DE DÍA DE ATENCIÓN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Menú según el Día de Atención:
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Selecciona el día para adaptar el menú de las comandas
          </span>
        </div>

        {/* Botonera de Días */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIAS_ATENCION.map((dia) => {
            const esActivo = diaSeleccionado === dia.id;
            return (
              <button
                key={dia.id}
                type="button"
                onClick={() => setDiaSeleccionado(dia.id)}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left relative overflow-hidden ${
                  esActivo
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide">
                    {getDiaIcon(dia.id)}
                    <span>{dia.corto}</span>
                  </div>
                  {esActivo && (
                    <span className="text-[10px] bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded font-black">
                      ACTIVO
                    </span>
                  )}
                </div>
                <span className={`text-[11px] leading-tight line-clamp-1 ${esActivo ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                  {dia.subtitulo}
                </span>
              </button>
            );
          })}
        </div>

        {/* Banner Informativo del Día Seleccionado */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-slate-200">
              Especialidad activa: <strong className="text-amber-400">{diaActualInfo.nombre}</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {diaActualInfo.subtitulo}
          </span>
        </div>
      </div>

      {/* Grid Dinámico de Mesas y Domicilios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {mesas.map((mesa) => (
          <MesaCard key={mesa.id || mesa.numero} mesa={mesa} />
        ))}
      </div>

      {/* Guía rápida de uso POS */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200">Gestión de Mesas y Domicilios:</span>
          <p>
            • Usa <strong>+ Pedido A Domicilio</strong> para abrir pedidos de despacho/entrega. Al cobrar el pedido, el cuadro se quitará automáticamente para mantener limpio tu salón.
            <br />
            • Usa <strong>+ Agregar Mesa</strong> para añadir más mesas según crezca la capacidad de tu local.
            <br />
            • Puedes hacer clic en el ícono de papelera de cualquier mesa o domicilio para retirarlo en cualquier momento.
          </p>
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVA MESA */}
      {modalNuevaMesa && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Agregar Nueva Mesa</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevaMesa(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre o Identificador de Mesa:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={nombreNuevaMesa}
                  onChange={(e) => setNombreNuevaMesa(e.target.value)}
                  placeholder={`Ej. Mesa ${siguienteNumeroSugerido} o Terraza 1`}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Botones de sugerencias rápidas */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 text-[11px]">Sugeridos:</span>
                {[siguienteNumeroSugerido, siguienteNumeroSugerido + 1, siguienteNumeroSugerido + 2].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNombreNuevaMesa(`Mesa ${num}`)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-white text-xs font-medium"
                  >
                    Mesa {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNombreNuevaMesa('Barra')}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-500/50 hover:text-white text-xs font-medium"
                >
                  Barra
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalNuevaMesa(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearMesaRapida}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR NUEVO PEDIDO A DOMICILIO */}
      {modalNuevoDomicilio && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Bike className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Nuevo Pedido A Domicilio</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoDomicilio(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Cliente / Receptor (Opcional):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={clienteDomicilio}
                    onChange={(e) => setClienteDomicilio(e.target.value)}
                    placeholder="Ej. Carlos Mendoza, Familia Pérez..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Teléfono / Dirección / Referencia (Opcional):
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={telefonoDomicilio}
                    onChange={(e) => setTelefonoDomicilio(e.target.value)}
                    placeholder="Ej. Calle Bolívar 123 / 0991234567"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalNuevoDomicilio(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearDomicilio}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Abrir Comanda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales Compartidos */}
      <PedidoModal />
      <CobroModal />
      <TicketModal />
      <FirebaseModal />

      {/* Modal de confirmación para liberar todas las mesas */}
      {mostrarConfirmacionLiberar && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">
                ¿Liberar todas las mesas?
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Todas las mesas y pedidos abiertos volverán a estar <strong>vacías y libres</strong>. (El historial de ventas anteriores no se verá afectado).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionLiberar(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  liberarTodasLasMesas();
                  setMostrarConfirmacionLiberar(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sí, Vaciar Mesas</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
