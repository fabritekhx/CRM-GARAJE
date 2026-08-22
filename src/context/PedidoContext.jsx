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
  cargarPedidosDesdeSupabase, 
  cargarCierresDesdeSupabase,
  guardarMesasActivasEnSupabase,
  cargarMesasActivasDesdeSupabase,
  probarConexionSupabase,
  SUPABASE_PROJECT_NAME,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL
} from '../supabase/client';
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
      return guardados ? JSON.parse(guardados) : [];
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

  // Consecutivo de orden
  const [ultimoNumeroOrden, setUltimoNumeroOrden] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_NUMERO_ORDEN);
      return guardado ? parseInt(guardado, 10) : 100;
    } catch {
      return 100;
    }
  });

  // Modales y control de UI
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [diaSeleccionado, setDiaSeleccionadoState] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_DIA);
      if (guardado) return guardado;
      const diaNum = new Date().getDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado
      if (diaNum === 5) return 'viernes';
      if (diaNum === 6) return 'sabado';
      if (diaNum === 0) return 'domingo';
      return 'viernes';
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

  // Referencias para evitar loops infinitos de actualización en tiempo real
  const isRemoteSyncRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const supabaseChannelRef = useRef(null);
  const lastLocalMutationTimestampRef = useRef(0);
  const autoCierreEjecutadoRef = useRef(new Set());

  // Fecha actual observada por la app (se actualiza automáticamente a medianoche 00:00:00)
  const [fechaActualApp, setFechaActualApp] = useState(() => new Date().toISOString().split('T')[0]);

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
    // 1. Enviar por canal local de pestañas
    if (localBroadcastChannel) {
      try {
        localBroadcastChannel.postMessage({
          tipo: 'SYNC_MESAS',
          mesas: nuevasMesas,
          ultimoNumeroOrden: numOrden,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn('Error en broadcast local:', e);
      }
    }

    // 2. Enviar por Supabase Realtime Channel a otros navegadores/dispositivos
    if (supabaseChannelRef.current) {
      try {
        const payloadData = {
          type: 'broadcast',
          event: 'mesas_actualizadas',
          payload: {
            mesas: nuevasMesas,
            ultimoNumeroOrden: numOrden,
            timestamp: Date.now()
          }
        };

        // En versiones recientes de @supabase/supabase-js, si el canal no está en estado 'joined'
        // o si se requiere envío HTTP confiable, se usa httpSend() para evitar el warning de deprecación de send()
        if (typeof supabaseChannelRef.current.httpSend === 'function') {
          supabaseChannelRef.current.httpSend(payloadData).catch(() => {});
        } else if (typeof supabaseChannelRef.current.send === 'function') {
          // Si el estado es 'joined' / 'SUBSCRIBED', send() va por websocket sin warning; de lo contrario httpSend si existe
          supabaseChannelRef.current.send(payloadData);
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
    transmitirCambiosMesas(mesas, ultimoNumeroOrden);
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
      if (resMesas.success && Array.isArray(resMesas.mesas) && resMesas.mesas.length > 0) {
        isRemoteSyncRef.current = true;
        setMesas(resMesas.mesas);
        if (resMesas.ultimoNumeroOrden) {
          setUltimoNumeroOrden((prev) => Math.max(prev, resMesas.ultimoNumeroOrden));
        }
      }

      // 3. Cargar pedidos cobrados desde Supabase
      const resPedidos = await cargarPedidosDesdeSupabase();
      if (resPedidos.success && resPedidos.data.length > 0) {
        setPedidosHistorial(resPedidos.data);
        const maxOrden = Math.max(...resPedidos.data.map((p) => p.numeroOrden || 0), 100);
        setUltimoNumeroOrden((prev) => Math.max(prev, maxOrden));
      }

      // 4. Cargar cierres desde Supabase
      const resCierres = await cargarCierresDesdeSupabase();
      if (resCierres.success && resCierres.data.length > 0) {
        setCierresHistorial(resCierres.data);
      }

      // 5. Cargar de Firestore si está configurado como backup
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
      setSincronizando(false);
    }
  }, [mostrarNotificacion]);

  // Configurar listeners en tiempo real y ciclo de sincronización automática continua
  useEffect(() => {
    // 1. Carga inicial
    sincronizarConSupabase(false);

    // 2. Suscripción Supabase Realtime Broadcast para sincronización instantánea entre navegadores
    if (supabase) {
      try {
        const channel = supabase.channel('el-garaje-pos-mesas-realtime', {
          config: { broadcast: { self: false, ack: true } }
        });

        channel.on('broadcast', { event: 'mesas_actualizadas' }, (event) => {
          const payload = event?.payload;
          if (payload && Array.isArray(payload.mesas)) {
            isRemoteSyncRef.current = true;
            setMesas(payload.mesas);
            if (payload.ultimoNumeroOrden) {
              setUltimoNumeroOrden((prev) => Math.max(prev, payload.ultimoNumeroOrden));
            }
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
        if (event.data?.tipo === 'SYNC_MESAS' && Array.isArray(event.data.mesas)) {
          // Si el usuario acaba de interactuar localmente, ignorar para evitar parpadeos o carreras
          if (Date.now() - lastLocalMutationTimestampRef.current < 3500) {
            return;
          }
          isRemoteSyncRef.current = true;
          setMesas(event.data.mesas);
          if (event.data.ultimoNumeroOrden) {
            setUltimoNumeroOrden((prev) => Math.max(prev, event.data.ultimoNumeroOrden));
          }
        }
      };
    }

    // 4. Listener cuando el usuario cambia de ventana o regresa a la pestaña (Visibility / Focus)
    const handleFocus = () => {
      if (Date.now() - lastLocalMutationTimestampRef.current < 3500) {
        return;
      }
      cargarMesasActivasDesdeSupabase().then((res) => {
        if (res.success && Array.isArray(res.mesas) && res.mesas.length > 0) {
          setMesas((current) => {
            if (JSON.stringify(current) !== JSON.stringify(res.mesas)) {
              isRemoteSyncRef.current = true;
              return res.mesas;
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
      // Si hubo mutación local reciente, no pisar el estado con polling
      if (Date.now() - lastLocalMutationTimestampRef.current < 3500) {
        return;
      }
      try {
        const res = await cargarMesasActivasDesdeSupabase();
        if (res.success && Array.isArray(res.mesas) && res.mesas.length > 0) {
          setMesas((current) => {
            const currentStr = JSON.stringify(current);
            const remoteStr = JSON.stringify(res.mesas);
            if (currentStr !== remoteStr) {
              isRemoteSyncRef.current = true;
              return res.mesas;
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
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
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
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollingMesasInterval);
      clearInterval(pollingPedidosInterval);
      if (supabaseChannelRef.current) {
        supabase.removeChannel(supabaseChannelRef.current);
      }
    };
  }, [sincronizarConSupabase]);

  // Scheduler de Cierre Automático a las 23:59:59 y detección de cambio de día a las 00:00:00
  useEffect(() => {
    const verificarYEjecutarAutoCierre = async () => {
      const ahora = new Date();
      const hora = ahora.getHours();
      const minutos = ahora.getMinutes();
      const segundos = ahora.getSeconds();
      const hoyStr = ahora.toISOString().split('T')[0];

      // 1. Detección de cambio de día (00:00:00) para reiniciar la vista activa
      setFechaActualApp((fechaAnterior) => {
        if (fechaAnterior !== hoyStr) {
          // Si el día anterior no fue cerrado y tenía pedidos, guardarlo en el historial
          const pedidosDiaAnterior = pedidosHistorial.filter((p) => {
            const f = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
            return f === fechaAnterior && p.estado === 'pagado';
          });
          const yaCerrado = cierresHistorial.some((c) => c.id === fechaAnterior);
          if (pedidosDiaAnterior.length > 0 && !yaCerrado && !autoCierreEjecutadoRef.current.has(fechaAnterior)) {
            autoCierreEjecutadoRef.current.add(fechaAnterior);
            realizarCierreCaja(fechaAnterior, true);
          }
          return hoyStr;
        }
        return fechaAnterior;
      });

      // 2. Ejecutar cierre automático a las 23:59:59 (entre segundo 50 y 59)
      if (hora === 23 && minutos === 59 && segundos >= 50) {
        if (!autoCierreEjecutadoRef.current.has(hoyStr)) {
          const pedidosHoy = pedidosHistorial.filter((p) => {
            const f = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : '';
            return f === hoyStr && p.estado === 'pagado';
          });
          const yaCerrado = cierresHistorial.some((c) => c.id === hoyStr);
          if (pedidosHoy.length > 0 && !yaCerrado) {
            autoCierreEjecutadoRef.current.add(hoyStr);
            console.log(`[Auto-Cierre 23:59:59] Guardando cierre automático para ${hoyStr}...`);
            await realizarCierreCaja(hoyStr, true);
          }
        }
      }
    };

    const intervalId = setInterval(verificarYEjecutarAutoCierre, 10000);
    // Ejecución inicial al montar
    verificarYEjecutarAutoCierre();

    return () => clearInterval(intervalId);
  }, [pedidosHistorial, cierresHistorial]);

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
      // Crear borrador de pedido
      const nuevoNumOrden = ultimoNumeroOrden + 1;
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
            ? { ...m, estado: 'ocupada', pedidoActual: nuevoPedido }
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

        const precioFinal = precioPersonalizado !== null ? Number(precioPersonalizado) : Number(producto.precioBase);
        const varianteStr = variante || '';

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
          pedidoActual: {
            ...pedido,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );

    mostrarNotificacion(`Agregado: ${producto.nombre} ${variante ? `(${variante})` : ''} - $${(precioPersonalizado !== null ? Number(precioPersonalizado) : Number(producto.precioBase)).toFixed(2)}`, 'success');
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
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
          },
        };
      })
    );
  };

  // Actualizar precio de un ítem individual
  const actualizarPrecioItem = (itemIndex, nuevoPrecio) => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (!mesaSeleccionada) return;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.numero !== mesaSeleccionada || !m.pedidoActual) return m;

        const nuevosProductos = [...m.pedidoActual.productos];
        if (nuevosProductos[itemIndex]) {
          const precioNum = Math.max(0, parseFloat(nuevoPrecio) || 0);
          nuevosProductos[itemIndex] = {
            ...nuevosProductos[itemIndex],
            precioUnitario: precioNum,
          };
        }

        const totalActualizado = calcularTotal(nuevosProductos);

        return {
          ...m,
          pedidoActual: {
            ...m.pedidoActual,
            productos: nuevosProductos,
            total: totalActualizado,
          },
        };
      })
    );
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
          pedidoActual: {
            ...m.pedidoActual,
            notas,
          },
        };
      })
    );
  };

  // Cerrar modal de pedido y liberar mesa automáticamente si no tiene ítems
  const cerrarModalPedido = () => {
    lastLocalMutationTimestampRef.current = Date.now();
    if (mesaSeleccionada) {
      setMesas((prev) =>
        prev.map((m) => {
          if (m.numero === mesaSeleccionada) {
            if (!m.pedidoActual?.productos || m.pedidoActual.productos.length === 0) {
              return { ...m, estado: 'libre', pedidoActual: null };
            }
          }
          return m;
        })
      );
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
    const nuevoNumOrden = ultimoNumeroOrden + 1;

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
    };

    setUltimoNumeroOrden(nuevoNumOrden);
    setMesas((prev) => [...prev, nuevoDomicilio]);
    setMesaSeleccionada(identificador);
    setIsPedidoModalOpen(true);
    mostrarNotificacion(`Pedido ${nombre} creado. Añade los platos del comensal`, 'success');
    return nuevoDomicilio;
  };

  // Eliminar una mesa o cuadro de domicilio
  const eliminarMesa = (idONumero) => {
    lastLocalMutationTimestampRef.current = Date.now();
    setMesas((prev) =>
      prev.filter((m) => m.id !== idONumero && m.numero !== idONumero)
    );
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
    setMesas(MESAS_INICIALES);
    localStorage.setItem(STORAGE_MESAS, JSON.stringify(MESAS_INICIALES));
    setIsPedidoModalOpen(false);
    setIsCobroModalOpen(false);
    setMesaSeleccionada(null);
    mostrarNotificacion('Todas las mesas han sido liberadas y están vacías', 'info');
  };

  // Cancelar/Vaciar pedido de una mesa
  const cancelarPedidoMesa = (numeroMesa) => {
    lastLocalMutationTimestampRef.current = Date.now();
    setMesas((prev) =>
      prev.map((m) =>
        m.numero === numeroMesa
          ? { ...m, estado: 'libre', pedidoActual: null }
          : m
      )
    );
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
            ? { ...m, estado: 'libre', pedidoActual: null }
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
  const realizarCierreCaja = async (fechaFiltro = new Date().toISOString().split('T')[0], esAutomatico = false) => {
    lastLocalMutationTimestampRef.current = Date.now();
    // Filtrar pedidos de esa fecha
    const pedidosDelDia = pedidosHistorial.filter((p) => {
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : new Date(p.fecha).toISOString().split('T')[0];
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
      mostrarNotificacion(`⏰ Cierre automático a las 23:59:59 (${fechaFiltro}) guardado en la nube`, 'info');
    } else {
      mostrarNotificacion(`Cierre de caja para ${fechaFiltro} guardado en Supabase`, 'success');
    }
    return cierre;
  };

  // Eliminar un pedido del historial (Supabase + Firestore + Local)
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

    // 3. Eliminar de estado local
    setPedidosHistorial((prev) => prev.filter((p) => p.id !== pedidoId));
    mostrarNotificacion('Pedido anulado y eliminado de Supabase exitosamente', 'info');
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
        sincronizarConSupabase,
        eliminarPedidoHistorial,
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
