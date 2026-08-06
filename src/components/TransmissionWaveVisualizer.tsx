import React, { useEffect, useRef, useState } from "react";
import { Signal, Wifi, Zap, Volume2, Clock, AlertTriangle, Cpu, Activity, Sliders, Database } from "lucide-react";
import { radioStatic } from "../radioStatic";

interface TransmissionWaveVisualizerProps {
  label?: string;
  sublabel?: string;
  frequency?: number;
  unit?: string;
  dimension?: string;
  mode?: "tuning" | "transmitting";
  isDiagnosticMode?: boolean;
  onToggleDiagnosticMode?: () => void;
}

// Icono y Animación Dinámica de Ondas de Radio en Tiempo Real
const DynamicFrequencyRadioWaves = ({ frequency = 432 }: { frequency?: number }) => {
  // Speed calculation derived from frequency
  const animSpeed = Math.max(0.2, Math.min(2.0, (frequency % 1000) / 300 + 0.3));

  return (
    <div className="flex items-center gap-2 shrink-0 px-3 py-1.5 bg-slate-950/90 border-2 border-emerald-400 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.6)]">
      {/* Icono de Antena Emisora con Anillos de Ondas Expansivas */}
      <div className="relative w-7 h-7 flex items-center justify-center text-emerald-400">
        <Wifi className="w-6 h-6 animate-pulse text-emerald-300" style={{ animationDuration: `${0.8 / animSpeed}s` }} />
        <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDuration: `${1.2 / animSpeed}s` }} />
      </div>
      
      {/* ecualizador de Frecuencia con Ondas Móviles */}
      <div className="flex items-end gap-1 h-5">
        <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: "60%", animationDuration: `${0.4 / animSpeed}s` }} />
        <span className="w-1 bg-emerald-300 rounded-full animate-bounce" style={{ height: "100%", animationDuration: `${0.6 / animSpeed}s` }} />
        <span className="w-1 bg-amber-400 rounded-full animate-bounce" style={{ height: "40%", animationDuration: `${0.3 / animSpeed}s` }} />
        <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: "85%", animationDuration: `${0.5 / animSpeed}s` }} />
        <span className="w-1 bg-emerald-200 rounded-full animate-bounce" style={{ height: "70%", animationDuration: `${0.7 / animSpeed}s` }} />
      </div>
    </div>
  );
};

export const TransmissionWaveVisualizer: React.FC<TransmissionWaveVisualizerProps> = ({
  label = "SINTONIZAR PLANO, AGUARDAR Y ESCUCHAR",
  sublabel = "Transmitiendo ondas a la membrana interdimensional",
  frequency = 432,
  unit = "Hz",
  dimension = "D-4 Matrix",
  mode = "tuning",
  isDiagnosticMode,
  onToggleDiagnosticMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [anomalousEvent, setAnomalousEvent] = useState<string | null>(null);
  const isGlitchingRef = useRef<boolean>(false);

  // Estado local e interacción de Modo Diagnóstico (FFT Buffer)
  const [internalDiagnostic, setInternalDiagnostic] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("antena_diagnostic_mode") === "true";
    }
    return false;
  });

  const isDiagnostic = isDiagnosticMode !== undefined ? isDiagnosticMode : internalDiagnostic;

  const toggleDiagnosticMode = () => {
    if (onToggleDiagnosticMode) {
      onToggleDiagnosticMode();
    } else {
      setInternalDiagnostic((prev) => {
        const next = !prev;
        if (typeof window !== "undefined") {
          localStorage.setItem("antena_diagnostic_mode", String(next));
        }
        return next;
      });
    }
  };

  // Selector interactivo de tamaño de buffer FFT
  const [fftSize, setFftSizeState] = useState<number>(256);
  const fftOptions = [64, 128, 256, 512, 1024];

  const handleSelectFftSize = (size: number) => {
    setFftSizeState(size);
    radioStatic.setFftSize(size);
  };

  // Telemetría en tiempo real del buffer para el HUD superpuesto
  const [diagnosticTelemetry, setDiagnosticTelemetry] = useState<{
    peakVal: number;
    rms: number;
    sampleRate: number;
    activeBin: number;
    bufferHead: number[];
  }>({
    peakVal: 0,
    rms: 0,
    sampleRate: 44100,
    activeBin: 0,
    bufferHead: [],
  });

  // Iniciar automáticamente el zumbido de radio éter/portadora al establecer la conexión
  useEffect(() => {
    radioStatic.start();
    radioStatic.setFftSize(fftSize);
  }, [frequency, dimension, mode, fftSize]);

  // Detector aleatorio de interferencias anómalas e inesperadas (muy ocasional para no tapar el discurso)
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // 22% de probabilidad cada 9 segundos
      if (Math.random() < 0.22) {
        const events = [
          "⚡ MICRO-INTERFERENCIA CÓSMICA DETECTADA",
          "📡 DESVIACIÓN TEMPORAL SUB-ESPACIAL (+0.04 Hz)",
          "🌀 FLUCTUACIÓN EN LA MEMBRANA DE CORDONES",
          "🌌 ECO DE PORTADORA INTERDIMENSIONAL",
        ];
        const randomEv = events[Math.floor(Math.random() * events.length)];
        setAnomalousEvent(randomEv);
        isGlitchingRef.current = true;

        // Disparar sonido sutil de chasquido de radio
        radioStatic.triggerAnomalousGlitch();

        // Apagar el aviso y la distorsión gráfica tras 1.4 segundos
        setTimeout(() => {
          setAnomalousEvent(null);
          isGlitchingRef.current = false;
        }, 1400);
      }
    }, 9000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Animated connection progress bar logic
  useEffect(() => {
    setProgress(5);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [frequency, dimension, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height || width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Phase speed is tied directly to selected frequency
      const freqSpeed = Math.max(0.04, Math.min(0.25, (frequency % 500) / 1000 + 0.05));
      phase += freqSpeed;

      // Clear with dark slate background
      ctx.fillStyle = "rgba(2, 6, 23, 0.45)";
      ctx.fillRect(0, 0, width, height);

      // Draw horizontal center reference line
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ====================================================
      // MODO DIAGNÓSTICO: EXTRAER Y SUPERPONER BUFFER FFT
      // ====================================================
      const analyser = radioStatic.getAnalyser();
      const binCount = (analyser && analyser.frequencyBinCount) ? analyser.frequencyBinCount : Math.max(16, Math.floor(fftSize / 2));
      const freqData = new Uint8Array(binCount);
      const timeData = new Uint8Array(binCount);

      let hasRealAudioData = false;
      if (analyser) {
        try {
          analyser.getByteFrequencyData(freqData);
          analyser.getByteTimeDomainData(timeData);
          hasRealAudioData = true;
        } catch (e) {
          hasRealAudioData = false;
        }
      }

      if (!hasRealAudioData) {
        // Generar buffer sintetizado interactivo en vivo si el audio está en pausa o silenciado
        for (let i = 0; i < binCount; i++) {
          const val = Math.floor(
            128 + Math.sin(i * 0.12 + phase * 2.2) * 85 + (Math.random() * 25 - 12)
          );
          freqData[i] = Math.max(0, Math.min(255, val));
          timeData[i] = Math.max(0, Math.min(255, Math.floor(128 + Math.cos(i * 0.09 + phase * 1.8) * 65)));
        }
      }

      // Si el Modo Diagnóstico está ACTIVO: Superponer Barras de Espectro FFT + Onda Temporal de Buffer
      if (isDiagnostic) {
        // 1. Barras de Espectro FFT de Frecuencia
        const barWidth = width / binCount;
        for (let i = 0; i < binCount; i++) {
          const barHeight = (freqData[i] / 255) * (height * 0.78);
          const x = i * barWidth;
          const y = height - barHeight;

          const ratio = freqData[i] / 255;
          if (ratio > 0.75) {
            ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
          } else if (ratio > 0.4) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.65)";
          } else {
            ctx.fillStyle = "rgba(6, 182, 212, 0.55)";
          }
          ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
        }

        // 2. Línea en tiempo real del Buffer Domain en amarillo brillante
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#fef08a"; // Amarillo Neón
        ctx.shadowColor = "#fef08a";
        ctx.shadowBlur = 8;
        const sliceWidth = width / binCount;
        let tx = 0;
        for (let i = 0; i < binCount; i++) {
          const v = timeData[i] / 128.0;
          const ty = (v * height) / 2;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
          tx += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Guías de Retícula FFT y Cuadrantes Frecuenciales
        ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(width * 0.25, 0); ctx.lineTo(width * 0.25, height);
        ctx.moveTo(width * 0.5, 0); ctx.lineTo(width * 0.5, height);
        ctx.moveTo(width * 0.75, 0); ctx.lineTo(width * 0.75, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Wave 1: Principal High-Res Resonance Wave
      ctx.lineWidth = 3;
      ctx.strokeStyle = mode === "transmitting" ? "#10b981" : "#34d399";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 15;

      ctx.beginPath();
      const waveFreq = Math.max(0.015, Math.min(0.12, (frequency % 200) / 1200 + 0.02));
      const glitchJitter = isGlitchingRef.current ? (Math.random() * 12 - 6) : 0;
      for (let x = 0; x < width; x += 2) {
        const amplitude = (height / 2.8) * (0.7 + 0.3 * Math.sin(x * 0.012 + phase * 0.8));
        const y = height / 2 + Math.sin(x * waveFreq + phase) * amplitude + (x % 6 === 0 ? glitchJitter : 0);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Wave 2: Harmonic Interference Secondary Wave (Amber/Gold)
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.9)";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const amplitude = (height / 3.5) * Math.cos(x * 0.015 - phase * 0.5);
        const y = height / 2 + Math.sin(x * (waveFreq * 1.5) - phase * 1.4) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Wave 3: Ultra High Frequency Pulse Layer
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.75)"; // Violet pulse
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 6;

      ctx.beginPath();
      for (let x = 0; x < width; x += 3) {
        const y = height / 2 + Math.sin(x * 0.18 + phase * 2.5) * (height / 6);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Random signal noise particles
      ctx.fillStyle = "rgba(52, 211, 153, 0.6)";
      for (let i = 0; i < 20; i++) {
        const nx = Math.random() * width;
        const ny = Math.random() * height;
        ctx.fillRect(nx, ny, 1.5, 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [frequency, mode, isDiagnostic, fftSize]);

  // Actualizar telemetría throttled para el HUD en Modo Diagnóstico (cada 350ms de forma segura)
  useEffect(() => {
    if (!isDiagnostic) return;

    const timer = setInterval(() => {
      const analyser = radioStatic.getAnalyser();
      const binCount = (analyser && analyser.frequencyBinCount) ? analyser.frequencyBinCount : 64;
      const freqData = new Uint8Array(binCount);

      if (analyser) {
        try {
          analyser.getByteFrequencyData(freqData);
        } catch (e) {}
      }

      let peak = 0;
      let sumSq = 0;
      let maxBin = 0;
      for (let i = 0; i < binCount; i++) {
        if (freqData[i] > peak) {
          peak = freqData[i];
          maxBin = i;
        }
        const norm = freqData[i] / 255;
        sumSq += norm * norm;
      }
      const rmsVal = Math.round(Math.sqrt(sumSq / binCount) * 100);
      const ctxSampleRate = radioStatic.getAudioContext()?.sampleRate || 44100;

      setDiagnosticTelemetry({
        peakVal: peak,
        rms: rmsVal,
        sampleRate: ctxSampleRate,
        activeBin: maxBin,
        bufferHead: Array.from(freqData.slice(0, 16)),
      });
    }, 350);

    return () => clearInterval(timer);
  }, [isDiagnostic]);

  const getProgressStageLabel = (p: number) => {
    if (p < 30) return "Iniciando barrido de portadora...";
    if (p < 60) return "Acoplando fase en la membrana interdimensional...";
    if (p < 90) return "Sincronizando resonancia de canal y decodificador...";
    return "Enlace preparado. Sintetizando respuesta de voz...";
  };

  return (
    <div className="text-center py-6 px-4 bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 border-2 border-emerald-400 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.45)] space-y-4 relative overflow-hidden">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />

      {/* Cabecera con Ondas de Frecuencia Animadas y Botón de Modo Diagnóstico */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 px-2">
        <DynamicFrequencyRadioWaves frequency={frequency} />
        
        <div className="text-center flex-1">
          <span className="text-sm md:text-base font-black font-mono text-emerald-300 uppercase tracking-wider block animate-flicker drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {label}
          </span>
          <span className="text-[10px] font-mono text-amber-300/90 tracking-widest uppercase block mt-0.5 font-bold">
            ⚡ FRECUENCIA ACTIVA: {frequency} {unit} | PLANO: {dimension}
          </span>
        </div>

        {/* Botón de Activación de Modo Diagnóstico FFT */}
        <button
          type="button"
          onClick={toggleDiagnosticMode}
          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
            isDiagnostic
              ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"
              : "bg-slate-950 text-slate-300 border-slate-700 hover:border-cyan-400 hover:text-cyan-300"
          }`}
          title="Superpone el buffer en tiempo real del Analizador de Audio (fftSize) sobre la señal"
        >
          <Cpu className={`w-4 h-4 ${isDiagnostic ? "text-slate-950 animate-spin" : "text-cyan-400"}`} />
          <span>{isDiagnostic ? "🔬 DIAGNÓSTICO: ON" : "🔬 MODO DIAGNÓSTICO"}</span>
        </button>
      </div>

      {/* Osciloscopio de Ondas con Superposición de Buffer FFT Diagnóstico (Canvas) */}
      <div className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${isDiagnostic ? "border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]" : "border-emerald-500/60 shadow-[inset_0_0_20px_rgba(16,185,129,0.3)]"} bg-slate-950 my-2 animate-glitch-oscilloscope`}>
        <canvas
          ref={canvasRef}
          width={520}
          height={95}
          className="w-full h-24 block"
        />
        {/* Retícula de dial de frecuencia */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#10b981_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-25" />
        
        {/* Indicador superior izquierdo */}
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-emerald-400/60 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-md">
          <Signal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{isDiagnostic ? "ANALIZADOR FFT EN TIEMPO REAL" : "ONDAS EN MOVIMIENTO"}</span>
        </div>

        {/* Indicador superior derecho */}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/60 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-md">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>fftSize: {fftSize} | Bins: {fftSize / 2}</span>
        </div>

        {/* NotificaciónFlotante de Interferencia Anómala Inesperada */}
        {anomalousEvent && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-amber-950/90 border border-amber-400 text-amber-200 text-[10px] font-mono font-black animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.6)] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>{anomalousEvent}</span>
          </div>
        )}
      </div>

      {/* PANEL SUPERPUESTO DE MODO DIAGNÓSTICO (TELEMETRÍA DE BUFFER FFT) */}
      {isDiagnostic && (
        <div className="bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-2 border-cyan-400/80 p-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] text-left space-y-3 animate-fade-in relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-cyan-500/30 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300 animate-pulse" />
              <h4 className="text-xs font-mono font-black text-cyan-200 uppercase tracking-widest flex items-center gap-1.5">
                <span>📟 TELEMETRÍA Y BUFFER DEL ANALIZADOR DE AUDIO</span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 px-2 py-0.5 rounded text-[9px]">
                  fftSize = {fftSize}
                </span>
              </h4>
            </div>

            {/* Selector interactivo de fftSize */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-cyan-500/40 shrink-0">
              <span className="text-[10px] font-mono text-cyan-300/80 uppercase font-bold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>FFT SIZE:</span>
              </span>
              <div className="flex gap-1">
                {fftOptions.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectFftSize(sz)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-all cursor-pointer ${
                      fftSize === sz
                        ? "bg-cyan-400 text-slate-950 font-black shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        : "bg-slate-950 text-slate-400 hover:text-cyan-200 border border-slate-800"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cuadrícula de Métricas en Tiempo Real */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Tamaño Buffer (fftSize)</span>
              <span className="text-sm font-mono font-black text-cyan-300">{fftSize} BITS</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Bins Frecuenciales</span>
              <span className="text-sm font-mono font-black text-emerald-300">{fftSize / 2} BINS</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Peak / RMS Vol</span>
              <span className="text-sm font-mono font-black text-amber-300">{diagnosticTelemetry.peakVal} / {diagnosticTelemetry.rms}%</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Pico Frecuencial</span>
              <span className="text-sm font-mono font-black text-cyan-200">
                {Math.round((diagnosticTelemetry.activeBin * (diagnosticTelemetry.sampleRate / 2)) / (fftSize / 2))} Hz
              </span>
            </div>
          </div>

          {/* Stream de Datos en Vivo (Raw Buffer Stream readout) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>FLUJO DE BYTES EN TIEMPO REAL (PRIMEROS 16 MUESTREOS DEL BUFFER):</span>
              </span>
              <span className="text-slate-400 font-mono text-[9px]">{diagnosticTelemetry.sampleRate} Hz Stream</span>
            </div>
            <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-mono text-[11px] text-cyan-300 flex flex-wrap gap-1.5 shadow-inner">
              {diagnosticTelemetry.bufferHead.length > 0 ? (
                diagnosticTelemetry.bufferHead.map((byte, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-bold"
                  >
                    0x{byte.toString(16).padStart(2, "0").toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">Muestreando canal...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AVISO IMPORTANTE DE ESPERA DE CONEXIÓN DE ALTA VISIBILIDAD */}
      <div className="bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 border-2 border-amber-400 p-3.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.4)] relative z-10 space-y-1.5 text-center max-w-lg mx-auto">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-400/80 text-amber-300 text-[11px] font-mono font-black uppercase tracking-wider animate-pulse">
          <Clock className="w-4 h-4 text-amber-300 animate-spin" />
          <span>⏳ POR FAVOR AGUARDE UNOS SEGUNDOS</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xs md:text-sm font-sans font-black text-white leading-snug">
          Estableciendo enlace interdimensional...{" "}
          <span className="text-amber-300 underline font-bold">NO SALGA NI ABANDONE ESTA PÁGINA</span>
        </p>
        <p className="text-[11px] font-mono text-emerald-300/90 leading-tight">
          La sintonización y la síntesis de respuesta de voz en tiempo real tardan unos instantes en canalizarse.
        </p>
      </div>

      {/* BARRA DE AVANCE DE ACOPLAMIENTO DE CONEXIÓN */}
      <div className="bg-slate-950/90 p-3 rounded-xl border border-emerald-500/40 max-w-lg mx-auto space-y-2 relative z-10 shadow-inner">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{getProgressStageLabel(progress)}</span>
          </span>
          <span className="text-amber-300 font-extrabold">{progress}% CONECTADO</span>
        </div>

        {/* Track / Bar */}
        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5 relative">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Indicador de Espera para Audio / Voz con botón de interacción directa */}
      <div className="bg-slate-900/95 p-3.5 rounded-xl border-2 border-emerald-400/80 max-w-lg mx-auto shadow-2xl space-y-2 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
          <p className="text-xs font-mono text-emerald-300 font-extrabold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            🎧 MANTENGA EL VOLUMEN ACTIVO Y AGUARDE LA EMISIÓN
          </p>
          <button
            type="button"
            onClick={() => radioStatic.start()}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md hover:scale-105"
            title="Activa o reinicia el zumbido de fondo si el navegador bloqueó el audio automático"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🔊 ACTIVAR ZUMBIDO</span>
          </button>
        </div>
        <p className="text-xs font-sans text-slate-200 leading-relaxed font-medium">
          {sublabel}. En un momento escuchará la emisión completa de la entidad con sonido de fondo ambiental.
        </p>
      </div>
    </div>
  );
};


