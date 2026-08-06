import React, { useState, useMemo } from "react";
import { LogEntry, DimensionPreset } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Radio,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface MembraneStatusPanelProps {
  logs: LogEntry[];
  currentDimension: string;
  onSelectDimension?: (preset: DimensionPreset) => void;
}

export default function MembraneStatusPanel({
  logs,
  currentDimension,
  onSelectDimension,
}: MembraneStatusPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute Stability Index and Dimension Breakdown from Bitácora (Logs)
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        avgStability: 100,
        avgResonance: 0,
        totalEntries: 0,
        dimensionCount: 0,
        dimensionBreakdown: [],
        statusTier: "ESTABLE",
        statusColor: "text-emerald-400",
        bgBadge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        mostStable: null as { name: string; stability: number } | null,
        mostUnstable: null as { name: string; stability: number } | null,
      };
    }

    // Map logs by dimension
    const dimMap: Record<
      string,
      { count: number; totalResonance: number; logs: LogEntry[] }
    > = {};

    logs.forEach((log) => {
      const dimName = log.dimension.trim() || "Desconocida";
      if (!dimMap[dimName]) {
        dimMap[dimName] = { count: 0, totalResonance: 0, logs: [] };
      }
      dimMap[dimName].count += 1;
      dimMap[dimName].totalResonance += log.resonance;
      dimMap[dimName].logs.push(log);
    });

    const breakdown = Object.entries(dimMap).map(([name, data]) => {
      const avgRes = data.totalResonance / data.count;
      const stability = Math.max(0, Math.min(100, Math.round(100 - avgRes * 0.75)));
      
      const preset = DIMENSION_PRESETS.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() || p.id === name.toLowerCase()
      );

      return {
        name,
        count: data.count,
        avgResonance: Math.round(avgRes),
        stability,
        preset,
      };
    });

    breakdown.sort((a, b) => b.stability - a.stability);

    const totalStabilitySum = breakdown.reduce((acc, curr) => acc + curr.stability, 0);
    const avgStability = Math.round(totalStabilitySum / breakdown.length);

    const totalResonanceSum = logs.reduce((acc, curr) => acc + curr.resonance, 0);
    const avgResonance = Math.round(totalResonanceSum / logs.length);

    let statusTier = "MEMBRANA COHERENTE";
    let statusColor = "text-emerald-400";
    let bgBadge = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";

    if (avgStability < 40) {
      statusTier = "CRÍTICO // RUPTURA";
      statusColor = "text-red-400";
      bgBadge = "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse";
    } else if (avgStability < 65) {
      statusTier = "PERTURBACIÓN ELEVADA";
      statusColor = "text-amber-400";
      bgBadge = "bg-amber-500/15 border-amber-500/30 text-amber-400";
    } else if (avgStability < 85) {
      statusTier = "INFLUSO MÓDICO";
      statusColor = "text-cyan-400";
      bgBadge = "bg-cyan-500/15 border-cyan-500/30 text-cyan-400";
    }

    return {
      avgStability,
      avgResonance,
      totalEntries: logs.length,
      dimensionCount: breakdown.length,
      dimensionBreakdown: breakdown,
      statusTier,
      statusColor,
      bgBadge,
      mostStable: breakdown[0] || null,
      mostUnstable: breakdown[breakdown.length - 1] || null,
    };
  }, [logs]);

  return (
    <div
      id="membrane-status-panel"
      className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-md transition-all duration-300 text-slate-200 animate-glitch-spontaneous"
    >
      {/* HEADER BAR & COLLAPSE TOGGLE */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full text-left p-3 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-850 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase font-mono truncate flex items-center gap-2">
            <span>MEMBRANA QUANTUM</span>
            <span className={`text-[9px] font-mono px-2 py-0.2 rounded border ${stats.bgBadge}`}>
              {stats.statusTier}
            </span>
          </h3>
        </div>

        {/* Compact gauge info preview on the header */}
        <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-400 hidden sm:inline">Estabilidad:</span>
            <span className={`font-bold ${stats.statusColor}`}>
              {stats.avgStability}%
            </span>
          </div>

          <span className="text-slate-500 hidden md:inline">
            Lecturas: <strong className="text-slate-200">{stats.totalEntries}</strong>
          </span>

          <div className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </button>

      {/* EXPANDED CONTENT (Compact Layout) */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 animate-fade-in bg-slate-950/60">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            {/* COMPACT STABILITY DIAL (5 cols) */}
            <div className="md:col-span-5 bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 flex flex-col justify-between space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  ÍNDICE ESTABILIDAD
                </span>
                <span className={`text-xs font-extrabold font-mono ${stats.statusColor}`}>
                  {stats.avgStability}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    stats.avgStability > 70
                      ? "bg-emerald-500"
                      : stats.avgStability > 45
                      ? "bg-amber-500"
                      : "bg-red-500 animate-pulse"
                  }`}
                  style={{ width: `${stats.avgStability}%` }}
                />
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-850">
                <span>Resonancia: <strong className="text-slate-200">{stats.avgResonance}%</strong></span>
                <span>Riesgo: <strong className={stats.statusColor}>{100 - stats.avgStability}%</strong></span>
              </div>
            </div>

            {/* DIMENSION BREAKDOWN LIST (7 cols) */}
            <div className="md:col-span-7 bg-slate-900/40 border border-slate-850 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-b border-slate-850 pb-1">
                <span className="flex items-center gap-1 font-bold text-slate-300">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  DIMENSIONES EN BITÁCORA ({stats.dimensionCount})
                </span>
                <span>ESTABILIDAD</span>
              </div>

              {stats.dimensionBreakdown.length === 0 ? (
                <div className="py-3 text-center text-[10px] font-mono text-slate-500 italic">
                  Sin lecturas en bitácora. Ejecuta un escaneo para evaluar la membrana.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 custom-scrollbar">
                  {stats.dimensionBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-850 hover:border-slate-700 rounded p-1.5 flex items-center justify-between gap-2 text-[10px] font-mono transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200 truncate">{item.name}</span>
                          {item.preset && (
                            <span className="text-[8px] bg-slate-900 text-slate-400 px-1 py-0.2 rounded border border-slate-800">
                              {item.preset.coordinates}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {item.count} lectura(s) | Res. <span className="text-indigo-300">{item.avgResonance}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold text-[11px] ${
                            item.stability >= 75
                              ? "text-emerald-400"
                              : item.stability >= 50
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.stability}%
                        </span>

                        {item.preset && onSelectDimension && (
                          <button
                            type="button"
                            onClick={() => onSelectDimension(item.preset!)}
                            className="p-1 rounded bg-slate-900 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 border border-slate-800 transition-colors cursor-pointer"
                            title="Sintonizar dimensión"
                          >
                            <Radio className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

