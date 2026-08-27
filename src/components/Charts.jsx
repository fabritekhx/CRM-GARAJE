import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { formatearDinero } from '../utils/helpers';

const COLORES_PAGO = {
  efectivo: '#10b981', // emerald-500
  transferencia: '#06b6d4', // cyan-500
};

const PALETA_PRODUCTOS = [
  '#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#3b82f6', '#14b8a6'
];

/**
 * Gráfico de Barras: Comparativa Efectivo vs Transferencia por Día
 */
export function GraficoBarrasVentas({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No hay datos para mostrar en este rango
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey={datos && datos[0] && datos[0].hora !== undefined ? 'hora' : 'fecha'} 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickFormatter={(val) => `$${val}`} 
            tickLine={false} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value) => [formatearDinero(value), '']}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="efectivo" name="Efectivo" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="transferencia" name="Transferencia" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de Pastel: Distribución Porcentual Efectivo vs Transferencia
 */
export function GraficoPastelMetodos({ datos }) {
  if (!datos || datos.length === 0 || (datos[0]?.value === 0 && datos[1]?.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Sin ventas en el período
      </div>
    );
  }

  return (
    <div className="h-72 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={datos}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {datos.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.name.toLowerCase().includes('efectivo') ? '#10b981' : '#06b6d4'} 
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value) => [formatearDinero(value), 'Total']}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico de Línea: Evolución de Ventas Totales Diarias
 */
export function GraficoLineaVentas({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No hay registros disponibles
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey={datos && datos[0] && datos[0].hora !== undefined ? 'hora' : 'fecha'} 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickFormatter={(val) => `$${val}`} 
            tickLine={false} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value) => [formatearDinero(value), 'Venta Total']}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Venta Total ($)"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ r: 4, fill: '#f59e0b' }}
            activeDot={{ r: 6, fill: '#ffffff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Gráfico Horizontal / Barras de Productos Más Vendidos
 */
export function GraficoTopProductos({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No hay datos de productos vendidos
      </div>
    );
  }

  const topDatos = datos.slice(0, 6);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={topDatos}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          <XAxis type="number" stroke="#94a3b8" fontSize={11} />
          <YAxis 
            dataKey="nombre" 
            type="category" 
            stroke="#94a3b8" 
            fontSize={10} 
            width={90}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value} unidades`, 'Cantidad']}
          />
          <Bar dataKey="cantidad" fill="#f59e0b" radius={[0, 4, 4, 0]}>
            {topDatos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETA_PRODUCTOS[index % PALETA_PRODUCTOS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
