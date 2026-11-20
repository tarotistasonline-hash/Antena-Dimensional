import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Activity,
  Shield,
  RefreshCw,
  X,
  Globe,
} from "lucide-react";
import {
  setUniversalVisits,
  getLocalTelemetryLogs,
  getDeviceInfo,
  TelemetryEvent,
  ServerVisitLog,
  fetchServerVisitStats,
  incrementServerVisit,
} from "../cloudCounter";
import { safeStorage } from "../utils/storage";

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: number;
  onVisitsChange: (newVisits: number) => void;
  isExcludedOperator: boolean;
  onToggleOperatorExclusion: (excluded: boolean) => void;
  isLowPowerMode?: boolean;
  isOperatorAdmin?: boolean;
  addToast: (title: string, msg: string, type?: "standard" | "high-intensity" | "anomaly") => void;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({
  isOpen,
  onClose,
  visits,
  onVisitsChange,
  isExcludedOperator,
  onToggleOperatorExclusion,
  isLowPowerMode,
  isOperatorAdmin = false,
  addToast,
}) => {
  const [customVisitsInput, setCustomVisitsInput] = useState("");
  const [logs, setLogs] = useState<TelemetryEvent[]>(() => getLocalTelemetryLogs());
  const [serverVisits, setServerVisits] = useState<ServerVisitLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLogs(getLocalTelemetryLogs());
    fetchServerVisitStats()
      .then((stats) => {
        onVisitsChange(stats.visits);
        setServerVisits(stats.recentVisits);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const stats = await fetchServerVisitStats();
    onVisitsChange(stats.visits);
    setServerVisits(stats.recentVisits);
    setLogs(getLocalTelemetryLogs());
    setIsRefreshing(false);
    addToast("VISITAS SINCRONIZADAS", `Total real en servidor: ${stats.visits}`, "high-intensity");
  };

  const handleSetCustomVisits = async () => {
    const num = parseInt(customVisitsInput, 10);
    if (isNaN(num) || num < 0) {
      addToast("NÚMERO INVÁLIDO", "Ingresa una cifra válida mayor o igual a 0.", "anomaly");
      return;
    }
    const saved = await setUniversalVisits(num);
    onVisitsChange(saved);
    setLogs(getLocalTelemetryLogs());
    setCustomVisitsInput("");
    addToast("VISITAS ACTUALIZADAS", `Contador establecido en: ${saved}`, "high-intensity");
  };

  const handleTestVisit = async () => {
    const saved = await incrementServerVisit();
    onVisitsChange(saved);
    const stats = await fetchServerVisitStats();
    setServerVisits(stats.recentVisits);
    setLogs(getLocalTelemetryLogs());
    addToast("VISITA REGISTRADA (+1)", `Total de visitas en servidor: ${saved}`, "high-intensity");
  };

  const handleClearLogs = () => {
    if (typeof window !== "undefined") {
      safeStorage.removeItem("antena_telemetry_events_log");
    }
    setLogs([]);
    addToast("REGISTRO LIMPIADO", "Se vació el historial local de eventos.", "high-intensity");
  };

  const formatIsoTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-slate-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] relative animate-scale-up text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Contador de Visitas Reales en Vivo
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono">
                Registro directo y autónomo en servidor propio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Tarjeta de Contador de Visitas Reales */}
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  TOTAL DE VISITAS REALES:
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  Contador autónomo en tiempo real sin rastreadores externos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-2xl font-mono font-black text-emerald-300 bg-emerald-950 px-3.5 py-1 rounded-lg border border-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {visits.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Cada nueva sesión de visitante que ingresa a la estación suma +1 automáticamente en el servidor y mantiene el conteo real acumulado.
            </p>

            {/* Controles exclusivos del Administrador */}
            {isOperatorAdmin && (
              <>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
                  <label className="text-[10px] font-mono text-slate-300 font-bold block">
                    Calibrar o ajustar cifra de visitas acumuladas:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customVisitsInput}
                      onChange={(e) => setCustomVisitsInput(e.target.value)}
                      placeholder={`Ej: ${visits || 303}`}
                      className="w-32 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSetCustomVisits}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded transition-colors cursor-pointer shadow"
                    >
                      Guardar Cifra
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestVisit}
                    className="text-[10px] font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+1 Registrar Visita de Prueba</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>Refrescar Datos</span>
                  </button>
                </div>
              </>
            )}

            {!isOperatorAdmin && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Actualizar Contador</span>
                </button>
              </div>
            )}
          </div>

          {/* Tarjeta de Información de Conexión Actual */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              TU CONEXIÓN ACTUAL:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between gap-2">
                <span className="text-slate-400">Dispositivo:</span>
                <strong className="text-cyan-300 truncate">{getDeviceInfo()}</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between gap-2">
                <span className="text-slate-400">Estado de Red:</span>
                <strong className="text-emerald-400">En Línea</strong>
              </div>
              {isOperatorAdmin && (
                <>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between gap-2">
                    <span className="text-slate-400">Modo de Energía:</span>
                    <strong className="text-slate-200">{isLowPowerMode ? "Bajo Consumo" : "Rendimiento Completo"}</strong>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between gap-2">
                    <span className="text-slate-400">Filtro Creador:</span>
                    <strong className={isExcludedOperator ? "text-amber-400" : "text-slate-300"}>
                      {isExcludedOperator ? "Excluido" : "Contando"}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Exclusión de Propias Visitas (Solo Operador Administrador) */}
          {isOperatorAdmin && (
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  FILTRO DE CREADOR (NO CONTAR MIS ENTRADAS):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isExcludedOperator;
                    onToggleOperatorExclusion(nextState);
                    addToast(
                      nextState ? "EXCLUSIÓN ACTIVADA" : "EXCLUSIÓN DESACTIVADA",
                      nextState
                        ? "Tus accesos ya NO sumarán al contador de visitas."
                        : "Tus accesos volverán a registrarse como visitas reales.",
                      "high-intensity"
                    );
                  }}
                  className={`px-3 py-1 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border flex items-center gap-1.5 self-start sm:self-auto ${
                    isExcludedOperator
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span>{isExcludedOperator ? "Exclusión Activada" : "Registrando Mis Visitas"}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {isExcludedOperator ? (
                  <span className="text-amber-300">
                    <strong>Filtro Activo:</strong> Cuando abres o pruebas la estación desde este navegador, tus visitas <strong>no se suman</strong> al contador global.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Tus aperturas de página se cuentan como visitas. Puedes activar el filtro cuando estés realizando pruebas.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Registro Real de Últimas Visitas en Servidor */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ÚLTIMAS VISITAS REALES EN SERVIDOR:
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {serverVisits.length} recientes
              </span>
            </div>

            {serverVisits.length === 0 ? (
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                <p className="text-[10px] font-mono text-slate-400">
                  Las nuevas entradas de visitantes aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {serverVisits.map((v) => (
                  <div
                    key={v.id}
                    className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-slate-200 truncate">{v.device}</span>
                    </div>
                    <span className="text-slate-400 text-[9px] shrink-0">
                      {formatIsoTime(v.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registro Local de Actividad (solo Admin) */}
          {isOperatorAdmin && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  ACTIVIDAD RECIENTE DE ESTA SESIÓN:
                </span>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Limpiar historial
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                  <p className="text-[10px] font-mono text-slate-400">
                    No hay eventos locales registrados en este momento.
                  </p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[10px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-300 font-bold uppercase text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/60">
                            {log.type}
                          </span>
                          <span className="text-slate-200">{log.details}</span>
                        </div>
                        <div className="text-[8.5px] text-slate-400">{log.device}</div>
                      </div>
                      <span className="text-slate-500 text-[9px] shrink-0 self-end sm:self-auto font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[9px] font-mono text-slate-500">
            Sincronización en tiempo real activa
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer shadow"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
