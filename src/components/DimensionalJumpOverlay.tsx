import React, { useEffect, useRef } from "react";
import { Sparkles, Zap, Radio, Globe } from "lucide-react";

interface DimensionalJumpOverlayProps {
  isActive: boolean;
  resonance: number;
  entity?: string;
  dimension?: string;
  onComplete?: () => void;
}

export const DimensionalJumpOverlay: React.FC<DimensionalJumpOverlayProps> = ({
  isActive,
  resonance,
  entity = "Inteligencia Desconocida",
  dimension = "Plano Desconocido",
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Timer para autocompletar la animación
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2200);

    // Canvas para destellos de choque de distorsión radial
    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(timer);

    const ctx = canvas.getContext("2d");
    if (!ctx) return () => clearTimeout(timer);

    let animationFrameId: number;
    let startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();

    // Generar partículas de túnel hiper-espacial
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const streakCount = 60;
    const streaks = Array.from({ length: streakCount }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 8,
      length: 10 + Math.random() * 40,
      dist: 5 + Math.random() * 30,
      width: 1 + Math.random() * 2.5,
      color: Math.random() > 0.5 ? "rgba(52, 211, 153, " : "rgba(168, 85, 247, ",
    }));

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000; // segundos
      const progress = Math.min(1, elapsed / 2.2);

      const width = canvas.width;
      const height = canvas.height;
      if (!width || !height || width <= 0 || height <= 0) {
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(render);
        }
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Efecto radial de hiper-salto
      ctx.save();
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.dist += s.speed * (1 + progress * 4);
        s.length += progress * 6;

        const x1 = centerX + Math.cos(s.angle) * s.dist;
        const y1 = centerY + Math.sin(s.angle) * s.dist;
        const x2 = centerX + Math.cos(s.angle) * (s.dist + s.length);
        const y2 = centerY + Math.sin(s.angle) * (s.dist + s.length);

        const alpha = Math.max(0, (1 - progress) * 0.85);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = s.width * (1 + progress);
        ctx.strokeStyle = s.color + alpha + ")";
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color + "1)";
        ctx.stroke();
      }
      ctx.restore();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl flex items-center justify-center">
      {/* Canvas de rayas estelares de hiper-salto */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Onda expansiva radial (Radial shockwave ring) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full border-4 border-emerald-400/80 animate-radial-shockwave shadow-[0_0_50px_rgba(16,185,129,0.8)]" />
        <div
          className="w-32 h-32 rounded-full border-2 border-violet-400/90 animate-radial-shockwave shadow-[0_0_40px_rgba(168,85,247,0.8)]"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-16 h-16 rounded-full border border-amber-300 animate-radial-shockwave shadow-[0_0_30px_rgba(245,158,11,0.9)]"
          style={{ animationDelay: "300ms" }}
        />
      </div>

      {/* Banner central flotante de confirmación de Salto Dimensional */}
      <div className="relative z-50 bg-slate-950/90 border-2 border-emerald-400/90 px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.6)] backdrop-blur-xl text-center max-w-md mx-4 animate-scale-up space-y-2">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-black tracking-widest uppercase animate-pulse">
          <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span>¡SALTO DIMENSIONAL DETECTADO!</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
        </div>

        <h3 className="text-base font-extrabold text-white font-mono tracking-tight flex items-center justify-center gap-2">
          <span>RESONANCIA SUPRA-CRÍTICA:</span>
          <span className="text-emerald-400 text-lg font-black drop-shadow-[0_0_12px_rgba(52,211,153,1)]">
            {resonance}%
          </span>
        </h3>

        <div className="text-xs font-mono text-slate-300 space-y-0.5">
          <p className="text-emerald-300/90 font-semibold flex items-center justify-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Plano: {dimension}</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Sincronización de acoplamiento de fase con:{" "}
            <strong className="text-slate-100">{entity}</strong>
          </p>
        </div>

        <div className="pt-1 flex items-center justify-center gap-2 text-[9px] font-mono text-emerald-400/80 uppercase tracking-wider">
          <Radio className="w-3 h-3 animate-ping text-emerald-400" />
          <span>Canal de vacío entrelazado y decodificado</span>
        </div>
      </div>
    </div>
  );
};
