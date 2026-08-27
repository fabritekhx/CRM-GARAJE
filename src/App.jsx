import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PedidoProvider, usePedidos } from './context/PedidoContext';
import Navbar from './components/Navbar';
import Mesas from './pages/Mesas';
import Pedidos from './pages/Pedidos';
import Cierres from './pages/Cierres';
import Costos from './pages/Costos';
import Analisis from './pages/Analisis';
import ErrorBoundary from './components/ErrorBoundary';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

// Componente para renderizar la notificación global (Toast)
function GlobalNotification() {
  const { notificacion } = usePedidos();

  if (!notificacion) return null;

  const { mensaje, tipo } = notificacion;

  const bgStyles = {
    success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
    error: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
    info: 'bg-slate-900/95 border-amber-500/50 text-amber-200',
  }[tipo] || 'bg-slate-900 border-slate-700 text-white';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-400 shrink-0" />,
  }[tipo];

  return (
    <aside aria-label="Notificaciones del sistema" className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-sm">
      <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-3 ${bgStyles}`}>
        {icons}
        <p className="text-xs sm:text-sm font-semibold leading-snug">{mensaje}</p>
      </div>
    </aside>
  );
}

// Estructura Principal con Rutas
function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* Barra de Navegación Superior */}
      <Navbar />

      {/* Contenido Principal de las Páginas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Mesas />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/cierres" element={<Cierres />} />
          <Route path="/costos" element={<Costos />} />
          <Route path="/analisis" element={<Analisis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer Minimalista POS */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img 
              src="https://eyzcuxspypnnwzzatnzs.supabase.co/storage/v1/object/public/Imagen/EL%20GARAJE.png" 
              alt="Logo El Garaje" 
              className="h-5 w-auto object-contain opacity-80"
            />
            <span className="font-semibold text-slate-400">EL GARAJE POS</span>
            <span>— Sistema de Restaurante y Punto de Venta</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Base de datos Supabase • Modo Offline • Multiplataforma
          </p>
        </div>
      </footer>

      {/* Toast de Notificaciones */}
      <GlobalNotification />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <PedidoProvider>
          <AppContent />
        </PedidoProvider>
      </Router>
    </ErrorBoundary>
  );
}
