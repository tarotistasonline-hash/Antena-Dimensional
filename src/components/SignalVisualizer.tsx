import { useEffect, useRef } from "react";

interface SignalVisualizerProps {
  frequency: number;
  unit: string;
  intensity: number;
  status: "success" | "noise" | "anomaly" | "whisper" | "idle";
  useGaussianFilter?: boolean;
  isLowPowerMode?: boolean;
}

export default function SignalVisualizer({
  frequency,
  unit,
  intensity,
  status,
  useGaussianFilter = false,
  isLowPowerMode = false,
}: SignalVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let offset = 0;
    let lastTime = 0;
    const targetFps = 20; // Maintain performance for smooth 3D render, lower in idle
    const interval = 1000 / targetFps;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (timestamp: number) => {
      animationId = requestAnimationFrame(render);

      // Frame rate limiting to save CPU / battery on low power mode or idle state
      const fpsLimit = isLowPowerMode ? 10 : status === "idle" ? 12 : 24;
      const elapsed = timestamp - lastTime;
      if (elapsed < 1000 / fpsLimit) {
        return;
      }
      lastTime = timestamp - (elapsed % (1000 / fpsLimit));

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      if (!width || !height || width <= 0 || height <= 0) {
        return;
      }

      // Draw futuristic dark space background with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#020617"); // Dark Slate
      bgGrad.addColorStop(1, "#090d1f"); // Midnight Deep Blue
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Configure colors and waves based on active state
      let baseAmp = height * 0.18 * (intensity / 100);
      let baseSpeed = 0.04;
      let baseFreq = 0.03;
      let glowColor = "rgba(16, 185, 129, 0.4)";
      let wireColor = "rgba(16, 185, 129, 0.15)";
      let activeColor = "rgba(16, 185, 129, 0.85)";

      if (status === "idle") {
        baseAmp = height * 0.03;
        baseSpeed = 0.01;
        baseFreq = 0.015;
        glowColor = "rgba(245, 158, 11, 0.15)";
        wireColor = "rgba(245, 158, 11, 0.06)";
        activeColor = "rgba(245, 158, 11, 0.4)";
      } else if (status === "noise") {
        baseAmp = height * 0.1;
        baseSpeed = 0.18;
        baseFreq = 0.08;
        glowColor = useGaussianFilter ? "rgba(56, 189, 248, 0.5)" : "rgba(148, 163, 184, 0.2)";
        wireColor = useGaussianFilter ? "rgba(56, 189, 248, 0.2)" : "rgba(148, 163, 184, 0.08)";
        activeColor = useGaussianFilter ? "rgba(56, 189, 248, 0.95)" : "rgba(148, 163, 184, 0.6)";
      } else if (status === "anomaly") {
        baseAmp = height * 0.26;
        baseSpeed = 0.08;
        baseFreq = 0.045;
        glowColor = "rgba(239, 68, 68, 0.35)";
        wireColor = "rgba(239, 68, 68, 0.14)";
        activeColor = "rgba(239, 68, 68, 0.85)";
      } else if (status === "whisper") {
        baseAmp = height * 0.08;
        baseSpeed = 0.025;
        baseFreq = 0.05;
        glowColor = useGaussianFilter ? "rgba(56, 189, 248, 0.6)" : "rgba(168, 85, 247, 0.3)";
        wireColor = useGaussianFilter ? "rgba(56, 189, 248, 0.22)" : "rgba(168, 85, 247, 0.12)";
        activeColor = useGaussianFilter ? "rgba(56, 189, 248, 0.95)" : "rgba(192, 132, 252, 0.8)";
      }

      if (useGaussianFilter && (status === "success" || status === "idle") && intensity < 50) {
        glowColor = "rgba(56, 189, 248, 0.5)";
        activeColor = "rgba(56, 189, 248, 0.9)";
      }

      // Frequency factor
      const normalizedFreq = Math.min(Math.max(frequency / 400, 0.3), 2.5);
      baseFreq *= normalizedFreq;

      // 3D Grid dimensions & projection
      // grid covers x: -width/2 to width/2, z: depth_start to depth_end
      const cols = 22; // horizontal density
      const rows = 12; // depth density
      const zNear = 60;
      const zFar = 320;
      const fov = 160; // Focal length

      // Perspective project helper
      const project = (x3d: number, y3d: number, z3d: number) => {
        const scale = fov / (fov + z3d);
        const screenX = width / 2 + x3d * scale;
        // Shift horizon upward for a slight bird-eye tilted 3D plane
        const screenY = height * 0.45 + y3d * scale;
        return { x: screenX, y: screenY, scale };
      };

      // Wave math for any grid point
      const getWaveHeight = (gridX: number, gridZ: number) => {
        if (status === "idle") {
          let hIdle = Math.sin(gridX * baseFreq + offset) * baseAmp;
          if (useGaussianFilter) hIdle *= 1.8;
          return hIdle;
        }

        let h = 0;
        const distFromCenter = Math.sqrt(gridX * gridX + (gridZ - 190) * (gridZ - 190)) * 0.01;

        if (status === "noise") {
          if (useGaussianFilter) {
            // Gaussian kernel convolution: e^(-x^2 / (2*sigma^2))
            // Filters out random high-frequency chaotic spikes and amplifies underlying signal
            const sigma = 90;
            const gaussianWeight = Math.exp(-Math.pow(gridX, 2) / (2 * Math.pow(sigma, 2)));
            const carrier = Math.sin(gridX * baseFreq + offset) * baseAmp * 2.2;
            const residualNoise = (Math.random() - 0.5) * (baseAmp * 0.08); // 90% noise reduction
            h = carrier * gaussianWeight + residualNoise;
          } else {
            // Chaos waves/spikes
            h = Math.sin(gridX * baseFreq + offset) * Math.cos(gridZ * 0.04 - offset * 1.5) * baseAmp;
            h += (Math.sin(gridX * 0.1 + offset * 3) + Math.cos(gridZ * 0.08)) * (baseAmp * 0.4);
            h += (Math.random() - 0.5) * (baseAmp * 0.6); // high noise
          }
        } else if (status === "anomaly") {
          h = Math.sin(gridX * baseFreq + offset) * Math.cos(gridZ * 0.02 - offset) * baseAmp;
          h += Math.sin(-gridX * 0.02 + gridZ * 0.035 + offset * 1.8) * (baseAmp * 0.5);
          h += Math.sin(distFromCenter * 5 - offset * 2.5) * (baseAmp * 0.3);
          if (useGaussianFilter) {
            const sigma = 120;
            const gaussianWeight = Math.exp(-Math.pow(gridX, 2) / (2 * Math.pow(sigma, 2)));
            h = h * (0.6 + 0.8 * gaussianWeight);
          }
        } else if (status === "whisper") {
          if (useGaussianFilter) {
            // Low-intensity whisper amplification with Gaussian smoothing
            const sigma = 100;
            const gaussianWeight = Math.exp(-Math.pow(gridX, 2) / (2 * Math.pow(sigma, 2)));
            const carrier = Math.sin(gridX * baseFreq - offset) * Math.cos(gridZ * 0.015 + offset * 0.5) * (baseAmp * 2.6);
            h = carrier * gaussianWeight;
          } else {
            // Deep, slow, harmonic interference ripples
            h = Math.sin(gridX * baseFreq - offset) * Math.cos(gridZ * 0.015 + offset * 0.5) * baseAmp;
            h += Math.sin(gridX * 0.015 + gridZ * 0.02 + offset) * (baseAmp * 0.35);
          }
        } else {
          // "success" / Standard coherent transmission waves
          if (useGaussianFilter && intensity < 60) {
            const sigma = 110;
            const gaussianWeight = Math.exp(-Math.pow(gridX, 2) / (2 * Math.pow(sigma, 2)));
            const carrier = Math.sin(gridX * baseFreq + offset) * Math.cos(gridZ * 0.012 - offset * 0.8) * (baseAmp * 2.0);
            h = carrier * (0.5 + 0.7 * gaussianWeight);
          } else {
            h = Math.sin(gridX * baseFreq + offset) * Math.cos(gridZ * 0.012 - offset * 0.8) * baseAmp;
            h += Math.sin(gridX * 0.02 - offset * 1.4) * (baseAmp * 0.3);
          }
        }

        // Dampen waves slightly near the left/right boundaries to keep rendering clean
        const edgeDamp = Math.cos((gridX / (width * 0.85)) * Math.PI / 2);
        return h * Math.max(0, edgeDamp);
      };

      // Precalculate grid coordinates
      const points: { x: number; y: number; scale: number; heightVal: number }[][] = [];
      
      for (let r = 0; r < rows; r++) {
        points[r] = [];
        const z3d = zNear + (r / (rows - 1)) * (zFar - zNear);
        // Alpha fades as we get further back (fog effect)
        const depthAlpha = Math.pow(1 - r / (rows - 1), 1.4);

        for (let c = 0; c < cols; c++) {
          const xPercent = c / (cols - 1); // 0 to 1
          const x3d = (xPercent - 0.5) * width * 1.4; // wider span in 3D

          // Calculate wave elevation
          const waveElevation = getWaveHeight(x3d, z3d);

          // Standard baseline tilted downward slightly
          const baseHeight = height * 0.2; 
          const y3d = baseHeight + waveElevation;

          points[r][c] = {
            ...project(x3d, y3d, z3d),
            heightVal: waveElevation,
          };
        }
      }

      // 1. Draw Transversal Lines (left to right, back to front)
      for (let r = 0; r < rows; r++) {
        const depthRatio = r / (rows - 1);
        const depthAlpha = Math.pow(1 - depthRatio, 1.3); // Fade far lines
        
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const pt = points[r][c];
          if (c === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = wireColor.replace(/[\d.]+\)$/, `${depthAlpha * 0.85})`);
        ctx.lineWidth = Math.max(0.6, 1.4 * (1 - depthRatio * 0.7));
        ctx.stroke();
      }

      // 2. Draw Longitudinal Lines (back to front)
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const pt = points[r][c];
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        // Emphasize central axis
        const isCenter = Math.abs(c - (cols - 1) / 2) < 1.1;
        const colAlpha = isCenter ? 0.35 : 0.15;
        
        ctx.strokeStyle = wireColor.replace(/[\d.]+\)$/, `${colAlpha})`);
        ctx.lineWidth = isCenter ? 1.5 : 0.8;
        ctx.stroke();
      }

      // 3. Draw active wave horizon (highlight the primary wave line at high contrast)
      // We pick a middle-foreground row (e.g., row 8 of 12) for the prominent "active signal" line
      const activeRow = Math.floor(rows * 0.75);
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const pt = points[activeRow][c];
        if (c === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // 4. Draw wandering energy particles in dimensional space (moving down the grid rows)
      const particleTime = offset * 4;
      for (let i = 0; i < 4; i++) {
        // Deterministic paths based on index
        const colIndex = Math.floor((Math.sin(i * 12.3 + particleTime * 0.05) * 0.5 + 0.5) * (cols - 1));
        const progress = ((particleTime * 0.15 + i * 0.25) % 1); // 0 to 1 down rows
        const rowIndexFloat = progress * (rows - 1);
        const rowLow = Math.floor(rowIndexFloat);
        const rowHigh = Math.min(rows - 1, rowLow + 1);
        const rowFrac = rowIndexFloat - rowLow;

        const ptLow = points[rowLow][colIndex];
        const ptHigh = points[rowHigh][colIndex];

        // Interpolate projected coordinates
        const px = ptLow.x + (ptHigh.x - ptLow.x) * rowFrac;
        const py = ptLow.y + (ptHigh.y - ptLow.y) * rowFrac;
        const pScale = ptLow.scale + (ptHigh.scale - ptLow.scale) * rowFrac;
        const intensityAlpha = Math.sin(progress * Math.PI); // Fades in and out

        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.5, 4 * pScale), 0, Math.PI * 2);
        ctx.fillStyle = activeColor.replace(/[\d.]+\)$/, `${intensityAlpha})`);
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Cosmic background stars/noise dust
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      for (let s = 0; s < 12; s++) {
        const starX = (Math.sin(s * 412 + offset * 0.02) * 0.5 + 0.5) * width;
        // Keep stars near the upper background horizon
        const starY = (Math.cos(s * 187) * 0.5 + 0.5) * (height * 0.4);
        ctx.fillRect(starX, starY, 1, 1);
      }

      offset += baseSpeed;
    };

    // Begin render loop
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [frequency, unit, intensity, status, useGaussianFilter]);

  return (
    <div id="visualizer-container" className="relative w-full h-32 md:h-40 bg-slate-950 border border-emerald-900/30 rounded-xl overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.85)] animate-glitch-oscilloscope">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* HUD Info Header */}
      <div className="absolute top-2.5 left-3.5 flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === "idle" ? "bg-amber-400" :
            status === "success" ? "bg-emerald-400" :
            status === "noise" ? "bg-gray-400" :
            "bg-red-500"
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            status === "idle" ? "bg-amber-500" :
            status === "success" ? "bg-emerald-500" :
            status === "noise" ? "bg-gray-500" :
            "bg-red-600"
          }`}></span>
        </span>
        <span className="font-mono text-[10px] uppercase text-emerald-400/80 font-bold tracking-widest">
          {status === "idle" ? "ANÁLISIS COAXIAL EN REPOSO" :
           status === "success" ? "VECTOR DIMENSIONAL ESTABLE" :
           status === "noise" ? "RESONANCIA AMBIENTE (ESTÁTICA)" :
           status === "anomaly" ? "ADVERTENCIA: CONVERGENCIA ANÓMALA" :
           "PERCEPCIÓN EXTRASENSORIAL SUTIL"}
        </span>
      </div>
      
      {useGaussianFilter && (
        <div className="absolute top-2.5 right-3.5 flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px] bg-cyan-950/85 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>GAUSSIANO: ON [σ=1.5 | +3.2 dB CLARIDAD]</span>
        </div>
      )}

      {status === "idle" && !useGaussianFilter && (
        <div className="absolute top-2.5 right-3.5 flex items-center gap-1 font-mono text-[8px] bg-amber-950/45 text-amber-400/90 px-2 py-0.5 rounded border border-amber-900/30 animate-pulse">
          <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping mr-1" />
          AHORRO DE ENERGÍA ACTIVO [12 FPS]
        </div>
      )}

      <div className="absolute bottom-2.5 right-3.5 font-mono text-[9px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900 shadow-md">
        <span className="text-emerald-400 font-bold">{frequency} {unit}</span>
        <span className="mx-1 text-slate-700">|</span>
        <span className="text-slate-400">AMPLITUD {intensity}%</span>
      </div>
    </div>
  );
}

