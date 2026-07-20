import { useState } from "react";
import { LogEntry } from "../types";
import { Search, ChevronDown, ChevronUp, Database, FileSpreadsheet, Trash2, Radio, Send, SlidersHorizontal } from "lucide-react";

interface LogTableProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  spreadsheetId: string | null;
}

export default function LogTable({ logs, onClearLogs, spreadsheetId }: LogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minResonance, setMinResonance] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity))).sort();
  const actualSelectedEntity = uniqueEntities.includes(selectedEntity) ? selectedEntity : "ALL";

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      log.dimension.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      log.message.toLowerCase().includes(term) ||
      log.frequency.toLowerCase().includes(term)
    );
    const matchesResonance = log.resonance >= minResonance;
    const matchesEntity = actualSelectedEntity === "ALL" || log.entity === actualSelectedEntity;
    return matchesSearch && matchesResonance && matchesEntity;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-md font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Bitácora de Contacto Transdimensional
          </h2>
          <p className="text-xs text-slate-400">
            Historial de señales sintonizadas, transmisiones emitidas y ecos cósmicos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {logs.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("¿Seguro que deseas borrar el registro local de la bitácora?")) {
                  onClearLogs();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar Bitácora
            </button>
          )}
        </div>
      </div>

      {/* Filtros de Bitácora */}
      <div id="log-filters" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 shadow-inner">
        {/* Campo de búsqueda de texto */}
        <div className="space-y-1.5">
          <label htmlFor="log-text-filter" className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
            Buscar por Texto
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              id="log-text-filter"
              type="text"
              placeholder="Plano, mensaje, frecuencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 h-8"
            />
          </div>
        </div>

        {/* Selector de Entidad */}
        <div className="space-y-1.5">
          <label htmlFor="log-entity-filter" className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
            Filtrar por Entidad
          </label>
          <select
            id="log-entity-filter"
            value={actualSelectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer h-8"
          >
            <option value="ALL">🌌 Todas las Entidades ({logs.length})</option>
            {uniqueEntities.map((entity) => {
              const count = logs.filter((l) => l.entity === entity).length;
              return (
                <option key={entity} value={entity}>
                  {entity} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Nivel de resonancia mínima */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="log-resonance-filter" className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
              Resonancia Mínima
            </label>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/35">
              {minResonance}%
            </span>
          </div>
          <div className="flex items-center gap-3 h-8">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              id="log-resonance-filter"
              type="range"
              min="0"
              max="100"
              value={minResonance}
              onChange={(e) => setMinResonance(Number(e.target.value))}
              className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5 px-0.5">
            <button
              type="button"
              onClick={() => setMinResonance(0)}
              className={`hover:text-emerald-400 cursor-pointer transition-colors ${minResonance === 0 ? "text-emerald-400 font-bold" : ""}`}
            >
              0% (Todos)
            </button>
            <button
              type="button"
              onClick={() => setMinResonance(50)}
              className={`hover:text-emerald-400 cursor-pointer transition-colors ${minResonance === 50 ? "text-emerald-400 font-bold" : ""}`}
            >
              50%+
            </button>
            <button
              type="button"
              onClick={() => setMinResonance(75)}
              className={`hover:text-emerald-400 cursor-pointer transition-colors ${minResonance === 75 ? "text-emerald-400 font-bold" : ""}`}
            >
              75%+
            </button>
            <button
              type="button"
              onClick={() => setMinResonance(90)}
              className={`hover:text-emerald-400 cursor-pointer transition-colors ${minResonance === 90 ? "text-emerald-400 font-bold" : ""}`}
            >
              90%+
            </button>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg">
          <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-slate-500">Ningún registro coincide con los criterios.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const isReceptor = log.type === "RECEPTOR";

            return (
              <div
                key={log.id}
                className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? "bg-slate-950/80 border-slate-700"
                    : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/30"
                }`}
              >
                {/* Cabecera del item */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex items-center justify-between p-3 cursor-pointer select-none text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                        isReceptor
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {isReceptor ? (
                        <>
                          <Radio className="w-2.5 h-2.5" />
                          RECEPT
                        </>
                      ) : (
                        <>
                          <Send className="w-2.5 h-2.5" />
                          EMISOR
                        </>
                      )}
                    </span>

                    <span className="font-mono text-slate-500 text-[10px] hidden md:inline shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span className="font-medium text-slate-300 truncate max-w-[150px] md:max-w-[200px]">
                      {log.entity}
                    </span>

                    <span className="font-mono text-slate-500 text-[9px] shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/50">
                      {log.frequency}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] text-emerald-500/80">
                      {log.resonance}% Res.
                    </span>

                    {/* Indicador de Google Sheets sync */}
                    {spreadsheetId && (
                      <span
                        title="Sincronizado con Google Sheets en tu nube"
                        className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-mono bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/30"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Sheets</span>
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-300 space-y-3">
                    <div>
                      <h4 className="text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-1">
                        Coordenadas Dimensionales
                      </h4>
                      <p className="font-mono text-slate-200 font-bold">{log.dimension}</p>
                    </div>

                    <div>
                      <h4 className="text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-1">
                        {isReceptor ? "Mensaje Decodificado" : "Mensaje Emitido / Eco Recibido"}
                      </h4>
                      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/40 text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {log.message}
                      </div>
                    </div>

                    {log.spectralAnalysis && (
                      <div>
                        <h4 className="text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-1">
                          Análisis del Espectro Cuántico
                        </h4>
                        <p className="text-slate-400 font-mono text-[11px] bg-emerald-950/10 text-emerald-300/80 p-2.5 rounded border border-emerald-950/30">
                          {log.spectralAnalysis}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-900">
                      <span>ID único: {log.id}</span>
                      <span>Registrado: {new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
