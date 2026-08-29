/**
 * Contexto global de Pedidos, Mesas, Supabase y Firestore para El Garaje POS
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  supabase, 
  guardarPedidoEnSupabase, 
  eliminarPedidoEnSupabase, 
  guardarCierreEnSupabase, 
  eliminarCierreEnSupabase,
  cargarPedidosDesdeSupabase, 
  cargarCierresDesdeSupabase,
  guardarMesasActivasEnSupabase,
  cargarMesasActivasDesdeSupabase,
  guardarConfiguracionPreciosYCostosEnSupabase,
  cargarConfiguracionPreciosYCostosDesdeSupabase,
  probarConexionSupabase,
  limpiarBaseDatosSupabase,
  SUPABASE_PROJECT_NAME, 
  SUPABASE_PROJECT_ID, 
  SUPABASE_URL
} from '../supabase/client';
import { fusionarMesasInteligente, calcularUltimoNumeroOrdenDelDia, obtenerFechaLocal, obtenerDiaSemanaId } from '../utils/helpers';
import { 
  obtenerPreciosProductos, 
  guardarPreciosProductos, 
  actualizarPrecioProducto as actualizarPrecioProductoHelper, 
  restaurarPreciosPredeterminados as restaurarPreciosPredeterminadosHelper,
  obtenerMenuConPreciosActualizados
} from '../data/precios';
import {
  obtenerCostosProductos,
  guardarCostosProductos,
  actualizarCostoProducto as actualizarCostoProductoHelper,
  restaurarCostosPredeterminados as restaurarCostosPredeterminadosHelper,
  COSTOS_PREDETERMINADOS
} from '../data/costos';
import confetti from 'canvas-confetti';

const PedidoContext = createContext();

// Claves de almacenamiento local para resiliencia offline
const STORAGE_MESAS = 'el_garaje_mesas_v1';
const STORAGE_PEDIDOS = 'el_garaje_pedidos_v1';
const STORAGE_CIERRES = 'el_garaje_cierres_v1';
const STORAGE_NUMERO_ORDEN = 'el_garaje_consecutivo_orden_v1';
const STORAGE_DIA = 'el_garaje_dia_seleccionado_v1';

// Canal local para sincronización inmediata entre pestañas del mismo navegador
const localBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('el_garaje_pos_sync') 
  : null;

// Estado inicial de las 7 mesas + A Domicilio (todas vacías y listas)
const MESAS_INICIALES = [
  { id: 1, numero: 1, tipo: 'mesa', nombre: 'Mesa 1', estado: 'libre', pedidoActual: null },
  { id: 2, numero: 2, tipo: 'mesa', nombre: 'Mesa 2', estado: 'libre', pedidoActual: null },
  { id: 3, numero: 3, tipo: 'mesa', nombre: 'Mesa 3', estado: 'libre', pedidoActual: null },
  { id: 4, numero: 4, tipo: 'mesa', nombre: 'Mesa 4', estado: 'libre', pedidoActual: null },
  { id: 5, numero: 5, tipo: 'mesa', nombre: 'Mesa 5', estado: 'libre', pedidoActual: null },
  { id: 6, numero: 6, tipo: 'mesa', nombre: 'Mesa 6', estado: 'libre', pedidoActual: null },
  { id: 7, numero: 7, tipo: 'mesa', nombre: 'Mesa 7', estado: 'libre', pedidoActual: null },
  { id: 'domicilio_1', numero: 'Domicilio 1', tipo: 'domicilio', nombre: 'A Domicilio #1', estado: 'libre', pedidoActual: null },
];

export const PedidoProvider = ({ children }) => {
  // Estado dinámico de mesas y pedidos a domicilio
  const [mesas, setMesas] = useState(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_MESAS);
      if (!guardadas) return MESAS_INICIALES;
      const parsed = JSON.parse(guardadas);
      if (!Array.isArray(parsed) || parsed.length === 0) return MESAS_INICIALES;

      return parsed.map((m) => {
        if (!m.pedidoActual || !m.pedidoActual.productos || m.pedidoActual.productos.length === 0) {
          return { ...m, estado: 'libre', pedidoActual: null };
        }
        return m;
      });
    } catch {
      return MESAS_INICIALES;
    }
  });

  // Historial de pedidos cobrados
  const [pedidosHistorial, setPedidosHistorial] = useState(() => {
    try {
      const guardados = localStorage.getItem(STORAGE_PEDIDOS);
      const parsed = guardados ? JSON.parse(guardados) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((p) => p && !String(p.id).startsWith('SYS_') && p.estado !== 'config')
        .map((p) => ({
          ...p,
          productos: Array.isArray(p.productos) ? p.productos : [],
        }));
    } catch {
      return [];
    }
  });

  // Historial de cierres de caja
  const [cierresHistorial, setCierresHistorial] = useState(() => {
    try {
      const guardados = localStorage.getItem(STORAGE_CIERRES);
      return guardados ? JSON.parse(guardados) : [];
    } catch {
      return [];
    }
  });

  // Mapa de Precios de Venta Personalizados y Persistentes
  const [preciosMap, setPreciosMap] = useState(() => obtenerPreciosProductos());

  // Mapa de Costos de Compra Personalizados y Persistentes
  const [costosMap, setCostosMap] = useState(() => obtenerCostosProductos());

  // Consecutivo de orden diario (inicia en 0 al iniciar el día para que la primera orden sea la #1)
  const [ultimoNumeroOrden, setUltimoNumeroOrden] = useState(() => {
    try {
      const hoyStr = obtenerFechaLocal();
      const guardadosPedidos = localStorage.getItem(STORAGE_PEDIDOS);
      const parsedPedidos = guardadosPedidos ? JSON.parse(guardadosPedidos) : [];
      const guardadasMesas = localStorage.getItem(STORAGE_MESAS);
      const parsedMesas = guardadasMesas ? JSON.parse(guardadasMesas) : [];
      return calcularUltimoNumeroOrdenDelDia(hoyStr, parsedPedidos, parsedMesas);
    } catch {
      return 0;
    }
  });

  // Modales y control de UI
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [diaSeleccionado, setDiaSeleccionadoState] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_DIA);
      if (guardado) return guardado;
      return obtenerDiaSemanaId();
    } catch {
      return 'viernes';
    }
  });

  const setDiaSeleccionado = useCallback((dia) => {
    setDiaSeleccionadoState(dia);
    try {
      localStorage.setItem(STORAGE_DIA, dia);
    } catch (e) {
      console.error('Error saving dia', e);
    }
  }, []);

  const [isPedidoModalOpen, setIsPedidoModalOpen] = useState(false);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketPedido, setTicketPedido] = useState(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);

  // Estados de conexión con Supabase y Firestore
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(isFirebaseConfigured());
  const [sincronizando, setSincronizando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Identificador único de este cliente/dispositivo para evitar eco en broadcast
  const clientIdRef = useRef(`client_${Math.random().toString(36).substring(2)}_${Date.now()}`);
  
  // Guardia crucial: impide que un dispositivo nuevo (con estado vacío) sobrescriba el servidor al abrirse
  const hasInitialSyncCompletedRef = useRef(false);

  // Referencias para evitar loops infinitos de actualización en tiempo real
  const isRemoteSyncRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const supabaseChannelRef = useRef(null);
  const lastLocalMutationTimestampRef = useRef(0);
  const autoCierreEjecutadoRef = useRef(new Set());

  // Fecha actual observada por la app en la zona horaria local del negocio
  const [fechaActualApp, setFechaActualApp] = useState(() => obtenerFechaLocal());

  // Guardar en localStorage automáticamente ante cambios locales
  useEffect(() => {
    localStorage.setItem(STORAGE_MESAS, JSON.stringify(mesas));
  }, [mesas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PEDIDOS, JSON.stringify(pedidosHistorial));
  }, [pedidosHistorial]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CIERRES, JSON.stringify(cierresHistorial));
  }, [cierresHistorial]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NUMERO_ORDEN, ultimoNumeroOrden.toString());
  }, [ultimoNumeroOrden]);

  // Mostrar notificación temporal
  const mostrarNotificacion = useCallback((mensaje, tipo = 'success') => {
    const id = Date.now();
    setNotificacion({ id, mensaje, tipo });
    setTimeout(() => {
      setNotificacion((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Función para persistir mesas activas en la nube y notificar a otros navegadores
  const transmitirCambiosMesas = useCallback((nuevasMesas, numOrden) => {
    // Si aún no hemos completado la carga inicial desde el servidor y no hubo interacción del usuario, NO transmitir
    if (!hasInitialSyncCompletedRef.current && lastLocalMutationTimestampRef.current === 0) {
      return;
    }

    const payloadData = {
      tipo: 'SYNC_MESAS',
      mesas: nuevasMesas,
      ultimoNumeroOrden: numOrden,
      senderId: clientIdRef.current,
      timestamp: Date.now()
    };

    // 1. Enviar por canal local de pestañas
    if (localBroadcastChannel) {
      try {
        localBroadcastChannel.postMessage(payloadData);
      } catch (e) {
        console.warn('Error en broadcast local:', e);
      }
    }

    // 2. Enviar por Supabase Realtime Channel a otros dispositivos
    if (supabaseChannelRef.current) {
      try {
        const broadcastEvent = {
          type: 'broadcast',
          event: 'mesas_actualizadas',
          payload: payloadData
        };

        if (typeof supabaseChannelRef.current.httpSend === 'function') {
          supabaseChannelRef.current.httpSend(broadcastEvent).catch(() => {});
        } else if (typeof supabaseChannelRef.current.send === 'function') {
          supabaseChannelRef.current.send(broadcastEvent);
        }
      } catch (e) {
        console.warn('Error en broadcast Supabase:', e);
      }
    }

    // 3. Persistir en la base de datos de Supabase con debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      await guardarMesasActivasEnSupabase(nuevasMesas, numOrden);
    }, 400);
  }, []);

  // Sincronizar automáticamente cuando 'mesas' o 'ultimoNumeroOrden' cambian por acción local
  useEffect(() => {
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }
    if (hasInitialSyncCompletedRef.current || lastLocalMutationTimestampRef.current > 0) {
      transmitirCambiosMesas(mesas, ultimoNumeroOrden);
    }
  }, [mesas, ultimoNumeroOrden, transmitirCambiosMesas]);

  // Cargar datos de Supabase al iniciar o sincronizar silenciosamente
  const sincronizarConSupabase = useCallback(async (mostrarMensaje = false) => {
    setSincronizando(true);
    try {
      // 1. Probar conexión
      const test = await probarConexionSupabase();
      setIsSupabaseConnected(test.conectado);

      // 2. Cargar mesas activas / pedidos en curso antes de cobrar
      const resMesas = await cargarMesasActivasDesdeSupabase();
      let mesasActuales = mesas;
      if (resMesas.success && Array.isArray(resMesas.mesas) && resMesas.mesas.length > 0) {
        mesasActuales = fusionarMesasInteligente(mesas, resMesas.mesas);
        setMesas((current) => {
          const fusionado = fusionarMesasInteligente(current, resMesas.mesas);
          isRemoteSyncRef.current = true;
          return fusionado;
        });
      }

      // Marcar carga inicial como completada para habilitar sincronización saliente
      hasInitialSyncCompletedRef.current = true;

      // 3. Cargar pedidos cobrados desde Supabase
      const resPedidos = await cargarPedidosDesdeSupabase();
      let pedidosActuales = pedidosHistorial;
      if (resPedidos.success) {
        pedidosActuales = resPedidos.data || [];
        setPedidosHistorial(resPedidos.data || []);
      }

      // 4. Recalcular consecutivo de orden de HOY para empezar en 1 y no saltar números
      const hoyStr = obtenerFechaLocal();
      const maxOrdenHoy = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosActuales, mesasActuales);
      setUltimoNumeroOrden(maxOrdenHoy);

      // 5. Cargar cierres desde Supabase
      const resCierres = await cargarCierresDesdeSupabase();
      if (resCierres.success) {
        setCierresHistorial(resCierres.data || []);
      }

      // 6. Cargar configuración remota de precios de venta y costos de compra
      const resConfig = await cargarConfiguracionPreciosYCostosDesdeSupabase();
      if (resConfig.success) {
        if (resConfig.precios && Object.keys(resConfig.precios).length > 0) {
          const fusionadosPrecios = { ...obtenerPreciosProductos(), ...resConfig.precios };
          setPreciosMap(fusionadosPrecios);
          guardarPreciosProductos(fusionadosPrecios);
        }
        if (resConfig.costos && Object.keys(resConfig.costos).length > 0) {
          const fusionadosCostos = { ...obtenerCostosProductos(), ...resConfig.costos };
          setCostosMap(fusionadosCostos);
          guardarCostosProductos(fusionadosCostos);
        }
      }

      // 7. Cargar de Firestore si está configurado como backup
      if (db && isFirebaseConfigured()) {
        try {
          const pedidosRef = collection(db, 'pedidos');
          const snapshot = await getDocs(query(pedidosRef, orderBy('numeroOrden', 'desc')));
          if (!snapshot.empty && (!resPedidos.success || resPedidos.data.length === 0)) {
            const remotos = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remotos.push({
                id: docSnap.id,
                ...data,
                fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha,
              });
            });
            setPedidosHistorial(remotos);
          }
          setIsFirebaseConnected(true);
        } catch {
          // fallback
        }
      }

      if (mostrarMensaje) {
        mostrarNotificacion('Sincronización automática activa', 'success');
      }
    } catch (error) {
      console.warn('Sincronización automática silenciosa:', error);
    } finally {
      hasInitialSyncCompletedRef.current = true;
      setSincronizando(false);
    }
  }, [mostrarNotificacion]);

  // Configurar listeners en tiempo real y ciclo de sincronización automática continua
  useEffect(() => {
    // 1. Carga inicial desde Supabase
    sincronizarConSupabase(false);

    // 2. Suscripción Supabase Realtime Broadcast para sincronización instantánea entre múltiples dispositivos
    if (supabase) {
      try {
        const channel = supabase.channel('el-garaje-pos-mesas-realtime', {
          config: { broadcast: { self: false, ack: true } }
        });

        channel.on('broadcast', { event: 'mesas_actualizadas' }, (event) => {
          const payload = event?.payload;
          // Ignorar ecos del mismo cliente
          if (payload?.senderId === clientIdRef.current) return;

          if (payload && Array.isArray(payload.mesas)) {
            setMesas((current) => {
              const fusionado = fusionarMesasInteligente(current, payload.mesas);
              if (JSON.stringify(current) !== JSON.stringify(fusionado)) {
                isRemoteSyncRef.current = true;
                return fusionado;
              }
              return current;
            });
            if (payload.ultimoNumeroOrden) {
              setUltimoNumeroOrden((prev) => Math.max(prev, payload.ultimoNumeroOrden));
            }
          }
        });

        channel.on('broadcast', { event: 'config_actualizada' }, (event) => {
          const payload = event?.payload;
          if (payload?.senderId === clientIdRef.current) return;
          if (payload?.precios) {
            setPreciosMap(payload.precios);
            guardarPreciosProductos(payload.precios);
          }
          if (payload?.costos) {
            setCostosMap(payload.costos);
            guardarCostosProductos(payload.costos);
          }
        });

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            supabaseChannelRef.current = channel;
          }
        });
      } catch (err) {
        console.warn('Error configurando canal Realtime Supabase:', err);
      }
    }

    // 3. Listener BroadcastChannel local (múltiples pestañas en el mismo navegador)
    if (localBroadcastChannel) {
      localBroadcastChannel.onmessage = (event) => {
        if (event.data?.senderId === clientIdRef.current) return;

        if (event.data?.tipo === 'SYNC_MESAS' && Array.isArray(event.data.mesas)) {
          if (Date.now() - lastLocalMutationTimestampRef.current < 2500) {
            return;
          }
          setMesas((current) => {
            const fusionado = fusionarMesasInteligente(current, event.data.mesas);
            if (JSON.stringify(current) !== JSON.stringify(fusionado)) {
              isRemoteSyncRef.current = true;
              return fusionado;
            }
            return current;
          });
          if (event.data.ultimoNumeroOrden) {
            setUltimoNumeroOrden((prev) => Math.max(prev, event.data.ultimoNumeroOrden));
          }
        }

        if (event.data?.tipo === 'SYNC_PRECIOS' && event.data.precios) {
          setPreciosMap(event.data.precios);
          guardarPreciosProductos(event.data.precios);
        }

        if (event.data?.tipo === 'SYNC_COSTOS' && event.data.costos) {
          setCostosMap(event.data.costos);
          guardarCostosProductos(event.data.costos);
        }

        if (event.data?.tipo === 'SYNC_PRECIOS_Y_COSTOS') {
          if (event.data.precios) {
            setPreciosMap(event.data.precios);
            guardarPreciosProductos(event.data.precios);
          }
          if (event.data.costos) {
            setCostosMap(event.data.costos);
            guardarCostosProductos(event.data.costos);
          }
        }
      };
    }

    // 4. Listener cuando el usuario cambia de ventana o regresa a la pestaña (Visibility / Focus)
    const handleFocus = () => {
      if (Date.now() - lastLocalMutationTimestampRef.current < 2500) {
        return;
      }
      cargarMesasActivasDesdeSupabase().then((res) => {
        if (res.success && Array.isArray(res.mesas) && res.mesas.length > 0) {
          setMesas((current) => {
            const fusionado = fusionarMesasInteligente(current, res.mesas);
            if (JSON.stringify(current) !== JSON.stringify(fusionado)) {
              isRemoteSyncRef.current = true;
              return fusionado;
            }
            return current;
          });
          if (res.ultimoNumeroOrden) {
            setUltimoNumeroOrden((prev) => Math.max(prev, res.ultimoNumeroOrden));
          }
        }
      });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    // 5. Polling automático en segundo plano para sincronizar mesas y pedidos abiertos
    const pollingMesasInterval = setInterval(async () => {
      // Si hubo mutación local reciente, respetar la interacción del usuario
      if (Date.now() - lastLocalMutationTimestampRef.current < 2500) {
        return;
      }
      try {
        const res = await cargarMesasActivasDesdeSupabase();
        if (res.success && Array.isArray(res.mesas) && res.mesas.length > 0) {
          setMesas((current) => {
            const fusionado = fusionarMesasInteligente(current, res.mesas);
            if (JSON.stringify(current) !== JSON.stringify(fusionado)) {
              isRemoteSyncRef.current = true;
              return fusionado;
            }
            return current;
          });
          if (res.ultimoNumeroOrden) {
            setUltimoNumeroOrden((prev) => Math.max(prev, res.ultimoNumeroOrden));
          }
        }
      } catch {
        // Silencioso
      }
    }, 3000);

    // 6. Polling automático en segundo plano para pedidos pagados e historial
    const pollingPedidosInterval = setInterval(async () => {
      try {
        const res = await cargarPedidosDesdeSupabase();
        if (res.success && Array.isArray(res.data)) {
          setPedidosHistorial((current) => {
            if (current.length !== res.data.length) {
              return res.data;
            }
            return current;
          });
        }
      } catch {
        // Silencioso
      }
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollingMesasInterval);
      clearInterval(pollingPedidosInterval);
      if (supabaseChannelRef.current) {
        supabase.removeChannel(supabaseChannelRef.current);
      }
    };
  }, [sincronizarConSupabase]);

  // Detección de cambio de día según el reloj local del navegador (a medianoche 00:00:00)
  // NOTA: NO se fuerza el cierre de caja de forma automática para no interrumpir la atención de los clientes ni los turnos de noche.
  useEffect(() => {
    const verificarCambioDia = () => {
      const hoyLocal = obtenerFechaLocal();
      setFechaActualApp((fechaAnterior) => {
        if (fechaAnterior !== hoyLocal) {
          // Actualizar consecutivo de orden para el nuevo día
          const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyLocal, pedidosHistorial, mesas);
          setUltimoNumeroOrden(nuevoMax);
          return hoyLocal;
        }
        return fechaAnterior;
      });
    };

    const intervalId = setInterval(verificarCambioDia, 30000);
    return () => clearInterval(intervalId);
  }, [pedidosHistorial, mesas]);

  // Guardado manual explícito con confirmación al usuario
  const guardarComandaEnNube = async () => {
    setSincronizando(true);
    try {
      await guardarMesasActivasEnSupabase(mesas, ultimoNumeroOrden);
      transmitirCambiosMesas(mesas, ultimoNumeroOrden);
      mostrarNotificacion('Comanda guardada y sincronizada en tiempo real con otros navegadores', 'success');
      return true;
    } catch (e) {
      mostrarNotificacion('Guardado localmente (se sincronizará en la nube)', 'info');
      return false;
    } finally {
      setSincronizando(false);
    }
  };

  // Abrir mesa para ver o crear pedido
  const abrirMesa = (numeroMesa) => {
    lastLocalMutationTimestampRef.current = Date.now();
    const mesa = mesas.find((m) => m.numero === numeroMesa);
    if (!mesa) return;

    if (mesa.estado === 'libre' || !mesa.pedidoActual) {
      // Calcular siguiente número de orden dinámico para hoy (empieza en 1 y no salta números)
      const hoyStr = obtenerFechaLocal();
      const ultimoHoy = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, mesas);
      const nuevoNumOrden = ultimoHoy + 1;

      const nuevoPedido = {
        id: `ped_${Date.now()}_m${numeroMesa}`,
        numeroOrden: nuevoNumOrden,
        mesa: numeroMesa,
        fecha: new Date().toISOString(),
        productos: [],
        total: 0,
        notas: '',
        estado: 'activo',
      };

      setMesas((prev) =>
        prev.map((m) =>
          m.numero === numeroMesa
            ? { ...m, estado: 'ocupada', pedidoActual: nuevoPedido, updatedAt: Date.now() }
            : m
        )
      );
      setUltimoNumeroOrden(nuevoNumOrden);
    }

    setMesaSeleccionada(numeroMesa);
    setIsPedidoModalOpen(true);
  };

  // Obtener el pedido actual de la mesa seleccionada
  const mesaActual = mesas.find((m) => m.numero === mesaSeleccionada) || null;
  const pedidoActual = mesaActual?.pedidoActual || null;

  // Calcular total de un pedido
  const calcularTotal = (productos) => {
    return productos.reduce((sum, item) => {
      const precio = Number(item.precioUnitario) || 0;
      const cant = Number(item.cantidad) || 0;
      return sum + precio * cant;
    }, 0);
  };

  // Agregar producto al pedido actual
  const agregarProductoAPedido = (producto, variante = null, precioPersonalizado = null, notas = '') => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    const precioBaseActivo = preciosMap[producto.id] !== undefined ? Number(preciosMap[producto.id]) : Number(producto.precioBase);
    const precioFinal = precioPersonalizado !== null ? Number(precioPersonalizado) : precioBaseActivo;
    const varianteStr = variante || '';

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada) return m;

        const pedido = m.pedidoActual || {
          id: `ped_${Date.now()}_m${m.numero}`,
          numeroOrden: ultimoNumeroOrden + 1,
          mesa: m.numero,
          fecha: new Date().toISOString(),
          productos: [],
          total: 0,
          estado: 'activo',
        };

        // Buscar si ya existe el mismo producto con la misma variante y MISMO precio unitario
        const indexExistente = pedido.productos.findIndex(
          (item) => 
            item.productoId === producto.id && 
            item.variante === varianteStr && 
            Number(item.precioUnitario) === Number(precioFinal)
        );

        let nuevosProductos = [...pedido.productos];

        if (indexExistente >= 0) {
          nuevosProductos[indexExistente] = {
            ...nuevosProductos[indexExistente],
            cantidad: nuevosProductos[indexExistente].cantidad + 1,
            notas: notas ? (nuevosProductos[indexExistente].notas ? `${nuevosProductos[indexExistente].notas}, ${notas}` : notas) : nuevosProductos[indexExistente].notas,
          };
        } else {
          nuevosProductos.push({
            productoId: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria || 'general',
            precioUnitario: precioFinal,
            cantidad: 1,
            variante: varianteStr,
            notas: notas || '',
          });
        }

        const totalActualizado = calcularTotal(nuevosProductos);

        return {
          ...m,
          estado: 'ocupada',
          updatedAt: Date.now(),
          pedidoActual: {
            ...pedido,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );

    mostrarNotificacion(`Agregado: ${producto.nombre} ${variante ? `(${variante})` : ''} - $${precioFinal.toFixed(2)}`, 'success');
  };

  // Cambiar cantidad de un producto
  const cambiarCantidad = (itemIndex, delta) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;

        let nuevosProductos = [...m.pedidoActual.productos];
        const itemActual = nuevosProductos[itemIndex];
        if (!itemActual) return m;

        const nuevaCantidad = itemActual.cantidad + delta;

        if (nuevaCantidad <= 0) {
          nuevosProductos.splice(itemIndex, 1);
        } else {
          nuevosProductos[itemIndex] = {
            ...itemActual,
            cantidad: nuevaCantidad,
          };
        }

        const totalActualizado = calcularTotal(nuevosProductos);

        return {
          ...m,
          updatedAt: Date.now(),
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );
  };

  // Eliminar producto del pedido
  const eliminarProducto = (itemIndex) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;

        const nuevosProductos = m.pedidoActual.productos.filter((_, idx) => idx !== itemIndex);
        const totalActualizado = calcularTotal(nuevosProductos);

        return {
          ...m,
          updatedAt: Date.now(),
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );
  };

  // Actualizar notas de un ítem individual
  const actualizarNotasItem = (itemIndex, notas) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;

        const nuevosProductos = [...m.pedidoActual.productos];
        if (nuevosProductos[itemIndex]) {
          nuevosProductos[itemIndex] = {
            ...nuevosProductos[itemIndex],
            notas,
          };
        }

        return {
          ...m,
          updatedAt: Date.now(),
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
          },
        };
      })
    );
  };

  // Actualizar precio de un ítem individual (y opcionalmente fijarlo como precio base permanente)
  const actualizarPrecioItem = (itemIndex, nuevoPrecio, guardarComoPrecioFijo = false) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    const precioNum = Math.max(0, parseFloat(nuevoPrecio) || 0);

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;

        const nuevosProductos = [...m.pedidoActual.productos];
        if (nuevosProductos[itemIndex]) {
          const item = nuevosProductos[itemIndex];
          nuevosProductos[itemIndex] = {
            ...item,
            precioUnitario: precioNum,
          };

          // Si se solicitó fijar como precio permanente del catálogo
          if (guardarComoPrecioFijo && item.productoId) {
            actualizarPrecioBaseProducto(item.productoId, precioNum);
          }
        }

        const totalActualizado = calcularTotal(nuevosProductos);

        return {
          ...m,
          updatedAt: Date.now(),
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );
  };

  // Actualizar precio base de venta de un producto y persistirlo permanentemente
  const actualizarPrecioBaseProducto = (productoId, nuevoPrecio) => {
    const precioNum = Math.max(0, parseFloat(nuevoPrecio) || 0);
    const mapaActualizado = actualizarPrecioProductoHelper(productoId, precioNum);
    setPreciosMap(mapaActualizado);

    // Guardar en Supabase en segundo plano
    guardarConfiguracionPreciosYCostosEnSupabase(mapaActualizado, costosMap).catch(() => {});

    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({
        tipo: 'SYNC_PRECIOS_Y_COSTOS',
        precios: mapaActualizado,
        costos: costosMap,
        senderId: clientIdRef.current,
      });
    }

    if (supabaseChannelRef.current) {
      try {
        const broadcastEvent = {
          type: 'broadcast',
          event: 'config_actualizada',
          payload: {
            precios: mapaActualizado,
            costos: costosMap,
            senderId: clientIdRef.current,
          }
        };
        if (typeof supabaseChannelRef.current.httpSend === 'function') {
          supabaseChannelRef.current.httpSend(broadcastEvent).catch(() => {});
        } else if (typeof supabaseChannelRef.current.send === 'function') {
          supabaseChannelRef.current.send(broadcastEvent);
        }
      } catch (e) {
        console.warn('Error en broadcast Supabase config:', e);
      }
    }

    const itemMenu = MENU.find((m) => m.id === productoId);
    const nombreProd = itemMenu ? itemMenu.nombre : 'Producto';
    mostrarNotificacion(`Precio de venta guardado: ${nombreProd} a $${precioNum.toFixed(2)}`, 'success');
    return mapaActualizado;
  };

  // Actualizar costo de compra de un producto y persistirlo permanentemente
  const actualizarCostoProducto = (productoId, nuevoCosto) => {
    const costoNum = Math.max(0, parseFloat(nuevoCosto) || 0);
    const mapaActualizado = actualizarCostoProductoHelper(productoId, costoNum);
    setCostosMap(mapaActualizado);

    // Guardar en Supabase en segundo plano
    guardarConfiguracionPreciosYCostosEnSupabase(preciosMap, mapaActualizado).catch(() => {});

    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({
        tipo: 'SYNC_PRECIOS_Y_COSTOS',
        precios: preciosMap,
        costos: mapaActualizado,
        senderId: clientIdRef.current,
      });
    }

    if (supabaseChannelRef.current) {
      try {
        const broadcastEvent = {
          type: 'broadcast',
          event: 'config_actualizada',
          payload: {
            precios: preciosMap,
            costos: mapaActualizado,
            senderId: clientIdRef.current,
          }
        };
        if (typeof supabaseChannelRef.current.httpSend === 'function') {
          supabaseChannelRef.current.httpSend(broadcastEvent).catch(() => {});
        } else if (typeof supabaseChannelRef.current.send === 'function') {
          supabaseChannelRef.current.send(broadcastEvent);
        }
      } catch (e) {
        console.warn('Error en broadcast Supabase config:', e);
      }
    }

    const itemMenu = MENU.find((m) => m.id === productoId);
    const nombreProd = itemMenu ? itemMenu.nombre : 'Producto';
    mostrarNotificacion(`Costo de compra guardado: ${nombreProd} a $${costoNum.toFixed(2)}`, 'success');
    return mapaActualizado;
  };

  // Restaurar todos los precios de venta a los valores iniciales predeterminados
  const restaurarPreciosBasePredeterminados = () => {
    const mapaPredeterminado = restaurarPreciosPredeterminadosHelper();
    setPreciosMap(mapaPredeterminado);

    guardarConfiguracionPreciosYCostosEnSupabase(mapaPredeterminado, costosMap).catch(() => {});

    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({
        tipo: 'SYNC_PRECIOS_Y_COSTOS',
        precios: mapaPredeterminado,
        costos: costosMap,
        senderId: clientIdRef.current,
      });
    }

    mostrarNotificacion('Precios de venta restaurados a los valores predeterminados', 'info');
    return mapaPredeterminado;
  };

  // Restaurar todos los costos de compra a los valores iniciales predeterminados
  const restaurarCostosPredeterminados = () => {
    const mapaPredeterminado = restaurarCostosPredeterminadosHelper();
    setCostosMap(mapaPredeterminado);

    guardarConfiguracionPreciosYCostosEnSupabase(preciosMap, mapaPredeterminado).catch(() => {});

    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({
        tipo: 'SYNC_PRECIOS_Y_COSTOS',
        precios: preciosMap,
        costos: mapaPredeterminado,
        senderId: clientIdRef.current,
      });
    }

    mostrarNotificacion('Costos de insumos restaurados a los valores predeterminados', 'info');
    return mapaPredeterminado;
  };

  // Actualizar notas generales del pedido
  const actualizarNotasPedido = (notas) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;
        return {
          ...m,
          updatedAt: Date.now(),
          pedidoActual: {
            ...m.pedidoActual,
            notas,
          },
        };
      })
    );
  };

  // Cerrar modal de pedido y liberar mesa automáticamente si no tiene ítems (recalculando orden)
  const cerrarModalPedido = () => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (mesaSeleccionada) {
      setMesas((prev) => {
        let huboLiberacion = false;
        const actualizadas = prev.map((m) => {
          if (m.numero === mesaSeleccionada) {
            if (!m.pedidoActual?.productos || m.pedidoActual.productos.length === 0) {
              huboLiberacion = true;
              return { ...m, estado: 'libre', pedidoActual: null, updatedAt: Date.now() };
            }
          }
          return m;
        });

        if (huboLiberacion) {
          const hoyStr = obtenerFechaLocal();
          const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, actualizadas);
          setUltimoNumeroOrden(nuevoMax);
        }

        return actualizadas;
      });
    }
    setIsPedidoModalOpen(false);
    setMesaSeleccionada(null);
  };

  // Agregar una nueva mesa dinámica
  const agregarMesa = (nombrePersonalizado = '') => {
    lastLocalMutationTimestampRef.current = Date.now();
    const numeros = mesas
      .filter((m) => m.tipo === 'mesa' && typeof m.numero === 'number')
      .map((m) => m.numero);
    const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
    const nombre = nombrePersonalizado && nombrePersonalizado.trim() !== '' 
      ? nombrePersonalizado.trim() 
      : `Mesa ${siguiente}`;

    const nuevaMesa = {
      id: `mesa_${Date.now()}_${siguiente}`,
      numero: siguiente,
      tipo: 'mesa',
      nombre,
      estado: 'libre',
      pedidoActual: null,
      updatedAt: Date.now(),
    };

    setMesas((prev) => [...prev, nuevaMesa]);
    mostrarNotificacion(`${nombre} agregada con éxito`, 'success');
    return nuevaMesa;
  };

  // Agregar un nuevo pedido a domicilio y abrir comanda directamente
  const agregarDomicilio = (nombreCliente = '', telefonoOReferencia = '') => {
    lastLocalMutationTimestampRef.current = Date.now();
    const domiciliosExistentes = mesas.filter((m) => m.tipo === 'domicilio');
    const conteo = domiciliosExistentes.length + 1;
    const identificador = `Dom #${conteo}`;
    const idUnico = `dom_${Date.now()}`;

    // Calcular consecutivo dinámico de hoy sin saltos
    const hoyStr = obtenerFechaLocal();
    const ultimoHoy = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, mesas);
    const nuevoNumOrden = ultimoHoy + 1;

    const nombre = nombreCliente && nombreCliente.trim() !== ''
      ? `A Domicilio (${nombreCliente.trim()})`
      : `A Domicilio #${conteo}`;

    const notaInicial = [
      nombreCliente ? `Cliente: ${nombreCliente.trim()}` : '',
      telefonoOReferencia ? `Ref/Tel: ${telefonoOReferencia.trim()}` : ''
    ].filter(Boolean).join(' | ');

    const nuevoPedido = {
      id: `ped_${Date.now()}_dom_${conteo}`,
      numeroOrden: nuevoNumOrden,
      mesa: identificador,
      fecha: new Date().toISOString(),
      productos: [],
      total: 0,
      notas: notaInicial,
      estado: 'activo',
    };

    const nuevoDomicilio = {
      id: idUnico,
      numero: identificador,
      tipo: 'domicilio',
      nombre,
      estado: 'ocupada',
      pedidoActual: nuevoPedido,
      updatedAt: Date.now(),
    };

    setUltimoNumeroOrden(nuevoNumOrden);
    setMesas((prev) => [...prev, nuevoDomicilio]);
    setMesaSeleccionada(identificador);
    setIsPedidoModalOpen(true);
    mostrarNotificacion(`Pedido ${nombre} creado. Añade los platos del comensal`, 'success');
    return nuevoDomicilio;
  };

  // Eliminar una mesa o cuadro de domicilio (y recalcular consecutivo si procede)
  const eliminarMesa = (idONumero) => {
    lastLocalMutationTimestampRef.current = Date.now();
    setMesas((prev) => {
      const actualizadas = prev.filter((m) => m.id !== idONumero && m.numero !== idONumero);
      const hoyStr = obtenerFechaLocal();
      const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, actualizadas);
      setUltimoNumeroOrden(nuevoMax);
      return actualizadas;
    });
    if (mesaSeleccionada === idONumero) {
      setIsPedidoModalOpen(false);
      setIsCobroModalOpen(false);
      setMesaSeleccionada(null);
    }
    mostrarNotificacion('Mesa o domicilio eliminado del panel', 'info');
  };

  // Liberar todas las mesas activas de una sola vez
  const liberarTodasLasMesas = () => {
    lastLocalMutationTimestampRef.current = Date.now();
    const reset = MESAS_INICIALES.map((m) => ({ ...m, updatedAt: Date.now() }));
    setMesas(reset);
    localStorage.setItem(STORAGE_MESAS, JSON.stringify(reset));
    const hoyStr = obtenerFechaLocal();
    const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, reset);
    setUltimoNumeroOrden(nuevoMax);
    setIsPedidoModalOpen(false);
    setIsCobroModalOpen(false);
    setMesaSeleccionada(null);
    mostrarNotificacion('Todas las mesas han sido liberadas y están vacías', 'info');
  };

  // Cancelar/Vaciar pedido de una mesa (recalculando el consecutivo para no saltar números)
  const cancelarPedidoMesa = (numeroMesa) => {
    lastLocalMutationTimestampRef.current = Date.now();
    setMesas((prev) => {
      const actualizadas = prev.map((m) =>
        m.numero === numeroMesa
          ? { ...m, estado: 'libre', pedidoActual: null, updatedAt: Date.now() }
          : m
      );
      const hoyStr = obtenerFechaLocal();
      const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyStr, pedidosHistorial, actualizadas);
      setUltimoNumeroOrden(nuevoMax);
      return actualizadas;
    });
    setIsPedidoModalOpen(false);
    setIsCobroModalOpen(false);
    setMesaSeleccionada(null);
    mostrarNotificacion(`Mesa ${numeroMesa} liberada sin pedido`, 'info');
  };

  // Procesar cobro y guardar en Supabase y Firestore
  const confirmarCobro = async (datosCobro) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada || !pedidoActual) return;

    if (!pedidoActual.productos || pedidoActual.productos.length === 0) {
      mostrarNotificacion('No se puede cobrar un pedido sin productos', 'error');
      return;
    }

    const { 
      metodoPago = 'efectivo', 
      montoEfectivo = 0, 
      montoTransferencia = 0, 
      montoRecibido = 0, 
      cambio = 0, 
      comprobante = '', 
      banco = '', 
      notas,
      desglosePagos = [] 
    } = datosCobro;

    const fechaActual = new Date();

    const pedidoPagado = {
      ...pedidoActual,
      fecha: fechaActual.toISOString(),
      estado: 'pagado',
      metodoPago,
      notas: (notas !== undefined) ? notas : (pedidoActual.notas || ''),
      montoEfectivo: Number(montoEfectivo) || (metodoPago === 'efectivo' ? Number(pedidoActual.total) : 0),
      montoTransferencia: Number(montoTransferencia) || (metodoPago === 'transferencia' ? Number(pedidoActual.total) : 0),
      montoRecibido: Number(montoRecibido) || Number(pedidoActual.total),
      cambio: Number(cambio) || 0,
      comprobante: comprobante || '',
      banco: banco || '',
      desglosePagos: desglosePagos || [],
      total: Number(pedidoActual.total) || 0,
    };

    // 1. Guardar en Supabase
    try {
      await guardarPedidoEnSupabase(pedidoPagado);
    } catch (err) {
      console.warn('Aviso Supabase al cobrar pedido:', err);
    }

    // 2. Guardar en Firestore como réplica si está conectado
    if (db && isFirebaseConfigured()) {
      try {
        const pedidoDocRef = doc(db, 'pedidos', pedidoPagado.id);
        await setDoc(pedidoDocRef, {
          ...pedidoPagado,
          fecha: Timestamp.fromDate(fechaActual),
        });
      } catch (err) {
        console.warn('Error guardando en Firestore:', err);
      }
    }

    // 3. Guardar en estado local
    setPedidosHistorial((prev) => [pedidoPagado, ...prev]);

    // 4. Liberar la mesa o eliminar el cuadro si es a domicilio
    setMesas((prev) =>
      prev
        .filter((m) => {
          const esEstaMesa = m.numero === mesaSeleccionada || m.id === mesaSeleccionada;
          if (esEstaMesa && m.tipo === 'domicilio') {
            return false;
          }
          return true;
        })
        .map((m) =>
          m.numero === mesaSeleccionada || m.id === mesaSeleccionada
            ? { ...m, estado: 'libre', pedidoActual: null, updatedAt: Date.now() }
            : m
        )
    );

    // 5. Lanzar confeti de éxito
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#ffffff']
      });
    } catch {
      // Ignorar si falla confeti
    }

    // 6. Preparar ticket y cerrar modales de cobro
    setTicketPedido(pedidoPagado);
    setIsCobroModalOpen(false);
    setIsPedidoModalOpen(false);
    setMesaSeleccionada(null);
    setIsTicketModalOpen(true);

    mostrarNotificacion(`¡Pedido #${pedidoPagado.numeroOrden} cobrado y sincronizado en Supabase!`, 'success');
  };

  // Realizar cierre de caja diario
  const realizarCierreCaja = async (fechaFiltro = obtenerFechaLocal(), esAutomatico = false) => {
    lastLocalMutationTimestampRef.current = Date.now();
    // Filtrar pedidos de esa fecha usando la zona horaria local del cliente
    const pedidosDelDia = pedidosHistorial.filter((p) => {
      if (!p || p.estado === 'cancelado' || p.estado === 'config' || String(p.id).startsWith('SYS_')) return false;
      const fechaP = obtenerFechaLocal(p.fecha);
      return fechaP === fechaFiltro && p.estado === 'pagado';
    });

    if (pedidosDelDia.length === 0) {
      if (!esAutomatico) {
        mostrarNotificacion(`No hay pedidos registrados para la fecha ${fechaFiltro}`, 'error');
      }
      return null;
    }

    // Calcular métricas exactas considerando pagos mixtos y divididos
    let totalEfectivo = 0;
    let totalTransferencia = 0;
    const conteoProductos = {};

    pedidosDelDia.forEach((p) => {
      const tot = Number(p.total) || 0;
      
      if (p.metodoPago === 'efectivo') {
        totalEfectivo += tot;
      } else if (p.metodoPago === 'transferencia') {
        totalTransferencia += tot;
      } else if (p.metodoPago === 'mixto' || p.metodoPago === 'dividido') {
        totalEfectivo += Number(p.montoEfectivo) || 0;
        totalTransferencia += Number(p.montoTransferencia) || 0;
      } else {
        totalEfectivo += tot;
      }

      (p.productos || []).forEach((prod) => {
        const key = `${prod.nombre}${prod.variante ? ` (${prod.variante})` : ''}`;
        conteoProductos[key] = (conteoProductos[key] || 0) + (Number(prod.cantidad) || 1);
      });
    });

    const productosMasVendidos = Object.entries(conteoProductos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const totalGeneral = totalEfectivo + totalTransferencia;

    const cierre = {
      id: fechaFiltro,
      fecha: new Date().toISOString(),
      totalEfectivo: Number(totalEfectivo.toFixed(2)),
      totalTransferencia: Number(totalTransferencia.toFixed(2)),
      totalGeneral: Number(totalGeneral.toFixed(2)),
      numPedidos: pedidosDelDia.length,
      productosMasVendidos,
      esAutomatico: !!esAutomatico,
    };

    // 1. Guardar en Supabase
    try {
      await guardarCierreEnSupabase(cierre);
    } catch (err) {
      console.warn('Aviso guardando cierre en Supabase:', err);
    }

    // 2. Guardar en Firestore
    if (db && isFirebaseConfigured()) {
      try {
        const cierreDocRef = doc(db, 'cierres', fechaFiltro);
        await setDoc(cierreDocRef, {
          ...cierre,
          fecha: Timestamp.fromDate(new Date()),
        });
      } catch (err) {
        console.warn('Error guardando cierre en Firestore:', err);
      }
    }

    // 3. Actualizar historial local de cierres
    setCierresHistorial((prev) => {
      const sinExistente = prev.filter((c) => c.id !== fechaFiltro);
      return [cierre, ...sinExistente];
    });

    if (esAutomatico) {
      mostrarNotificacion(`⏰ Cierre (${fechaFiltro}) guardado`, 'info');
    } else {
      mostrarNotificacion(`Cierre de caja para ${fechaFiltro} guardado con éxito`, 'success');
    }
    return cierre;
  };

  // Eliminar un cierre de caja del historial
  const eliminarCierreHistorial = async (cierreId) => {
    lastLocalMutationTimestampRef.current = Date.now();
    try {
      await eliminarCierreEnSupabase(cierreId);
    } catch (e) {
      console.warn('Aviso borrando cierre en Supabase:', e);
    }

    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'cierres', cierreId));
      } catch (e) {
        console.warn('Aviso borrando cierre en Firestore:', e);
      }
    }

    setCierresHistorial((prev) => prev.filter((c) => c.id !== cierreId));
    mostrarNotificacion(`Cierre ${cierreId} eliminado`, 'info');
  };

  // Eliminar un pedido del historial (Supabase + Firestore + Local y recalcular consecutivo)
  const eliminarPedidoHistorial = async (pedidoId) => {
    lastLocalMutationTimestampRef.current = Date.now();
    // 1. Eliminar de Supabase
    try {
      await eliminarPedidoEnSupabase(pedidoId);
    } catch (e) {
      console.warn('Aviso borrando pedido en Supabase:', e);
    }

    // 2. Eliminar de Firestore si aplica
    if (db && isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'pedidos', pedidoId));
      } catch (e) {
        console.warn('Aviso borrando pedido en Firestore:', e);
      }
    }

    // 3. Eliminar de estado local y recalcular consecutivo
    setPedidosHistorial((prev) => {
      const actualizados = prev.filter((p) => p.id !== pedidoId);
      const hoyStr = obtenerFechaLocal();
      const nuevoMax = calcularUltimoNumeroOrdenDelDia(hoyStr, actualizados, mesas);
      setUltimoNumeroOrden(nuevoMax);
      return actualizados;
    });
    mostrarNotificacion('Pedido anulado y eliminado exitosamente', 'info');
  };

  /**
   * Reinicia completamente el sistema desde cero:
   * Limpia mesas activas, historial de comandas, cierres y reinicia el consecutivo de orden en 0.
   */
  const reiniciarTodoACero = async (limpiarNube = true) => {
    try {
      setSincronizando(true);
      
      // 1. Limpiar en Supabase si se solicita
      if (limpiarNube) {
        await limpiarBaseDatosSupabase();
      }

      // 2. Resetear estados en memoria
      const mesasLimpias = MESAS_INICIALES.map((m) => ({ ...m, pedidos: [], ocupada: false }));
      setMesas(mesasLimpias);
      setPedidosHistorial([]);
      setCierresHistorial([]);
      setUltimoNumeroOrden(0);
      setMesaSeleccionada(null);
      setIsPedidoModalOpen(false);
      setIsCobroModalOpen(false);
      setIsTicketModalOpen(false);

      // 3. Limpiar localStorage
      try {
        localStorage.removeItem('el_garaje_mesas_v2');
        localStorage.removeItem('el_garaje_pedidos_v2');
        localStorage.removeItem('el_garaje_cierres_v2');
        localStorage.removeItem('el_garaje_ultimo_orden_v2');
      } catch {
        // Silencioso
      }

      // 4. Notificar a otros clientes por BroadcastChannel y Realtime
      transmitirCambiosMesas(mesasLimpias, 0);

      mostrarNotificacion('Sistema reiniciado desde cero con éxito', 'success');
      return { success: true };
    } catch (err) {
      console.error('Error al reiniciar sistema a cero:', err);
      mostrarNotificacion('Error al reiniciar: ' + (err.message || err), 'error');
      return { success: false, error: err };
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <PedidoContext.Provider
      value={{
        mesas,
        mesaSeleccionada,
        mesaActual,
        pedidoActual,
        pedidosHistorial,
        cierresHistorial,
        ultimoNumeroOrden,
        fechaActualApp,
        isPedidoModalOpen,
        isCobroModalOpen,
        isTicketModalOpen,
        ticketPedido,
        isDatabaseModalOpen,
        isCierreModalOpen,
        isSupabaseConnected,
        isFirebaseConnected,
        sincronizando,
        notificacion,
        diaSeleccionado,
        setDiaSeleccionado,
        preciosMap,
        actualizarPrecioBaseProducto,
        restaurarPreciosBasePredeterminados,
        costosMap,
        actualizarCostoProducto,
        restaurarCostosPredeterminados,
        supabaseProjectName: SUPABASE_PROJECT_NAME,
        supabaseProjectId: SUPABASE_PROJECT_ID,
        supabaseUrl: SUPABASE_URL,
        setIsPedidoModalOpen,
        setIsCobroModalOpen,
        setIsTicketModalOpen,
        setTicketPedido,
        setIsDatabaseModalOpen,
        setIsCierreModalOpen,
        abrirMesa,
        setMesaSeleccionada,
        agregarProductoAPedido,
        cambiarCantidad,
        eliminarProducto,
        actualizarNotasItem,
        actualizarPrecioItem,
        actualizarNotasPedido,
        guardarComandaEnNube,
        cerrarModalPedido,
        agregarMesa,
        agregarDomicilio,
        eliminarMesa,
        liberarTodasLasMesas,
        cancelarPedidoMesa,
        confirmarCobro,
        realizarCierreCaja,
        eliminarCierreHistorial,
        sincronizarConSupabase,
        eliminarPedidoHistorial,
        reiniciarTodoACero,
        mostrarNotificacion,
      }}
    >
      {children}
    </PedidoContext.Provider>
  );
};

export const usePedidos = () => {
  const context = useContext(PedidoContext);
  if (!context) {
    throw new Error('usePedidos debe usarse dentro de un PedidoProvider');
  }
  return context;
};
