import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { LogEntry } from "../types";
import { Activity, Flame, Radio } from "lucide-react";

interface TelemetryChartProps {
  logs: LogEntry[];
}

export default function TelemetryChart({ logs }: TelemetryChartProps) {
  // Filtrar solo registros de tipo RECEPTOR que tengan una resonancia válida
  const receptorLogs = logs
    .filter((log) => log.type === "RECEPTOR")
    .slice(0, 10); // Tomar las últimas 10

  // Invertir el orden para graficar cronológicamente (izquierda = más antiguo, derecha = más reciente)
  const chartData = [...receptorLogs].reverse().map((log) => {
    const timeLabel = new Date(log.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return {
      id: log.id,
      time: timeLabel,
      resonancia: log.resonance,
      dimension: log.dimension,
      entidad: log.entity,
      frecuencia: log.frequency,
    };
  });

  const hasData = chartData.length > 0;

  // Custom Tooltip component for cybernetic aesthetic
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-emerald-500/40 p-3 rounded-lg shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1 text-slate-300 max-w-xs">
          <p className="text-emerald-400 font-bold border-b border-emerald-950 pb-1 flex items-center gap-1.5 uppercase">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Portadora Detectada
          </p>
          <p>
            <span className="text-slate-500">Tiempo:</span> <span className="text-slate-100 font-semibold">{data.time}</span>
          </p>
          <p>
            <span className="text-slate-500">Frecuencia:</span>{" "}
            <span className="text-emerald-300 font-bold">{data.frecuencia}</span>
          </p>
          <p>
            <span className="text-slate-500">Dimensión:</span>{" "}
            <span className="text-blue-400">{data.dimension}</span>
          </p>
          <p>
            <span className="text-slate-500">Entidad:</span>{" "}
            <span className="text-amber-400">{data.entidad}</span>
          </p>
          <p className="pt-1 flex justify-between items-center bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-900 mt-1">
            <span className="text-slate-500">Resonancia:</span>
            <span className="text-emerald-400 font-extrabold text-xs">{data.resonancia}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="telemetry-chart-container" className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 space-y-3 shadow-md relative overflow-hidden">
      {/* Decors */}
      <div className="absolute right-3 top-3 opacity-[0.03] pointer-events-none">
        <Activity className="w-32 h-32 text-emerald-400" />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-slate-900 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Historial de Resonancia Temporal
          </h3>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 bg-slate-900/40 px-2 py-0.5 rounded border border-slate-850">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          Muestras: {chartData.length} / 10
        </div>
      </div>

      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-900 rounded-lg">
          <Flame className="w-6 h-6 text-slate-800 mb-2" />
          <p className="text-[11px] font-mono text-slate-500 max-w-xs leading-relaxed">
            Esperando telemetría coaxial. Sintoniza frecuencias estables o activa el Escaneo Continuo para registrar las portadoras.
          </p>
        </div>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorResonance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#0f172a"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#475569"
                fontSize={8}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#475569"
                fontSize={8}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#10b981", strokeWidth: 0.5, strokeDasharray: "2 2" }} />
              <Area
                type="monotone"
                dataKey="resonancia"
                stroke="#10b981"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorResonance)"
                activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 1, fill: "#020617" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-1">
        <span>[Eje X: Tiempo de Recepción]</span>
        <span>[Eje Y: Resonancia %]</span>
      </div>
    </div>
  );
}
