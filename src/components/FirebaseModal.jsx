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
  Check
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { getActiveFirebaseConfig, isFirebaseConfigured } from '../firebase/config';

export default function FirebaseModal() {
  const { 
    isFirebaseModalOpen, 
    setIsFirebaseModalOpen, 
    guardarConfigFirebase, 
    resetearConfigFirebase, 
    isFirebaseConnected,
    mostrarNotificacion 
  } = usePedidos();

  const configActual = getActiveFirebaseConfig();

  const [apiKey, setApiKey] = useState(configActual.apiKey === 'TU_API_KEY' ? '' : configActual.apiKey || '');
  const [authDomain, setAuthDomain] = useState(configActual.authDomain === 'TU_AUTH_DOMAIN' ? '' : configActual.authDomain || '');
  const [projectId, setProjectId] = useState(configActual.projectId === 'TU_PROJECT_ID' ? '' : configActual.projectId || '');
  const [storageBucket, setStorageBucket] = useState(configActual.storageBucket === 'TU_STORAGE_BUCKET' ? '' : configActual.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(configActual.messagingSenderId === 'TU_MESSAGING_SENDER_ID' ? '' : configActual.messagingSenderId || '');
  const [appId, setAppId] = useState(configActual.appId === 'TU_APP_ID' ? '' : configActual.appId || '');

  const [copiado, setCopiado] = useState(false);
  const [tab, setTab] = useState('config'); // 'config' | 'instrucciones'

  if (!isFirebaseModalOpen) return null;

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      mostrarNotificacion('Debes ingresar al menos el apiKey y projectId', 'error');
      return;
    }

    guardarConfigFirebase({
      apiKey,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId: messagingSenderId || '123456789',
      appId: appId || '1:123456789:web:abcdef',
    });
  };

  const reglasFirestore = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copiarReglas = () => {
    navigator.clipboard.writeText(reglasFirestore);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFirebaseConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Configuración de Firebase Firestore</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isFirebaseConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isFirebaseConnected ? 'CONECTADO' : 'MODO OFFLINE LOCAL'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sincronización en la nube para pedidos, cierres y reportes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFirebaseModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6 pt-2">
          <button
            onClick={() => setTab('config')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              tab === 'config'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Credenciales de Conexión
          </button>
          <button
            onClick={() => setTab('instrucciones')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              tab === 'instrucciones'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Guía Paso a Paso (Console)
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {tab === 'config' ? (
            <form onSubmit={handleGuardar} className="space-y-4">
              
              <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                Puedes pegar tus credenciales de Firebase Web App directamente aquí o modificar el archivo <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">src/firebase/config.js</code>. Si dejas los campos vacíos, el sistema guarda todo en almacenamiento local offline (IndexedDB / LocalStorage).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">apiKey *</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSyB..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">projectId *</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="el-garaje-pos"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">authDomain</label>
                  <input
                    type="text"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    placeholder="el-garaje-pos.firebaseapp.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">storageBucket</label>
                  <input
                    type="text"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    placeholder="el-garaje-pos.appspot.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">messagingSenderId</label>
                  <input
                    type="text"
                    value={messagingSenderId}
                    onChange={(e) => setMessagingSenderId(e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">appId</label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="1:123456:web:abcd..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetearConfigFirebase}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar por defecto</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFirebaseModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar y Conectar</span>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                  Crear Proyecto en Firebase Console
                </h4>
                <p className="text-slate-400 pl-7">
                  Ve a <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">console.firebase.google.com <ExternalLink className="w-3 h-3" /></a> y haz clic en <strong>"Agregar proyecto"</strong>. Nómbralo por ejemplo <code className="text-amber-300">El Garaje POS</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                  Crear Base de Datos Cloud Firestore
                </h4>
                <p className="text-slate-400 pl-7">
                  En el menú lateral, selecciona <strong>Build &gt; Firestore Database</strong> &gt; <strong>"Crear base de datos"</strong>. Selecciona una ubicación cercana (ej. <code>us-east1</code> o <code>southamerica-east1</code>) e inicia en modo de prueba.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                  Configurar Reglas de Seguridad (firestore.rules)
                </h4>
                <p className="text-slate-400 pl-7">
                  Ve a la pestaña <strong>Reglas</strong> en Firestore y pega lo siguiente para permitir lectura y escritura desde la aplicación POS:
                </p>
                <div className="pl-7">
                  <div className="relative p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300">
                    <pre>{reglasFirestore}</pre>
                    <button
                      type="button"
                      onClick={copiarReglas}
                      className="absolute right-2 top-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1 text-[10px]"
                    >
                      {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">4</span>
                  Registrar Aplicación Web y Obtener Claves
                </h4>
                <p className="text-slate-400 pl-7">
                  En la Configuración del Proyecto (icono de engranaje ⚙️), en "Tus apps", haz clic en el icono Web <strong>&lt;/&gt;</strong>. Copia el objeto <code>firebaseConfig</code> y pégalo en la pestaña "Credenciales de Conexión" o en <code>src/firebase/config.js</code>.
                </p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
