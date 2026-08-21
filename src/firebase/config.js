/**
 * Configuración de Firebase Firestore para "El Garaje POS"
 * 
 * INSTRUCCIONES:
 * Reemplaza los valores de abajo con las credenciales de tu proyecto en Firebase Console.
 * Si aún no tienes credenciales, el sistema usará almacenamiento local automático para que
 * puedas probar la aplicación sin interrupciones.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  enableIndexedDbPersistence 
} from 'firebase/firestore';

// 1. Configuración de Firebase (Coloca tus claves aquí)
export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Permitir sobreescribir desde localStorage o variables de entorno para pruebas dinámicas
export const getActiveFirebaseConfig = () => {
  const customConfig = localStorage.getItem('el_garaje_firebase_config');
  if (customConfig) {
    try {
      const parsed = JSON.parse(customConfig);
      if (parsed.apiKey && parsed.projectId && parsed.apiKey !== "TU_API_KEY") {
        return parsed;
      }
    } catch (e) {
      console.warn("Error leyendo configuración personalizada de Firebase:", e);
    }
  }
  return firebaseConfig;
};

// Verificar si Firebase tiene credenciales válidas
export const isFirebaseConfigured = () => {
  const cfg = getActiveFirebaseConfig();
  return (
    cfg.apiKey && 
    cfg.apiKey !== "TU_API_KEY" && 
    cfg.projectId && 
    cfg.projectId !== "TU_PROJECT_ID"
  );
};

// 2. Inicialización de Firebase App y Firestore
let app = null;
let db = null;

try {
  const activeConfig = getActiveFirebaseConfig();
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();
    db = getFirestore(app);
    
    // Habilitar persistencia offline en navegadores compatibles
    if (typeof window !== 'undefined') {
      try {
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Persistencia de Firestore: Múltiples pestañas abiertas.');
          } else if (err.code === 'unimplemented') {
            console.warn('El navegador no soporta persistencia offline de Firestore.');
          }
        });
      } catch (e) {
        // Silenciar si ya está habilitado
      }
    }
  }
} catch (error) {
  console.warn("Firebase no inicializado con credenciales activas. Modo simulación local activo.", error);
}

export { db, app };
export default db;
