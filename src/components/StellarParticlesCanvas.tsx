import React, { useEffect, useRef } from "react";

interface StellarParticlesCanvasProps {
  isActive: boolean;
  mode?: "tuning" | "transmitting" | "idle";
  isLowPowerMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  pulseSpeed: number;
  pulseAngle: number;
  decay?: number;
  glow: number;
}

export const StellarParticlesCanvas: React.FC<StellarParticlesCanvasProps> = ({
  isActive,
  mode = "idle",
  isLowPowerMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const opacityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Paleta de colores para estrellas y polvo estelar según el modo
    const getParticleColor = (currentMode: string) => {
      if (currentMode === "transmitting") {
        const colors = [
          "rgba(168, 85, 247, ", // Violeta
          "rgba(236, 72, 153, ", // Rosa cuántico
          "rgba(245, 158, 11, ", // Ámbar de transmisión
          "rgba(56, 189, 248, ", // Cían
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      } else {
        // Tuning mode
        const colors = [
          "rgba(52, 211, 153, ", // Esmeralda sintonización
          "rgba(45, 212, 191, ", // Turquesa
          "rgba(56, 189, 248, ", // Cían estelar
          "rgba(250, 204, 21, ", // Oro estelar
          "rgba(167, 139, 250, ", // Violeta estelar
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }
    };

    // Inicializar partículas estelares
    const particleCount = isLowPowerMode ? 35 : 85;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (mode === "transmitting" ? 1.2 : 0.6),
        vy: -0.3 - Math.random() * (mode === "transmitting" ? 1.5 : 0.8),
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random(),
        maxAlpha: 0.4 + Math.random() * 0.5,
        color: getParticleColor(mode),
        pulseSpeed: 0.01 + Math.random() * 0.03,
        pulseAngle: Math.random() * Math.PI * 2,
        glow: Math.random() * 12 + 4,
      });
    }
    particlesRef.current = particles;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Transición suave de opacidad del canvas
      const targetOpacity = isActive ? 1 : 0;
      const opacitySpeed = isActive ? 1.5 : 1.0;

      if (opacityRef.current < targetOpacity) {
        opacityRef.current = Math.min(1, opacityRef.current + dt * opacitySpeed);
      } else if (opacityRef.current > targetOpacity) {
        opacityRef.current = Math.max(0, opacityRef.current - dt * opacitySpeed);
      }

      ctx.clearRect(0, 0, width, height);

      if (opacityRef.current > 0.001) {
        ctx.globalAlpha = opacityRef.current;

        // Renderizado y actualización de partículas
        const pts = particlesRef.current;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];

          // Actualizar posición flotante
          p.x += p.vx * (mode === "transmitting" ? 1.5 : 1.0);
          p.y += p.vy * (mode === "transmitting" ? 1.5 : 1.0);

          // Pulso estelar de brillo
          p.pulseAngle += p.pulseSpeed;
          const currentAlpha =
            (Math.sin(p.pulseAngle) * 0.5 + 0.5) * p.maxAlpha * opacityRef.current;

          // Reaparición si sale de la pantalla
          if (p.y < -20) {
            p.y = height + 10;
            p.x = Math.random() * width;
            p.color = getParticleColor(mode);
          }
          if (p.x < -20) p.x = width + 10;
          if (p.x > width + 20) p.x = -10;

          // Dibujar destello y partícula estelar
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

          // Glow exterior estelar
          ctx.shadowBlur = p.glow;
          ctx.shadowColor = p.color + "0.8)";
          ctx.fillStyle = p.color + currentAlpha + ")";
          ctx.fill();

          // Núcleo brillante
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, " + currentAlpha * 0.9 + ")";
          ctx.fill();

          ctx.restore();
        }
      }

      // Continuar loop animado si activo o mientras se desvanece
      if (isActive || opacityRef.current > 0.001) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        animFrameRef.current = null;
      }
    };

    if (isActive || opacityRef.current > 0) {
      animFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, mode, isLowPowerMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{ opacity: isActive ? 1 : 0 }}
    />
  );
};
