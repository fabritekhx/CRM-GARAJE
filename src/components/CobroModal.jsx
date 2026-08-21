import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  FileCheck,
  Receipt,
  Users,
  Layers,
  Plus,
  Trash2,
  Sparkles,
  Split,
  Percent,
  Check
} from 'lucide-react';
import { usePedidos } from '../context/PedidoContext';
import { formatearDinero } from '../utils/helpers';

export default function CobroModal() {
  const { 
    mesaSeleccionada, 
    pedidoActual, 
    isCobroModalOpen, 
    setIsCobroModalOpen,
    confirmarCobro,
    mostrarNotificacion
  } = usePedidos();

  // Modo de cobro: 'efectivo' | 'transferencia' | 'mixto' | 'dividido'
  const [metodoPago, setMetodoPago] = useState('efectivo');

  // Estado para EFECTIVO
  const [montoRecibido, setMontoRecibido] = useState('');

  // Estado para TRANSFERENCIA
  const [banco, setBanco] = useState('');
  const [comprobante, setComprobante] = useState('');

  // Estado para PAGO COMBINADO / MIXTO (Efectivo + Transferencia)
  const [mixtoTransferencia, setMixtoTransferencia] = useState('');
  const [mixtoEfectivo, setMixtoEfectivo] = useState('');
  const [mixtoEfectivoEntregado, setMixtoEfectivoEntregado] = useState('');
  const [mixtoBanco, setMixtoBanco] = useState('DeUna');
  const [mixtoComprobante, setMixtoComprobante] = useState('');

  // Estado para CUENTAS SEPARADAS / PAGO DIVIDIDO
  const [tipoDivision, setTipoDivision] = useState('partes_iguales'); // 'partes_iguales' | 'montos_libres'
  const [numPersonas, setNumPersonas] = useState(2);
  const [pagosPersonas, setPagosPersonas] = useState([]);
  
  // Para montos libres en pago dividido
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState('');
  const [nuevoPagoMetodo, setNuevoPagoMetodo] = useState('efectivo');
  const [nuevoPagoBanco, setNuevoPagoBanco] = useState('DeUna');
  const [nuevoPagoNombre, setNuevoPagoNombre] = useState('');

  const [procesando, setProcesando] = useState(false);

  const total = Number(pedidoActual?.total) || 0;

  // Reiniciar estado al abrir modal
  useEffect(() => {
    if (isCobroModalOpen && total > 0) {
      setMetodoPago('efectivo');
      setMontoRecibido(total.toString());
      setBanco('');
      setComprobante('');

      // Inicializar mixto: mitad y mitad por defecto
      const mitad = (total / 2).toFixed(2);
      setMixtoTransferencia(mitad);
      setMixtoEfectivo((total - Number(mitad)).toFixed(2));
      setMixtoEfectivoEntregado((total - Number(mitad)).toFixed(2));
      setMixtoBanco('DeUna');
      setMixtoComprobante('');

      // Inicializar división en 2 personas
      setTipoDivision('partes_iguales');
      setNumPersonas(2);
      inicializarPersonasIguales(2, total);
      setNuevoPagoMonto('');
      setNuevoPagoNombre('');
    }
  }, [isCobroModalOpen, total]);

  // Función para inicializar comensales en partes iguales
  const inicializarPersonasIguales = (personas, montoTotal) => {
    const cant = Math.max(2, parseInt(personas, 10) || 2);
    const montoPorPersona = Number((montoTotal / cant).toFixed(2));
    
    const nuevas = [];
    let acumulado = 0;
    for (let i = 1; i <= cant; i++) {
      // Ajustar céntimos en la última persona
      const cuota = (i === cant) ? Number((montoTotal - acumulado).toFixed(2)) : montoPorPersona;
      acumulado += cuota;
      nuevas.push({
        id: `p_${i}`,
        persona: `Persona ${i}`,
        monto: cuota,
        metodo: 'efectivo',
        banco: 'DeUna',
        comprobante: '',
        montoEntregado: cuota,
        pagado: false,
      });
    }
    setPagosPersonas(nuevas);
  };

  if (!isCobroModalOpen || !pedidoActual) return null;

  // --- CÁLCULOS EFECTIVO SIMPLE ---
  const numMontoRecibido = parseFloat(montoRecibido) || 0;
  const cambioEfectivo = Math.max(0, numMontoRecibido - total);
  const esMontoInsuficienteEfectivo = metodoPago === 'efectivo' && numMontoRecibido < total;

  // --- CÁLCULOS PAGO MIXTO ---
  const numMixtoTransf = parseFloat(mixtoTransferencia) || 0;
  const numMixtoEfec = parseFloat(mixtoEfectivo) || 0;
  const sumaMixto = Number((numMixtoTransf + numMixtoEfec).toFixed(2));
  const diferenciaMixto = Number((total - sumaMixto).toFixed(2));
  const numMixtoEntregado = parseFloat(mixtoEfectivoEntregado) || numMixtoEfec;
  const cambioMixto = Math.max(0, numMixtoEntregado - numMixtoEfec);
  const esMixtoValido = Math.abs(diferenciaMixto) < 0.01 && numMixtoTransf >= 0 && numMixtoEfec >= 0;

  // Manejar cambio en monto de transferencia en mixto para autoajustar efectivo
  const handleCambioMixtoTransferencia = (val) => {
    setMixtoTransferencia(val);
    const n = parseFloat(val) || 0;
    const restante = Math.max(0, total - n);
    setMixtoEfectivo(restante.toFixed(2));
    setMixtoEfectivoEntregado(restante.toFixed(2));
  };

  const handleCambioMixtoEfectivo = (val) => {
    setMixtoEfectivo(val);
    const n = parseFloat(val) || 0;
    const restante = Math.max(0, total - n);
    setMixtoTransferencia(restante.toFixed(2));
    setMixtoEfectivoEntregado(val);
  };

  // --- CÁLCULOS PAGO DIVIDIDO ---
  const totalPagadoDividido = pagosPersonas.reduce((sum, p) => sum + (p.pagado ? Number(p.monto) || 0 : 0), 0);
  const saldoRestanteDividido = Math.max(0, Number((total - totalPagadoDividido).toFixed(2)));
  const todosPagados = pagosPersonas.length > 0 && pagosPersonas.every((p) => p.pagado) && saldoRestanteDividido === 0;

  // Marcar una persona como pagada o editar su método
  const togglePagoPersona = (index, metodoSeleccionado = null) => {
    setPagosPersonas((prev) => {
      const actualizados = [...prev];
      const item = { ...actualizados[index] };
      if (metodoSeleccionado) {
        item.metodo = metodoSeleccionado;
      }
      item.pagado = !item.pagado;
      actualizados[index] = item;
      return actualizados;
    });
  };

  const actualizarMetodoPersona = (index, nuevoMetodo) => {
    setPagosPersonas((prev) => {
      const actualizados = [...prev];
      actualizados[index] = {
        ...actualizados[index],
        metodo: nuevoMetodo,
      };
      return actualizados;
    });
  };

  // Agregar pago parcial libre
  const handleAgregarPagoLibre = () => {
    const monto = parseFloat(nuevoPagoMonto);
    if (!monto || monto <= 0) {
      mostrarNotificacion('Ingresa un monto válido', 'error');
      return;
    }

    if (monto > saldoRestanteDividido + 0.01) {
      mostrarNotificacion(`El monto no puede superar el saldo restante (${formatearDinero(saldoRestanteDividido)})`, 'error');
      return;
    }

    const nuevoItem = {
      id: `p_libre_${Date.now()}`,
      persona: nuevoPagoNombre.trim() || `Comensal ${pagosPersonas.length + 1}`,
      monto: Number(monto.toFixed(2)),
      metodo: nuevoPagoMetodo,
      banco: nuevoPagoBanco,
      comprobante: '',
      pagado: true,
    };

    setPagosPersonas((prev) => [...prev, nuevoItem]);
    setNuevoPagoMonto('');
    setNuevoPagoNombre('');
    mostrarNotificacion(`Pago de ${formatearDinero(monto)} registrado`, 'success');
  };

  const eliminarPagoLibre = (id) => {
    setPagosPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  // Botones sugeridos para efectivo
  const billetesSugeridos = [
    { label: 'Exacto', valor: total },
    { label: '$5', valor: 5 },
    { label: '$10', valor: 10 },
    { label: '$20', valor: 20 },
    { label: '$50', valor: 50 },
  ].filter((b) => b.valor >= total || b.label === 'Exacto');

  // Procesar y enviar el cobro
  const handleConfirmarCobro = async (e) => {
    if (e) e.preventDefault();

    let datosFinales = {};

    if (metodoPago === 'efectivo') {
      if (esMontoInsuficienteEfectivo) {
        mostrarNotificacion('El monto en efectivo es insuficiente para cubrir la cuenta', 'error');
        return;
      }
      datosFinales = {
        metodoPago: 'efectivo',
        montoEfectivo: total,
        montoTransferencia: 0,
        montoRecibido: numMontoRecibido,
        cambio: cambioEfectivo,
        banco: '',
        comprobante: '',
        desglosePagos: [
          { tipo: 'Efectivo', monto: total, entregado: numMontoRecibido, cambio: cambioEfectivo }
        ],
      };
    } else if (metodoPago === 'transferencia') {
      datosFinales = {
        metodoPago: 'transferencia',
        montoEfectivo: 0,
        montoTransferencia: total,
        montoRecibido: total,
        cambio: 0,
        banco: banco || 'DeUna / Banco',
        comprobante: comprobante || '',
        desglosePagos: [
          { tipo: 'Transferencia', banco: banco || 'DeUna', comprobante, monto: total }
        ],
      };
    } else if (metodoPago === 'mixto') {
      if (!esMixtoValido) {
        mostrarNotificacion('La suma de efectivo y transferencia debe ser igual al total', 'error');
        return;
      }
      datosFinales = {
        metodoPago: 'mixto',
        montoEfectivo: numMixtoEfec,
        montoTransferencia: numMixtoTransf,
        montoRecibido: numMixtoTransf + numMixtoEntregado,
        cambio: cambioMixto,
        banco: mixtoBanco || 'DeUna',
        comprobante: mixtoComprobante || '',
        desglosePagos: [
          { tipo: 'Transferencia', banco: mixtoBanco, comprobante: mixtoComprobante, monto: numMixtoTransf },
          { tipo: 'Efectivo', monto: numMixtoEfec, entregado: numMixtoEntregado, cambio: cambioMixto }
        ],
      };
    } else if (metodoPago === 'dividido') {
      if (!todosPagados && saldoRestanteDividido > 0.01) {
        mostrarNotificacion(`Aún falta cubrir ${formatearDinero(saldoRestanteDividido)} del total`, 'error');
        return;
      }

      // Calcular sumas de desglose
      let totEfec = 0;
      let totTransf = 0;
      const desglose = pagosPersonas.map((p) => {
        if (p.metodo === 'efectivo') {
          totEfec += Number(p.monto) || 0;
        } else {
          totTransf += Number(p.monto) || 0;
        }
        return {
          persona: p.persona,
          monto: Number(p.monto) || 0,
          metodo: p.metodo,
          banco: p.metodo === 'transferencia' ? (p.banco || 'DeUna') : '',
          comprobante: p.comprobante || '',
        };
      });

      datosFinales = {
        metodoPago: 'dividido',
        montoEfectivo: totEfec,
        montoTransferencia: totTransf,
        montoRecibido: total,
        cambio: 0,
        banco: totTransf > 0 ? 'Múltiple / Transferencias' : '',
        comprobante: '',
        desglosePagos: desglose,
      };
    }

    setProcesando(true);
    try {
      await confirmarCobro(datosFinales);
    } catch (err) {
      console.error('Error al confirmar cobro:', err);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header del Cobro */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <span>Cobrar Mesa {mesaSeleccionada}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-mono">
                  Orden #{pedidoActual.numeroOrden}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {pedidoActual.productos?.length || 0} platos y bebidas
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCobroModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Banner de Total a Pagar */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800 to-slate-800/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                Total de la Mesa
              </span>
              <p className="text-xs text-slate-400">Restaurante El Garaje</p>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
              {formatearDinero(total)}
            </div>
          </div>

          {/* Selector de Métodos de Pago (4 Opciones) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Forma de Pago del Cliente:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* 1. Solo Efectivo */}
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  metodoPago === 'efectivo'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span className="text-xs font-bold">Efectivo</span>
              </button>

              {/* 2. Solo Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  metodoPago === 'transferencia'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Transferencia</span>
              </button>

              {/* 3. Pago Combinado / Mixto */}
              <button
                type="button"
                onClick={() => setMetodoPago('mixto')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  metodoPago === 'mixto'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span className="text-xs font-bold">Combinado</span>
              </button>

              {/* 4. Dividir Cuenta / Por Separado */}
              <button
                type="button"
                onClick={() => setMetodoPago('dividido')}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  metodoPago === 'dividido'
                    ? 'bg-purple-500 text-white border-purple-400 font-bold shadow-lg shadow-purple-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold">Por Separado</span>
              </button>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* CASO 1: SOLO EFECTIVO */}
          {/* ========================================================================= */}
          {metodoPago === 'efectivo' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Botones de montos rápidos */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Atajos de Billetes:</span>
                <div className="flex flex-wrap gap-2">
                  {billetesSugeridos.map((billete) => (
                    <button
                      key={billete.label}
                      type="button"
                      onClick={() => setMontoRecibido(billete.valor.toString())}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                        parseFloat(montoRecibido) === billete.valor
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {billete.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de Monto Recibido */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Monto Recibido del Cliente ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 bg-slate-800 border rounded-xl text-xl font-bold font-mono text-white focus:outline-none transition-all ${
                      esMontoInsuficienteEfectivo
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Cálculo del Cambio / Vuelto */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                esMontoInsuficienteEfectivo
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {esMontoInsuficienteEfectivo ? 'Monto Insuficiente' : 'Cambio / Vuelto a Entregar:'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {esMontoInsuficienteEfectivo ? `Faltan ${formatearDinero(total - numMontoRecibido)}` : 'Entregar al cliente'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono">
                  {formatearDinero(cambioEfectivo)}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 2: SOLO TRANSFERENCIA */}
          {/* ========================================================================= */}
          {metodoPago === 'transferencia' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Banco / Billetera Digital:</span>
                </label>
                <select
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Seleccionar Billetera / Banco</option>
                  <option value="DeUna">DeUna! (Banco Pichincha)</option>
                  <option value="Banco Pichincha">Banco Pichincha</option>
                  <option value="Banco Guayaquil">Banco Guayaquil (Pei)</option>
                  <option value="Produbanco">Produbanco / Be</option>
                  <option value="Banco Bolivariano">Banco Bolivariano</option>
                  <option value="Cooperativa / Otro">Otra Cooperativa / Banco</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nº de Comprobante / Referencia (opcional):</span>
                </label>
                <input
                  type="text"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. REF-983742"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-xs text-cyan-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-cyan-400" />
                <span>Total a recibir por transferencia: <strong className="text-white font-mono">{formatearDinero(total)}</strong></span>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 3: PAGO COMBINADO / MIXTO (Efectivo + Transferencia) */}
          {/* ========================================================================= */}
          {metodoPago === 'mixto' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-200">
                Pagan una parte por <strong>Transferencia</strong> (ej. DeUna) y otra parte en <strong>Efectivo</strong>.
              </div>

              {/* Grid 2 columnas: Transferencia y Efectivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Parte 1: Transferencia */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between text-cyan-400 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      1. Monto Transferencia:
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={mixtoTransferencia}
                      onChange={(e) => handleCambioMixtoTransferencia(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-cyan-500"
                      placeholder="0.00"
                    />
                  </div>

                  <select
                    value={mixtoBanco}
                    onChange={(e) => setMixtoBanco(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="DeUna">DeUna! (Pichincha)</option>
                    <option value="Banco Pichincha">Banco Pichincha</option>
                    <option value="Banco Guayaquil">Banco Guayaquil</option>
                    <option value="Produbanco">Produbanco</option>
                    <option value="Otro">Otro Banco</option>
                  </select>

                  <input
                    type="text"
                    value={mixtoComprobante}
                    onChange={(e) => setMixtoComprobante(e.target.value)}
                    placeholder="Nº Comprobante (opcional)"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 font-mono"
                  />
                </div>

                {/* Parte 2: Efectivo */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      2. Monto Efectivo:
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={mixtoEfectivo}
                      onChange={(e) => handleCambioMixtoEfectivo(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Billete entregado para el efectivo:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mixtoEfectivoEntregado}
                        onChange={(e) => setMixtoEfectivoEntregado(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Ej. 20.00"
                      />
                    </div>
                  </div>

                  {/* Vuelto del efectivo en mixto */}
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
                    <span>Cambio / Vuelto:</span>
                    <strong className="font-mono text-sm">{formatearDinero(cambioMixto)}</strong>
                  </div>
                </div>

              </div>

              {/* Validación de suma total */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                esMixtoValido
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {esMixtoValido ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>
                    Suma combinada: <strong>{formatearDinero(sumaMixto)}</strong> de <strong>{formatearDinero(total)}</strong>
                  </span>
                </div>
                {!esMixtoValido && (
                  <span className="font-bold font-mono">
                    {diferenciaMixto > 0 ? `Faltan ${formatearDinero(diferenciaMixto)}` : `Excede ${formatearDinero(Math.abs(diferenciaMixto))}`}
                  </span>
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* CASO 4: CUENTAS SEPARADAS / PAGO DIVIDIDO */}
          {/* ========================================================================= */}
          {metodoPago === 'dividido' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Selector de Sub-Modalidad */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setTipoDivision('partes_iguales');
                    inicializarPersonasIguales(numPersonas, total);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDivision === 'partes_iguales'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Dividir en Partes Iguales</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoDivision('montos_libres');
                    setPagosPersonas([]);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    tipoDivision === 'montos_libres'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Cobros Libres / Por Consumo</span>
                </button>
              </div>

              {/* Sub-modalidad A: Partes Iguales */}
              {tipoDivision === 'partes_iguales' && (
                <div className="space-y-3">
                  
                  {/* Selector de número de comensales */}
                  <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                    <span className="text-xs font-semibold text-slate-300">
                      ¿Entre cuántas personas dividen?
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[2, 3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setNumPersonas(n);
                            inicializarPersonasIguales(n, total);
                          }}
                          className={`w-8 h-8 rounded-xl font-bold text-xs border transition-all ${
                            numPersonas === n
                              ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de comensales */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pagosPersonas.map((persona, idx) => (
                      <div
                        key={persona.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          persona.pagado
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-800/70 border-slate-700/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                            persona.pagado ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {persona.pagado ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {persona.persona}
                            </span>
                            <span className="text-sm font-mono font-black text-amber-400">
                              {formatearDinero(persona.monto)}
                            </span>
                          </div>
                        </div>

                        {/* Controles de método y cobro de la persona */}
                        <div className="flex items-center gap-2">
                          {!persona.pagado && (
                            <select
                              value={persona.metodo}
                              onChange={(e) => actualizarMetodoPersona(idx, e.target.value)}
                              className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                            >
                              <option value="efectivo">💵 Efectivo</option>
                              <option value="transferencia">💳 Transferencia / DeUna</option>
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => togglePagoPersona(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              persona.pagado
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                            }`}
                          >
                            {persona.pagado ? '✓ Pagado' : 'Marcar Cobrado'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Sub-modalidad B: Cobros Libres / Montos Parciales */}
              {tipoDivision === 'montos_libres' && (
                <div className="space-y-3">
                  
                  {/* Formulario para agregar cobro parcial */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Registrar Pago Parcial de un Comensal:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={nuevoPagoNombre}
                        onChange={(e) => setNuevoPagoNombre(e.target.value)}
                        placeholder="Nombre o Comensal (ej. Juan)"
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                      />

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={saldoRestanteDividido}
                          value={nuevoPagoMonto}
                          onChange={(e) => setNuevoPagoMonto(e.target.value)}
                          placeholder={`Monto (max ${saldoRestanteDividido.toFixed(2)})`}
                          className="w-full pl-6 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                        />
                      </div>

                      <select
                        value={nuevoPagoMetodo}
                        onChange={(e) => setNuevoPagoMetodo(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">💳 DeUna / Transferencia</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {saldoRestanteDividido > 0 && (
                        <button
                          type="button"
                          onClick={() => setNuevoPagoMonto(saldoRestanteDividido.toFixed(2))}
                          className="text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          Usar saldo restante completo ({formatearDinero(saldoRestanteDividido)})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAgregarPagoLibre}
                        disabled={!nuevoPagoMonto || parseFloat(nuevoPagoMonto) <= 0}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 ml-auto disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Pago</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de pagos parciales ya ingresados */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {pagosPersonas.map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white">{p.persona}</span>
                          <span className="text-slate-400">({p.metodo === 'efectivo' ? 'Efectivo' : 'Transferencia'})</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-amber-400">{formatearDinero(p.monto)}</span>
                          <button
                            type="button"
                            onClick={() => eliminarPagoLibre(p.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Barra de Resumen de Saldo en Pago Dividido */}
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Total Cubierto:</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatearDinero(totalPagadoDividido)} <span className="text-xs text-slate-500">/ {formatearDinero(total)}</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block">Saldo Restante:</span>
                  <span className={`text-base font-black font-mono ${saldoRestanteDividido === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatearDinero(saldoRestanteDividido)}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer / Botonera de Acción */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsCobroModalOpen(false)}
            className="w-1/3 py-3 px-4 rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
          >
            Atrás
          </button>

          <button
            type="button"
            onClick={handleConfirmarCobro}
            disabled={
              procesando || 
              (metodoPago === 'efectivo' && esMontoInsuficienteEfectivo) ||
              (metodoPago === 'mixto' && !esMixtoValido) ||
              (metodoPago === 'dividido' && saldoRestanteDividido > 0.01)
            }
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {procesando ? 'Guardando en Supabase...' : `Confirmar Pago (${formatearDinero(total)})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
