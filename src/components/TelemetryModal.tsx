import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Activity,
  Shield,
  RefreshCw,
  X,
  Zap,
  Globe,
} from "lucide-react";
import {
  getStoredVisits,
  setUniversalVisits,
  getLocalTelemetryLogs,
  getDeviceInfo,
  TelemetryEvent,
} from "../cloudCounter";

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: number;
  onVisitsChange: (newVisits: number) => void;
  isExcludedOperator: boolean;
  onToggleOperatorExclusion: (excluded: boolean) => void;
  isLowPowerMode?: boolean;
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
  addToast,
}) => {
  const [customVisitsInput, setCustomVisitsInput] = useState("");
  const [logs, setLogs] = useState<TelemetryEvent[]>(getLocalTelemetryLogs());
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    const stored = getStoredVisits();
    onVisitsChange(stored);
    setLogs(getLocalTelemetryLogs());
    setTimeout(() => {
      setIsRefreshing(false);
      addToast("TELEMETRÍA ACTUALIZADA", `Visitas activas: ${stored}`, "high-intensity");
    }, 250);
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
    const next = visits + 1;
    const saved = await setUniversalVisits(next);
    onVisitsChange(saved);
    setLogs(getLocalTelemetryLogs());
    addToast("VISITA REGISTRADA (+1)", `Total de visitas: ${saved}`, "high-intensity");
  };

  const handleClearLogs = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("antena_telemetry_events_log");
    }
    setLogs([]);
    addToast("REGISTRO LIMPIADO", "Se vació el historial local de eventos.", "high-intensity");
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
                Telemetría de Visitas & Actividad en Vivo
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono">
                Contador universal autónomo (Netlify y Local)
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  TOTAL DE VISITAS REALES:
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  ⚡ Contador autónomo permanente — Sin cuentas ni tokens externos
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
              Cada vez que un visitante entra a la aplicación (en Netlify o en tu propio dominio), el contador suma +1 automáticamente y preserva el total acumulado de forma persistente.
            </p>

            {/* Sincronización / Ajuste de Visitas Acumuladas */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="text-[10px] font-mono text-slate-300 font-bold block">
                ⚙️ Calibrar o ajustar cifra de visitas acumuladas:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customVisitsInput}
                  onChange={(e) => setCustomVisitsInput(e.target.value)}
                  placeholder={`Ej: ${visits || 152}`}
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

            {/* Botones de Acción Rápida */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestVisit}
                className="text-[10px] font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/60 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>➕ Registrar Visita de Prueba (+1)</span>
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
          </div>

          {/* Tarjeta de Información de Dispositivo y Entorno Actual */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              ENTORNO DEL VISITANTE ACTUAL:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Dispositivo:</span>
                <strong className="text-cyan-300">{getDeviceInfo()}</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Estado de Red:</span>
                <strong className="text-emerald-400">🟢 Conectado / Online</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Modo de Energía:</span>
                <strong className="text-slate-200">{isLowPowerMode ? "Bajo Consumo" : "Rendimiento Completo"}</strong>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 flex justify-between">
                <span className="text-slate-400">Filtro Administrador:</span>
                <strong className={isExcludedOperator ? "text-amber-400" : "text-slate-300"}>
                  {isExcludedOperator ? "🛡️ Excluido" : "👁️ Activo"}
                </strong>
              </div>
            </div>
          </div>

          {/* Tarjeta de Exclusión de Mis Propias Visitas (Filtro de Administrador) */}
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
                <span>{isExcludedOperator ? "🛡️ EXCLUSIÓN ACTIVADA" : "⚪ REGISTRAR MIS VISITAS"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {isExcludedOperator ? (
                <span className="text-amber-300">
                  ✨ <strong>Filtro Activo:</strong> Cuando abres o pruebas la Antena desde este navegador, tus visitas <strong>no se suman</strong> al contador global para no alterar tus estadísticas.
                </span>
              ) : (
                <span className="text-slate-400">
                  Tus aperturas de página se cuentan como visitas. Puedes activar el filtro cuando estés probando la app.
                </span>
              )}
            </p>
          </div>

          {/* Registro de Actividad y Telemetría en Vivo */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                REGISTRO DE ACTIVIDAD Y EVENTOS EN VIVO:
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
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                <p className="text-[10px] font-mono text-slate-400">
                  No hay eventos registrados en este momento.
                </p>
                <p className="text-[9px] font-mono text-slate-500">
                  Las conexiones, sintonizaciones y cambios de frecuencia aparecerán aquí en vivo.
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
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
                      <div className="text-[8.5px] text-slate-400">
                        {log.device}
                      </div>
                    </div>
                    <span className="text-slate-500 text-[9px] shrink-0 self-end sm:self-auto font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[9px] font-mono text-slate-500">
            ⚡ Sincronización continua activa
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors cursor-pointer shadow"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
