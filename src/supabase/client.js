import { createClient } from '@supabase/supabase-js';

// Datos oficiales del proyecto en Supabase (El Garaje Calacaleño)
export const SUPABASE_URL = 'https://eyzcuxspypnnwzzatnzs.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5emN1eHNweXBubnd6emF0bnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTc1NTAsImV4cCI6MjEwMjU3MzU1MH0.778WBgFOAQaaDLVj0t1A87zxjTzY5I9ai6f3wUMHZjk';
export const SUPABASE_PROJECT_ID = 'eyzcuxspypnnwzzatnzs';
export const SUPABASE_PROJECT_NAME = 'El garaje calacaleño';

// Clave en localStorage por si el usuario desea personalizar o actualizar
const STORAGE_SUPABASE_CONFIG = 'el_garaje_supabase_config_v1';

export const getSupabaseConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_SUPABASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    projectId: SUPABASE_PROJECT_ID,
    projectName: SUPABASE_PROJECT_NAME,
  };
};

const currentConfig = getSupabaseConfig();

export const supabase = createClient(currentConfig.url, currentConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Script SQL para crear las tablas en el SQL Editor de Supabase
 */
export const SUPABASE_SQL_SCHEMA = `-- Copia y pega este script en el SQL Editor de Supabase (https://supabase.com/dashboard/project/eyzcuxspypnnwzzatnzs/sql)

-- 1. Tabla de Pedidos / Comandas Cobradas
CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY,
    numero_orden INTEGER NOT NULL,
    mesa TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    total NUMERIC(10, 2) NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo', -- 'efectivo', 'transferencia', 'mixto', 'dividido'
    monto_efectivo NUMERIC(10, 2) DEFAULT 0,
    monto_transferencia NUMERIC(10, 2) DEFAULT 0,
    monto_recibido NUMERIC(10, 2) DEFAULT 0,
    cambio NUMERIC(10, 2) DEFAULT 0,
    banco TEXT DEFAULT '',
    comprobante TEXT DEFAULT '',
    notas TEXT DEFAULT '',
    estado TEXT DEFAULT 'pagado', -- 'activo' o 'pagado'
    desglose_pagos JSONB DEFAULT '[]'::jsonb,
    productos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Cierres Diarios de Caja
CREATE TABLE IF NOT EXISTS public.cierres (
    id TEXT PRIMARY KEY, -- Formato YYYY-MM-DD
    fecha TIMESTAMPTZ DEFAULT NOW(),
    num_pedidos INTEGER NOT NULL DEFAULT 0,
    total_general NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_efectivo NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_transferencia NUMERIC(10, 2) NOT NULL DEFAULT 0,
    productos_mas_vendidos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Estado de Mesas en Curso (Sincronización en tiempo real y multidispositivo)
CREATE TABLE IF NOT EXISTS public.mesas_activas (
    id TEXT PRIMARY KEY DEFAULT 'estado_actual',
    mesas JSONB NOT NULL DEFAULT '[]'::jsonb,
    ultimo_numero_orden INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS con acceso público (anon) para lectura y escritura desde el POS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cierres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas_activas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a pedidos para POS" ON public.pedidos
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir todo a cierres para POS" ON public.cierres
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir todo a mesas_activas para POS" ON public.mesas_activas
    FOR ALL
    USING (true)
    WITH CHECK (true);
`;

/**
 * Guarda el estado actual de las mesas abiertas y comandas en curso en Supabase
 * para sincronizar inmediatamente con otros navegadores y dispositivos.
 */
export const guardarMesasActivasEnSupabase = async (mesas, ultimoNumeroOrden = 0) => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    const payload = {
      id: 'estado_actual',
      mesas: mesas || [],
      ultimo_numero_orden: Number(ultimoNumeroOrden) || 0,
      updated_at: new Date().toISOString(),
    };

    // Intentar primero en la tabla dedicada 'mesas_activas'
    const { data, error } = await supabase
      .from('mesas_activas')
      .upsert(payload, { onConflict: 'id' });

    if (!error) {
      return { success: true, data };
    }

    // Fallback: Si 'mesas_activas' aún no se crea, guardar en 'pedidos' como registro de sistema
    const fallbackPayload = {
      id: 'SYS_MESAS_ESTADO_GLOBAL',
      numero_orden: Number(ultimoNumeroOrden) || 0,
      mesa: '0', // Usar string numérico '0' para compatibilidad tanto si 'mesa' es TEXT como INTEGER en Postgres
      fecha: new Date().toISOString(),
      total: 0,
      metodo_pago: 'sistema',
      monto_efectivo: 0,
      monto_transferencia: 0,
      monto_recibido: 0,
      cambio: 0,
      banco: '',
      comprobante: '',
      notas: 'ESTADO_GLOBAL_MESAS_EN_CURSO',
      estado: 'activo',
      desglose_pagos: [],
      productos: mesas || [],
    };

    const { error: fallbackError } = await supabase
      .from('pedidos')
      .upsert(fallbackPayload, { onConflict: 'id' });

    if (fallbackError) throw fallbackError;
    return { success: true };
  } catch (err) {
    console.warn('Supabase: aviso al sincronizar mesas activas en la nube:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Carga el estado de las mesas activas y pedidos en curso desde Supabase
 */
export const cargarMesasActivasDesdeSupabase = async () => {
  if (!supabase) return { success: false, mesas: null };

  try {
    // 1. Intentar cargar desde 'mesas_activas'
    const { data: dataMesas, error: errorMesas } = await supabase
      .from('mesas_activas')
      .select('*')
      .eq('id', 'estado_actual')
      .maybeSingle();

    if (!errorMesas && dataMesas && Array.isArray(dataMesas.mesas) && dataMesas.mesas.length > 0) {
      return {
        success: true,
        mesas: dataMesas.mesas,
        ultimoNumeroOrden: Number(dataMesas.ultimo_numero_orden) || 0,
        updatedAt: dataMesas.updated_at ? new Date(dataMesas.updated_at).getTime() : Date.now(),
      };
    }

    // 2. Intentar fallback desde 'pedidos' con id 'SYS_MESAS_ESTADO_GLOBAL'
    const { data: dataFallback, error: errorFallback } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', 'SYS_MESAS_ESTADO_GLOBAL')
      .maybeSingle();

    if (!errorFallback && dataFallback && Array.isArray(dataFallback.productos) && dataFallback.productos.length > 0) {
      return {
        success: true,
        mesas: dataFallback.productos,
        ultimoNumeroOrden: Number(dataFallback.numero_orden) || 0,
        updatedAt: dataFallback.fecha ? new Date(dataFallback.fecha).getTime() : Date.now(),
      };
    }

    return { success: false, mesas: null };
  } catch (err) {
    console.warn('Supabase: aviso al cargar mesas activas (se usará local):', err.message || err);
    return { success: false, mesas: null, error: err.message || err };
  }
};

/**
 * Guarda un pedido en la tabla 'pedidos' de Supabase
 */
export const guardarPedidoEnSupabase = async (pedido) => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    const payload = {
      id: pedido.id,
      numero_orden: pedido.numeroOrden,
      mesa: pedido.mesa,
      fecha: pedido.fecha ? new Date(pedido.fecha).toISOString() : new Date().toISOString(),
      total: Number(pedido.total) || 0,
      metodo_pago: pedido.metodoPago || 'efectivo',
      monto_efectivo: Number(pedido.montoEfectivo) || (pedido.metodoPago === 'efectivo' ? Number(pedido.total) : 0),
      monto_transferencia: Number(pedido.montoTransferencia) || (pedido.metodoPago === 'transferencia' ? Number(pedido.total) : 0),
      monto_recibido: Number(pedido.montoRecibido) || Number(pedido.total) || 0,
      cambio: Number(pedido.cambio) || 0,
      banco: pedido.banco || '',
      comprobante: pedido.comprobante || '',
      notas: pedido.notas || '',
      estado: pedido.estado || 'pagado',
      desglose_pagos: pedido.desglosePagos || [],
      productos: pedido.productos || [],
    };

    const { data, error } = await supabase
      .from('pedidos')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase: aviso al guardar pedido en tabla (se mantiene en memoria local):', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Elimina un pedido de la base de datos de Supabase
 */
export const eliminarPedidoEnSupabase = async (pedidoId) => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('Supabase: aviso al eliminar pedido:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Guarda un cierre de caja en Supabase
 */
export const guardarCierreEnSupabase = async (cierre) => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    const payload = {
      id: cierre.id,
      fecha: cierre.fecha ? new Date(cierre.fecha).toISOString() : new Date().toISOString(),
      num_pedidos: Number(cierre.numPedidos) || 0,
      total_general: Number(cierre.totalGeneral) || 0,
      total_efectivo: Number(cierre.totalEfectivo) || 0,
      total_transferencia: Number(cierre.totalTransferencia) || 0,
      productos_mas_vendidos: cierre.productosMasVendidos || [],
    };

    const { data, error } = await supabase
      .from('cierres')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('Supabase: aviso al guardar cierre en tabla:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Carga todos los pedidos desde Supabase
 */
export const cargarPedidosDesdeSupabase = async () => {
  if (!supabase) return { success: false, data: [] };

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .not('id', 'like', 'SYS_%')
      .neq('estado', 'config')
      .order('numero_orden', { ascending: false });

    if (error) throw error;

    // Mapear campos de snake_case a camelCase para la app y filtrar filas de sistema
    const pedidosMapeados = (data || [])
      .filter((row) => row && !String(row.id).startsWith('SYS_') && row.estado !== 'config')
      .map((row) => ({
        id: row.id,
        numeroOrden: row.numero_orden,
        mesa: row.mesa,
        fecha: row.fecha,
        total: Number(row.total) || 0,
        metodoPago: row.metodo_pago,
        montoEfectivo: Number(row.monto_efectivo) || 0,
        montoTransferencia: Number(row.monto_transferencia) || 0,
        montoRecibido: Number(row.monto_recibido) || 0,
        cambio: Number(row.cambio) || 0,
        banco: row.banco,
        comprobante: row.comprobante,
        notas: row.notas,
        estado: row.estado,
        desglosePagos: Array.isArray(row.desglose_pagos) ? row.desglose_pagos : [],
        productos: Array.isArray(row.productos) ? row.productos : [],
      }));

    return { success: true, data: pedidosMapeados };
  } catch (err) {
    console.warn('Supabase: no se pudo cargar pedidos desde la nube (usando local):', err.message || err);
    return { success: false, error: err.message || err, data: [] };
  }
};

/**
 * Carga los cierres desde Supabase
 */
export const cargarCierresDesdeSupabase = async () => {
  if (!supabase) return { success: false, data: [] };

  try {
    const { data, error } = await supabase
      .from('cierres')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    const cierresMapeados = (data || []).map((row) => ({
      id: row.id,
      fecha: row.fecha,
      numPedidos: Number(row.num_pedidos) || 0,
      totalGeneral: Number(row.total_general) || 0,
      totalEfectivo: Number(row.total_efectivo) || 0,
      totalTransferencia: Number(row.total_transferencia) || 0,
      productosMasVendidos: row.productos_mas_vendidos || [],
    }));

    return { success: true, data: cierresMapeados };
  } catch (err) {
    console.warn('Supabase: no se pudo cargar cierres desde la nube (usando local):', err.message || err);
    return { success: false, error: err.message || err, data: [] };
  }
};

/**
 * Verifica la conexión con el endpoint de Supabase
 */
export const probarConexionSupabase = async () => {
  try {
    const { error } = await supabase.from('pedidos').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Si la tabla no existe (42P01 en postgres o mensaje relation doesn't exist), la conexión responde pero la tabla aún no se crea
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return { 
          conectado: true, 
          tablaPendiente: true, 
          mensaje: 'Conectado a Supabase. Las tablas aún no están creadas en tu proyecto.' 
        };
      }
      return { conectado: false, mensaje: error.message };
    }
    return { conectado: true, tablaPendiente: false, mensaje: 'Conexión exitosa a Supabase y tablas listas' };
  } catch (e) {
    return { conectado: false, mensaje: e.message || 'No se pudo conectar a Supabase' };
  }
};

/**
 * Guarda la configuración de precios y costos personalizados en Supabase
 */
export const guardarConfiguracionPreciosYCostosEnSupabase = async (preciosMap, costosMap) => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    const payload = {
      id: 'SYS_CONFIG_PRECIOS_Y_COSTOS',
      numero_orden: 0,
      mesa: '0',
      fecha: new Date().toISOString(),
      total: 0,
      metodo_pago: 'sistema',
      monto_efectivo: 0,
      monto_transferencia: 0,
      monto_recibido: 0,
      cambio: 0,
      banco: '',
      comprobante: '',
      notas: 'CONFIG_PRECIOS_Y_COSTOS_PERSONALIZADOS',
      estado: 'config',
      desglose_pagos: [],
      productos: {
        precios: preciosMap || {},
        costos: costosMap || {},
      },
    };

    const { error } = await supabase
      .from('pedidos')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn('Supabase: no se pudo guardar config de precios/costos en nube:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Carga la configuración de precios y costos personalizados desde Supabase
 */
export const cargarConfiguracionPreciosYCostosDesdeSupabase = async () => {
  if (!supabase) return { success: false, data: null };

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', 'SYS_CONFIG_PRECIOS_Y_COSTOS')
      .maybeSingle();

    if (!error && data && data.productos) {
      return {
        success: true,
        precios: data.productos.precios || null,
        costos: data.productos.costos || null,
      };
    }
    return { success: false, data: null };
  } catch (err) {
    console.warn('Supabase: aviso al cargar config de precios/costos remotos:', err.message || err);
    return { success: false, error: err.message || err };
  }
};

/**
 * Limpia todas las tablas en Supabase para reiniciar el sistema desde cero
 */
export const limpiarBaseDatosSupabase = async () => {
  if (!supabase) return { success: false, error: 'Supabase no inicializado' };

  try {
    // 1. Eliminar todos los pedidos
    await supabase.from('pedidos').delete().neq('id', 'SYS_VACIO_INEXISTENTE');
    
    // 2. Eliminar todos los cierres
    await supabase.from('cierres').delete().neq('id', 'SYS_VACIO_INEXISTENTE');
    
    // 3. Resetear mesas activas
    await supabase.from('mesas_activas').upsert({
      id: 'estado_actual',
      mesas: [],
      ultimo_numero_orden: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return { success: true };
  } catch (err) {
    console.warn('Error al limpiar Supabase:', err);
    return { success: false, error: err.message || err };
  }
};
