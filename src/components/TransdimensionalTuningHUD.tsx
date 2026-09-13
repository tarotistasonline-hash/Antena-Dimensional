import React, { useEffect, useState } from "react";
import { Radio, Wifi, Clock, AlertTriangle, Sparkles, CheckCircle2, Loader2, Volume2 } from "lucide-react";

interface TransdimensionalTuningHUDProps {
  isActive: boolean;
  mode: "transmitting" | "tuning";
  frequency: number;
  unit: string;
  dimension: string;
  entityName?: string;
  externalProgress?: number;
  onCancel?: () => void;
}

export const TransdimensionalTuningHUD: React.FC<TransdimensionalTuningHUDProps> = ({
  isActive,
  mode,
  frequency,
  unit,
  dimension,
  entityName,
  externalProgress,
}) => {
  const [elapsed, setElapsed] = useState<number>(0);
  const [localProgress, setLocalProgress] = useState<number>(8);

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      setLocalProgress(0);
      return;
    }

    const startTime = Date.now();
    setLocalProgress(10);

    const timer = setInterval(() => {
      const now = Date.now();
      const seconds = (now - startTime) / 1000;
      setElapsed(seconds);

      // Progreso simulado suave si no hay progreso externo
      setLocalProgress((prev) => {
        if (seconds < 1.5) {
          // Fase 1: 10% a 40%
          return Math.min(40, 10 + Math.round((seconds / 1.5) * 30));
        } else if (seconds < 3.5) {
          // Fase 2: 40% a 78%
          return Math.min(78, 40 + Math.round(((seconds - 1.5) / 2) * 38));
        } else if (seconds < 5.5) {
          // Fase 3: 78% a 95%
          return Math.min(95, 78 + Math.round(((seconds - 3.5) / 2) * 17));
        } else {
          // Mantener en 96-98% mientras llega la respuesta final
          return Math.min(98, 95 + Math.round((seconds - 5.5) * 0.5));
        }
      });
    }, 80);

    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive) return null;

  const currentProgress = externalProgress !== undefined && externalProgress > 0 ? externalProgress : localProgress;

  // Determinar fase actual según el tiempo
  let currentStep = 1;
  if (elapsed >= 1.6 && elapsed < 3.6) currentStep = 2;
  else if (elapsed >= 3.6) currentStep = 3;

  const titleText =
    mode === "transmitting"
      ? "EMITIENDO CONSULTA Y CANALIZANDO RESPUESTA"
      : "SINTONIZANDO Y ACOPLANDO FRECUENCIA INTERDIMENSIONAL";

  const targetName = entityName || dimension || "Conciencia Dimensional";

  return (
    <div
      id="transdimensional-tuning-hud"
      className="rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-emerald-400 p-5 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.35)] space-y-4 animate-in fade-in duration-200 relative overflow-hidden"
    >
      {/* Luz ambiental sutil de barrido */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-cyan-500/5 to-transparent pointer-events-none" />

      {/* Cabecera Principal con Radar y Frecuencia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-emerald-500/30 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-400/80 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/60 text-[10px] font-mono font-black text-emerald-300 uppercase tracking-widest animate-pulse">
                ● ENLACE ACTIVO EN DIRECTO
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                {frequency} {unit}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black font-sans text-white tracking-wide mt-0.5">
              {titleText}
            </h3>
          </div>
        </div>

        {/* Cronómetro y Porcentaje en Vivo */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/90 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-inner font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-slate-300">Tiempo:</span>
          <span className="text-amber-300 font-black">{elapsed.toFixed(1)}s</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-black">{Math.min(99, Math.round(currentProgress))}%</span>
        </div>
      </div>

      {/* MENSAJE DESTACADO DE ESPERA: Explica claramente que toma unos segundos para que nadie se vaya */}
      <div className="rounded-xl bg-amber-950/70 border-2 border-amber-400/90 p-3.5 sm:p-4 text-center space-y-1.5 relative z-10 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
          <span>POR FAVOR AGUARDA UNOS INSTANTES (DEMORA DE 3 A 5 SEGUNDOS)</span>
        </div>
        <p className="text-xs sm:text-sm font-sans font-bold text-slate-100 leading-snug">
          La comunicación cuántica atraviesa la membrana multidimensional en tiempo real.{" "}
          <span className="text-amber-300 font-black">¡No cierres la página, tu respuesta está llegando!</span>
        </p>
        <p className="text-[11px] font-sans text-slate-300/90">
          La señal viaja hacia <strong className="text-emerald-300 font-mono">{targetName}</strong> y se decodifica con síntesis de alta fidelidad.
        </p>
      </div>

      {/* Barra de Progreso con Indicadores de Fase */}
      <div className="space-y-2.5 relative z-10">
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner relative">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative"
            style={{ width: `${Math.min(99, Math.round(currentProgress))}%` }}
          >
            {/* Destello móvil */}
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* 3 Pasos Visuales de la Comunicación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          {/* Paso 1 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2 ${
              currentStep === 1
                ? "bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                : currentStep > 1
                ? "bg-slate-950/60 border-emerald-500/30 text-slate-400"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            {currentStep > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-[10px] uppercase text-emerald-300">
                1. Calibración Escalar
              </span>
              <p className="text-[10px] leading-tight text-slate-300 font-sans">
                Alineando oscilador a {frequency} {unit}
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2 ${
              currentStep === 2
                ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
                : currentStep > 2
                ? "bg-slate-950/60 border-emerald-500/30 text-slate-400"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            {currentStep > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : currentStep === 2 ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Wifi className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-[10px] uppercase text-cyan-300">
                2. Cruce de Membrana
              </span>
              <p className="text-[10px] leading-tight text-slate-300 font-sans">
                Enlace con {targetName}
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2 ${
              currentStep === 3
                ? "bg-indigo-950/80 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.3)] animate-pulse"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            {currentStep === 3 ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block text-[10px] uppercase text-indigo-300">
                3. Decodificación
              </span>
              <p className="text-[10px] leading-tight text-slate-300 font-sans">
                Traduciendo y modulando voz
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie con ecualizador animado */}
      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Portadora de audio y estática activa</span>
          {/* Pequeñas barras de sonido */}
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-emerald-400 animate-bounce h-2" style={{ animationDelay: "0.1s" }} />
            <span className="w-0.5 bg-cyan-400 animate-bounce h-3" style={{ animationDelay: "0.3s" }} />
            <span className="w-0.5 bg-emerald-300 animate-bounce h-1.5" style={{ animationDelay: "0.2s" }} />
            <span className="w-0.5 bg-amber-400 animate-bounce h-2.5" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>

        <span className="text-emerald-400 font-bold">
          ⚡ Estado: Sincronizando paquetes taquiónicos
        </span>
      </div>
    </div>
  );
};
