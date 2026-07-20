import { DimensionPreset } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import { Radio, ShieldAlert, Eye, ServerCrash } from "lucide-react";

interface DirectoryListProps {
  onSelectPreset: (preset: DimensionPreset) => void;
  activePresetId: string | null;
}

export default function DirectoryList({
  onSelectPreset,
  activePresetId,
}: DirectoryListProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
        <h2 className="text-md font-bold text-slate-100 tracking-tight">
          Directorio de Frecuencias Conocidas
        </h2>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Selecciona un cuadrante transdimensional conocido para sintonizar los osciladores automáticamente:
      </p>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {DIMENSION_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-slate-800/80 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-semibold text-xs text-slate-200 block truncate">
                  {preset.name}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium shrink-0"
                  style={{
                    backgroundColor: `${preset.color}20`,
                    color: preset.color,
                    border: `1px solid ${preset.color}40`,
                  }}
                >
                  {preset.coordinates}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                {preset.description}
              </p>

              <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 font-mono mt-2 border-t border-slate-800/40 pt-2">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span className="truncate max-w-[120px]">{preset.entityType}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" style={{ color: preset.color }} />
                  <span style={{ color: preset.color }}>{preset.dangerLevel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
