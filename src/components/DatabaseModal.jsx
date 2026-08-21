import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Check, 
  RefreshCw,
  Server,
  Code
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { 
  SUPABASE_PROJECT_NAME, 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL, 
  SUPABASE_SQL_SCHEMA,
  probarConexionSupabase 
} from '../supabase/client';

export default function DatabaseModal() {
  const { 
    isDatabaseModalOpen, 
    setIsDatabaseModalOpen, 
    isSupabaseConnected, 
    sincronizarConSupabase,
    sincronizando,
    mostrarNotificacion 
  } = usePedidos();

  const [tab, setTab] = useState('supabase'); // 'supabase' | 'sql' | 'firebase'
  const [copiadoSql, setCopiadoSql] = useState(false);
  const [probando, setProbando] = useState(false);
  const [testResultado, setTestResultado] = useState(null);

  if (!isDatabaseModalOpen) return null;

  const handleCopiarSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiadoSql(true);
    mostrarNotificacion('Script SQL copiado al portapapeles', 'success');
    setTimeout(() => setCopiadoSql(false), 3000);
  };

  const handleTestConexion = async () => {
    setProbando(true);
    setTestResultado(null);
    try {
      const res = await probarConexionSupabase();
      setTestResultado(res);
      if (res.conectado) {
        mostrarNotificacion('¡Conexión exitosa a Supabase!', 'success');
        sincronizarConSupabase(false);
      } else {
        mostrarNotificacion(res.mensaje || 'Error al conectar', 'error');
      }
    } catch (e) {
      setTestResultado({ conectado: false, mensaje: e.message });
    } finally {
      setProbando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Base de Datos en la Nube
              </h3>
              <p className="text-xs text-slate-400">
                Supabase PostgreSQL • El Garaje Calacaleño
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDatabaseModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setTab('supabase')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'supabase'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Supabase (Activo)</span>
          </button>

          <button
            onClick={() => setTab('sql')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'sql'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Script Tablas SQL</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {tab === 'supabase' && (
            <div className="space-y-4">
              
              {/* Estado de Conexión */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">
                    Conexión Integrada con Supabase
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tu sistema POS está vinculado al proyecto <strong>"{SUPABASE_PROJECT_NAME}"</strong>. Las comandas cobradas, pagos mixtos/divididos y cierres diarios se sincronizan con la base de datos.
                  </p>
                </div>
              </div>

              {/* Ficha técnica de conexión */}
              <div className="space-y-2.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-700">
                  <span className="text-slate-400">Proyecto:</span>
                  <span className="font-bold text-white">{SUPABASE_PROJECT_NAME}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-700">
                  <span className="text-slate-400">Project ID:</span>
                  <span className="font-mono font-bold text-amber-400">{SUPABASE_PROJECT_ID}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Endpoint URL:</span>
                  <span className="font-mono text-[11px] text-slate-300 truncate max-w-[280px]">
                    {SUPABASE_URL}
                  </span>
                </div>
              </div>

              {/* Botón de prueba y estado */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestConexion}
                  disabled={probando}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${probando ? 'animate-spin' : ''}`} />
                  <span>{probando ? 'Verificando...' : 'Comprobar Conexión'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => sincronizarConSupabase(true)}
                  disabled={sincronizando}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Sincronizar Datos</span>
                </button>
              </div>

              {testResultado && (
                <div className={`p-3 rounded-xl text-xs border ${
                  testResultado.conectado ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {testResultado.mensaje}
                </div>
              )}

            </div>
          )}

          {tab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Tablas <code>pedidos</code> y <code>cierres</code> con RLS:
                </span>
                <button
                  type="button"
                  onClick={handleCopiarSql}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  {copiadoSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                <pre>{SUPABASE_SQL_SCHEMA}</pre>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Si aún no has creado las tablas en tu proyecto, abre el <a href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">SQL Editor de Supabase</a>, pega el script anterior y presiona <strong>Run</strong>.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsDatabaseModalOpen(false)}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
