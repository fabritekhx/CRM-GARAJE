import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  Receipt, 
  Calculator, 
  BarChart3, 
  Database, 
  CloudCheck, 
  CloudOff, 
  Clock, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';

export default function Navbar() {
  const { 
    isFirebaseConnected, 
    sincronizando, 
    sincronizarConFirestore, 
    setIsFirebaseModalOpen,
    mesas 
  } = usePedidos();

  const [horaActual, setHoraActual] = useState(new Date());

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mesasOcupadasCount = mesas.filter((m) => m.estado === 'ocupada').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* 1. Brand Logo y Nombre */}
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src="https://eyzcuxspypnnwzzatnzs.supabase.co/storage/v1/object/public/Imagen/EL%20GARAJE.png" 
              alt="Logo El Garaje" 
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md rounded-md bg-black/40 p-1 border border-amber-500/30"
              onError={(e) => {
                // Fallback si la imagen tarda en cargar
                e.target.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                EL GARAJE
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Punto de Venta POS
              </span>
            </div>
          </div>

          {/* 2. Navegación Principal (Single line contract) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Mesas</span>
              {mesasOcupadasCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[11px] font-extrabold rounded-full bg-slate-900 text-amber-400">
                  {mesasOcupadasCount}/6
                </span>
              )}
            </NavLink>

            <NavLink
              to="/pedidos"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Receipt className="w-4 h-4" />
              <span>Pedidos</span>
            </NavLink>

            <NavLink
              to="/cierres"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Calculator className="w-4 h-4" />
              <span>Cierre de Caja</span>
            </NavLink>

            <NavLink
              to="/analisis"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>Análisis</span>
            </NavLink>
          </nav>

          {/* 3. Zona de Acciones y Estado */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Reloj POS */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Estado de Firebase / Configuración */}
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isFirebaseConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Click para ver configuración de Firebase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isFirebaseConnected ? 'Firestore Conectado' : 'Modo Offline / Local'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Botón de Sincronización Manual */}
            {isFirebaseConnected && (
              <button
                onClick={sincronizarConFirestore}
                disabled={sincronizando}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
                title="Sincronizar con Firestore"
              >
                <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}

          </div>
        </div>

        {/* Barra de navegación inferior móvil */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-slate-800/80">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-amber-400 bg-amber-400/10 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Mesas</span>
          </NavLink>

          <NavLink
            to="/pedidos"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-amber-400 bg-amber-400/10 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Receipt className="w-4 h-4" />
            <span>Pedidos</span>
          </NavLink>

          <NavLink
            to="/cierres"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-amber-400 bg-amber-400/10 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Calculator className="w-4 h-4" />
            <span>Cierres</span>
          </NavLink>

          <NavLink
            to="/analisis"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-amber-400 bg-amber-400/10 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>Análisis</span>
          </NavLink>
        </div>

      </div>
    </header>
  );
}
