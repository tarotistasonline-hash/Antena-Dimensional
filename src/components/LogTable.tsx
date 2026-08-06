import React, { useState, useEffect } from "react";
import { LogEntry } from "../types";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Database,
  Trash2,
  Radio,
  Send,
  SlidersHorizontal,
  Clock,
  HardDrive,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Info,
  X
} from "lucide-react";

interface LogTableProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onUpdateLogs?: (newLogs: LogEntry[]) => void;
}

export default function LogTable({ logs, onClearLogs, onUpdateLogs }: LogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minResonance, setMinResonance] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Política de expiración y almacenamiento local
  const [retentionPolicy, setRetentionPolicy] = useState<string>(() => {
    return localStorage.getItem("antena_logs_retention_policy") || "30";
  });
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Guardar cambio de política en localStorage
  const handlePolicyChange = (newPolicy: string) => {
    setRetentionPolicy(newPolicy);
    localStorage.setItem("antena_logs_retention_policy", newPolicy);
  };

  // Cálculo de logs expirados según la política
  const getExpiredLogs = (logsList: LogEntry[], policyDaysStr: string): LogEntry[] => {
    if (policyDaysStr === "never") return [];
    const days = Number(policyDaysStr);
    if (isNaN(days) || days <= 0) return [];
    const limitTime = Date.now() - days * 86400000;
    return logsList.filter((log) => {
      const time = new Date(log.timestamp).getTime();
      return !isNaN(time) && time < limitTime;
    });
  };

  const expiredLogs = getExpiredLogs(logs, retentionPolicy);
  const estimatedBytes = JSON.stringify(logs).length;
  const estimatedKB = (estimatedBytes / 1024).toFixed(1);

  // Ejecución de purga automática al detectar expirados bajo la política activa
  useEffect(() => {
    if (retentionPolicy === "never" || !onUpdateLogs || logs.length === 0) return;
    const expired = getExpiredLogs(logs, retentionPolicy);
    if (expired.length > 0) {
      const expiredIds = new Set(expired.map((l) => l.id));
      const remaining = logs.filter((l) => !expiredIds.has(l.id));
      onUpdateLogs(remaining);
      setNotificationMessage(
        `🧹 Purga automática completada: Se eliminaron ${expired.length} registro(s) con antigüedad mayor a ${retentionPolicy} día(s).`
      );
    }
  }, [retentionPolicy]);

  // Ejecución manual de purga según la política seleccionada
  const handleRunPurgeNow = () => {
    if (!onUpdateLogs) {
      onClearLogs();
      return;
    }
    if (retentionPolicy === "never") {
      setNotificationMessage("La política actual está configurada en 'Conservar todo'. Elija un período de expiración (ej. 30 días) para ejecutar la purga.");
      return;
    }
    const expired = getExpiredLogs(logs, retentionPolicy);
    if (expired.length === 0) {
      setNotificationMessage(`No hay registros anteriores a ${retentionPolicy} día(s) para purgar en este momento.`);
      return;
    }
    const expiredIds = new Set(expired.map((l) => l.id));
    const remaining = logs.filter((l) => !expiredIds.has(l.id));
    onUpdateLogs(remaining);
    setNotificationMessage(`✅ Purga ejecutada: Se liberaron ~${((JSON.stringify(expired).length) / 1024).toFixed(1)} KB eliminando ${expired.length} registro(s) expirados.`);
  };

  // Eliminar un solo registro
  const handleDeleteSingleLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateLogs) {
      const remaining = logs.filter((l) => l.id !== id);
      onUpdateLogs(remaining);
    }
  };

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

  const handleConfirmClear = () => {
    onClearLogs();
    setShowConfirmClear(false);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-md font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Bitácora de Contacto Transdimensional
          </h2>
          <p className="text-xs text-slate-400">
            Historial local de señales sintonizadas, transmisiones emitidas y ecos cósmicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Botón para Abrir Configuración de Política de Expiración */}
          <button
            type="button"
            onClick={() => setShowPolicyPanel(!showPolicyPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border shrink-0 shadow-sm ${
              showPolicyPanel
                ? "bg-amber-500/20 text-amber-300 border-amber-400/60"
                : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-700/80"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expiración</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/30">
              {retentionPolicy === "never" ? "Sin Purga" : `${retentionPolicy}d`}
            </span>
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              Borrar Todo
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICACIÓN DE ESTADO / ACCIONES DE PURGA */}
      {notificationMessage && (
        <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between gap-2 animate-fade-in shadow-inner">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PANEL DE CONFIGURACIÓN DE POLÍTICA DE EXPIRACIÓN Y ALMACENAMIENTO */}
      {showPolicyPanel && (
        <div className="p-4 bg-slate-950/90 border-2 border-amber-500/40 rounded-xl space-y-4 animate-fade-in shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-amber-200 font-mono uppercase tracking-wider">
                Política de Expiración y Limpieza de Almacenamiento Local
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPolicyPanel(false)}
              className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Metrica 1: Total de registros */}
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Registros Totales</span>
              <span className="text-lg font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                {logs.length}
              </span>
            </div>

            {/* Metrica 2: Almacenamiento ocupado */}
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Espacio Local Ocupado</span>
              <span className="text-lg font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                ~{estimatedKB} KB
              </span>
            </div>

            {/* Metrica 3: Registros por expirar */}
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Caducados (Según Política)</span>
              <span className="text-lg font-bold font-mono text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                {expiredLogs.length} reg.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="space-y-1">
              <label htmlFor="retention-policy-select" className="text-[11px] font-bold text-slate-200 block">
                Seleccionar Retención de Datos:
              </label>
              <p className="text-[10px] text-slate-400">
                Los registros con antigüedad superior al límite serán eliminados automáticamente para optimizar el almacenamiento del navegador.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                id="retention-policy-select"
                value={retentionPolicy}
                onChange={(e) => handlePolicyChange(e.target.value)}
                className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="never">🌌 Conservar todos (Sin purga automática)</option>
                <option value="1">⏱️ Borrar registros mayores a 24 Horas (1 Día)</option>
                <option value="7">📅 Borrar registros mayores a 7 Días</option>
                <option value="30">🗓️ Borrar registros mayores a 30 Días (Recomendado)</option>
                <option value="90">🛡️ Borrar registros mayores a 90 Días</option>
              </select>

              <button
                type="button"
                onClick={handleRunPurgeNow}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono cursor-pointer transition-colors shadow-sm whitespace-nowrap"
              >
                Purga Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cartel de Confirmación de Borrado In-App */}
      {showConfirmClear && (
        <div className="p-4 bg-red-950/80 border border-red-800/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-red-200">
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>¿Confirmar eliminación permanente de <strong>{logs.length}</strong> registro(s) de la bitácora local?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs cursor-pointer font-mono"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer font-mono shadow-md"
            >
              Sí, Borrar Todo
            </button>
          </div>
        </div>
      )}

      {/* Filtros de Bitácora */}
      <div id="log-filters" className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 shadow-inner">
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

                    {/* Botón de eliminación individual */}
                    {onUpdateLogs && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingleLog(log.id, e)}
                        title="Eliminar este registro"
                        className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

