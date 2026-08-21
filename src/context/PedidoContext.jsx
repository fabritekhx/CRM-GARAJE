/**
 * Contexto global de Pedidos, Mesas, Supabase y Firestore para El Garaje POS
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Estado inicial de las 6 mesas
const MESAS_INICIALES = [
  { id: 1, numero: 1, estado: 'libre', pedidoActual: null },
  { id: 2, numero: 2, estado: 'libre', pedidoActual: null },
  { id: 3, numero: 3, estado: 'libre', pedidoActual: null },
  { id: 4, numero: 4, estado: 'libre', pedidoActual: null },
  { id: 5, numero: 5, estado: 'libre', pedidoActual: null },
  { id: 6, numero: 6, estado: 'libre', pedidoActual: null },
];

export const PedidoProvider = ({ children }) => {
  // Estado de las 6 mesas
  const [mesas, setMesas] = useState(() => {
    try {
      const guardadas = localStorage.getItem(STORAGE_MESAS);
      return guardadas ? JSON.parse(guardadas) : MESAS_INICIALES;
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

  // Cargar datos de Supabase al iniciar o sincronizar
  const sincronizarConSupabase = useCallback(async (mostrarMensaje = true) => {
    setSincronizando(true);
    try {
      // 1. Probar conexión
      const test = await probarConexionSupabase();
      setIsSupabaseConnected(test.conectado);

      // 2. Cargar pedidos desde Supabase
      const resPedidos = await cargarPedidosDesdeSupabase();
      if (resPedidos.success && resPedidos.data.length > 0) {
        setPedidosHistorial(resPedidos.data);
        const maxOrden = Math.max(...resPedidos.data.map((p) => p.numeroOrden || 0), 100);
        setUltimoNumeroOrden(maxOrden);
      }

      // 3. Cargar cierres desde Supabase
      const resCierres = await cargarCierresDesdeSupabase();
      if (resCierres.success && resCierres.data.length > 0) {
        setCierresHistorial(resCierres.data);
      }

      // 4. Cargar de Firestore si está configurado como backup
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
        mostrarNotificacion('Conexión con Supabase ("El Garaje Calacaleño") sincronizada', 'success');
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      if (mostrarMensaje) {
        mostrarNotificacion('Trabajando en modo local (los datos se guardan en el navegador y se sincronizarán)', 'info');
      }
    } finally {
      setSincronizando(false);
    }
  }, [mostrarNotificacion]);

  useEffect(() => {
    sincronizarConSupabase(false);
  }, [sincronizarConSupabase]);

  // Abrir mesa para ver o crear pedido
  const abrirMesa = (numeroMesa) => {
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

  // Cancelar/Vaciar pedido de una mesa
  const cancelarPedidoMesa = (numeroMesa) => {
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
      desglosePagos = [] 
    } = datosCobro;

    const fechaActual = new Date();

    const pedidoPagado = {
      ...pedidoActual,
      fecha: fechaActual.toISOString(),
      estado: 'pagado',
      metodoPago,
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

    // 4. Liberar la mesa
    setMesas((prev) =>
      prev.map((m) =>
        m.numero === mesaSeleccionada
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

    mostrarNotificacion(`¡Pedido #${pedidoPagado.numeroOrden} cobrado y guardado en Supabase!`, 'success');
  };

  // Realizar cierre de caja diario
  const realizarCierreCaja = async (fechaFiltro = new Date().toISOString().split('T')[0]) => {
    // Filtrar pedidos de esa fecha
    const pedidosDelDia = pedidosHistorial.filter((p) => {
      const fechaP = typeof p.fecha === 'string' ? p.fecha.split('T')[0] : new Date(p.fecha).toISOString().split('T')[0];
      return fechaP === fechaFiltro && p.estado === 'pagado';
    });

    if (pedidosDelDia.length === 0) {
      mostrarNotificacion(`No hay pedidos registrados para la fecha ${fechaFiltro}`, 'error');
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

    mostrarNotificacion(`Cierre de caja para ${fechaFiltro} guardado en Supabase`, 'success');
    return cierre;
  };

  // Eliminar un pedido del historial (Supabase + Firestore + Local)
  const eliminarPedidoHistorial = async (pedidoId) => {
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
