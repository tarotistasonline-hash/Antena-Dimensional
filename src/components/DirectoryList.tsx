import { useState } from "react";
import { DimensionPreset } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Eye,
  Search,
  CheckCircle2,
  Radio,
  Sparkles,
} from "lucide-react";

interface DirectoryListProps {
  onSelectPreset: (preset: DimensionPreset) => void;
  activePresetId: string | null;
}

export default function DirectoryList({
  onSelectPreset,
  activePresetId,
}: DirectoryListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activePreset = DIMENSION_PRESETS.find((p) => p.id === activePresetId);

  const filteredPresets = DIMENSION_PRESETS.filter((preset) => {
    const term = searchTerm.toLowerCase();
    return (
      preset.name.toLowerCase().includes(term) ||
      preset.frequency.toLowerCase().includes(term) ||
      preset.coordinates.toLowerCase().includes(term) ||
      preset.description.toLowerCase().includes(term) ||
      preset.entityType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300">
      {/* Cabecera de la Carpeta (Contenedor Desplegable) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 bg-slate-950/80 hover:bg-slate-900/90 border-b border-slate-800 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            {isOpen ? (
              <FolderOpen className="w-5 h-5 text-emerald-400 animate-pulse" />
            ) : (
              <Folder className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate">
                Directorio de Frecuencias Conocidas
              </h2>
              <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                📁 Carpeta ({DIMENSION_PRESETS.length})
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {activePreset ? (
                <span className="text-emerald-400 font-mono">
                  Sintonizado: {activePreset.name} ({activePreset.frequency})
                </span>
              ) : (
                "Sintonizador libre — Haz clic para desplegar cuadrantes guardados"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 hidden sm:inline">
            {isOpen ? "Ocultar Carpeta" : "Abrir Carpeta"}
          </span>
          <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* Contenido de la Carpeta (Desplegable) */}
      {isOpen && (
        <div className="p-4 space-y-3.5 animate-fade-in bg-slate-950/40">
          {/* Buscador dentro de la carpeta */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en la carpeta de frecuencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <p className="text-[10px] text-slate-400 leading-normal">
            Haz clic en un cuadrante para cargar automáticamente sus osciladores y coordenadas:
          </p>

          {/* Lista Compacta de Frecuencias en la Carpeta */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredPresets.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs font-mono">
                No se encontraron frecuencias con "{searchTerm}"
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "bg-slate-900/60 border-slate-850 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span className={`font-bold text-xs truncate ${isActive ? "text-emerald-300" : "text-slate-200"}`}>
                          {preset.name}
                        </span>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0"
                        style={{
                          backgroundColor: `${preset.color}20`,
                          color: preset.color,
                          border: `1px solid ${preset.color}40`,
                        }}
                      >
                        {preset.frequency}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed pl-5">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 text-[9px] text-slate-500 font-mono border-t border-slate-800/40 pt-1.5 pl-5">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[130px]">{preset.entityType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-mono">{preset.coordinates}</span>
                        <div className="flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" style={{ color: preset.color }} />
                          <span style={{ color: preset.color }}>{preset.dangerLevel}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Botón de cierre rápido al final de la carpeta */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>[ COMPACTAR CARPETA ]</span>
          </button>
        </div>
      )}
    </div>
  );
}

