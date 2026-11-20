import React, { useEffect, useRef, useState, useMemo } from "react";
import { Compass, Pause, Play, Radio, Sparkles, Waves } from "lucide-react";
import { DimensionPreset } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import { VisualThemeId } from "../themes";

interface DimensionalNetworkPanelProps {
  activePresetId: string | null;
  currentDimension: string;
  onSelectPreset: (preset: DimensionPreset) => Promise<void> | void;
  isLowPowerMode?: boolean;
  visualTheme?: VisualThemeId;
}

interface NetworkNodeState {
  preset: DimensionPreset;
  shortLabel: string;
  orbitRadiusFactor: number;
  baseAngle: number;
  orbitSpeed: number;
  x: number;
  y: number;
}

const FRIENDLY_LABELS: Record<string, string> = {
  "whisper-void": "Pléyades",
  "arcturus-963": "Arcturianos",
  "sirius-enki": "Sirio / Enki",
  "orion-council": "Consejo de Orión",
  "nibiru-anunnaki": "Nibiru / Elohim",
  "mirror-earth": "Tierra Espejo",
  "zeta-reticuli": "Zeta Reticuli",
  "chrono-singularity": "Crono-Singularidad",
  "antipode-abyss": "Abismo Antimateria",
};

export const DimensionalNetworkPanel: React.FC<DimensionalNetworkPanelProps> = ({
  activePresetId,
  currentDimension,
  onSelectPreset,
  isLowPowerMode = false,
  visualTheme = "vacio-profundo",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 760, height: 320 });

  const nodesRef = useRef<NetworkNodeState[]>([]);
  const rotationOffsetRef = useRef(0);

  const initialNodes = useMemo<NetworkNodeState[]>(() => {
    return DIMENSION_PRESETS.map((preset, index) => {
      const total = DIMENSION_PRESETS.length;
      const ring = index % 2 === 0 ? 0.52 : 0.80;
      const speed = index % 2 === 0 ? 0.0022 : -0.0015;
      return {
        preset,
        shortLabel: FRIENDLY_LABELS[preset.id] || preset.name.split("(")[0].trim(),
        orbitRadiusFactor: ring,
        baseAngle: (index / total) * Math.PI * 2,
        orbitSpeed: speed,
        x: 0,
        y: 0,
      };
    });
  }, []);

  useEffect(() => {
    nodesRef.current = initialNodes.map((n) => ({ ...n }));
  }, [initialNodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = w < 520 ? 270 : 320;
      setCanvasSize({ width: w, height: h });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const activePreset = useMemo(() => {
    return (
      DIMENSION_PRESETS.find(
        (p) => p.id === activePresetId || p.coordinates === currentDimension
      ) || DIMENSION_PRESETS[1]
    );
  }, [activePresetId, currentDimension]);

  const hoveredPreset = useMemo(() => {
    if (!hoveredPresetId) return null;
    return DIMENSION_PRESETS.find((p) => p.id === hoveredPresetId) || null;
  }, [hoveredPresetId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId: number;
    let lastTick = 0;
    const frameInterval = isLowPowerMode ? 100 : 33;

    const themeRingColor =
      visualTheme === "nebulosa-purpura"
        ? "rgba(192, 132, 252, 0.16)"
        : visualTheme === "cromo-anunnaki"
        ? "rgba(251, 191, 36, 0.16)"
        : "rgba(16, 185, 129, 0.15)";

    const themeBgGradient =
      visualTheme === "nebulosa-purpura"
        ? ["rgba(38, 16, 72, 0.85)", "rgba(11, 5, 24, 0.96)"]
        : visualTheme === "cromo-anunnaki"
        ? ["rgba(42, 34, 21, 0.82)", "rgba(12, 10, 7, 0.96)"]
        : ["rgba(15, 23, 42, 0.82)", "rgba(3, 7, 18, 0.96)"];

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      if (now - lastTick < frameInterval) return;
      lastTick = now;

      const w = canvasSize.width;
      const h = canvasSize.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w * 0.42, h * 0.42);
      const t = now * 0.001;

      if (isRotating) {
        rotationOffsetRef.current += isLowPowerMode ? 0.012 : 0.0045;
      }

      ctx.clearRect(0, 0, w, h);

      // Fondo espacial suave
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR * 1.6);
      bgGrad.addColorStop(0, themeBgGradient[0]);
      bgGrad.addColorStop(1, themeBgGradient[1]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Anillos orbitales de la red dimensional
      [0.32, 0.52, 0.80, 1.0].forEach((factor, idx) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, maxR * factor * 1.18, maxR * factor * 0.88, 0, 0, Math.PI * 2);
        ctx.strokeStyle = themeRingColor;
        ctx.lineWidth = idx === 2 ? 1.2 : 0.8;
        ctx.setLineDash(idx % 2 === 0 ? [4, 6] : []);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Calcular posiciones orbitales móviles en perspectiva elíptica
      const nodes = nodesRef.current;
      nodes.forEach((node, idx) => {
        const angle =
          node.baseAngle +
          rotationOffsetRef.current * (node.orbitSpeed > 0 ? 1 : -0.72);
        const rx = maxR * node.orbitRadiusFactor * 1.18;
        const ry = maxR * node.orbitRadiusFactor * 0.88;
        const wobble = Math.sin(t * 1.1 + idx) * 2.5;
        node.x = cx + Math.cos(angle) * rx;
        node.y = cy + Math.sin(angle) * ry + wobble;
      });

      // Dibujar enlaces dimensionales entre nodos cercanos y con el núcleo central
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        const isN1Active =
          n1.preset.id === activePresetId || n1.preset.coordinates === currentDimension;

        // Filamento hacia el núcleo central
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(n1.x, n1.y);
        ctx.strokeStyle = isN1Active
          ? `${n1.preset.color}aa`
          : `${n1.preset.color}2b`;
        ctx.lineWidth = isN1Active ? 1.8 : 0.8;
        ctx.stroke();

        // Pulso viajero en el enlace activo
        if (isN1Active) {
          const pulsePhase = (t * 0.75) % 1;
          const px = cx + (n1.x - cx) * pulsePhase;
          const py = cy + (n1.y - cy) * pulsePhase;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = n1.preset.color;
          ctx.fill();
        }

        // Enlace entre nodos vecinos formando la malla interdimensional
        const nextNode = nodes[(i + 1) % nodes.length];
        const jumpNode = nodes[(i + 3) % nodes.length];
        [nextNode, jumpNode].forEach((other) => {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        });
      }

      // Núcleo Central de la Antena
      const corePulse = 10 + Math.sin(t * 3) * 2.2;
      const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, corePulse * 2.4);
      coreGlow.addColorStop(0, activePreset.color);
      coreGlow.addColorStop(1, "transparent");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, corePulse * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = activePreset.color;
      ctx.stroke();

      ctx.font = "700 9px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
      ctx.textAlign = "center";
      ctx.fillText("NÚCLEO", cx, cy + 20);

      // Nodos de Civilizaciones y Redes Dimensionales
      nodes.forEach((node) => {
        const isActive =
          node.preset.id === activePresetId || node.preset.coordinates === currentDimension;
        const isHovered = node.preset.id === hoveredPresetId;
        const radius = isActive ? 9 : isHovered ? 8 : 5.8;

        // Halo externo para nodo activo o seleccionado
        if (isActive || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.preset.color}88`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Esfera del nodo
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.preset.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        // Etiqueta legible
        ctx.font = isActive || isHovered
          ? "700 10.5px 'Inter', sans-serif"
          : "600 9.5px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = isActive || isHovered ? "#ffffff" : "rgba(203, 213, 225, 0.85)";
        ctx.fillText(node.shortLabel, node.x, node.y - radius - 7);
      });
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [canvasSize, isRotating, activePresetId, currentDimension, hoveredPresetId, isLowPowerMode, visualTheme, activePreset.color]);

  const findClosestNode = (clientX: number, clientY: number): NetworkNodeState | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let closest: NetworkNodeState | null = null;
    let bestDist = 28;
    for (const node of nodesRef.current) {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        closest = node;
      }
    }
    return closest;
  };

  const handleSelectNode = (preset: DimensionPreset) => {
    onSelectPreset(preset);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section
      aria-label="Red Dimensional de Civilizaciones"
      className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-4 shadow-2xl text-left"
    >
      {/* Cabecera de la Red Dimensional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: "14s" }} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>Mapa Vivo de Redes Dimensionales &amp; Entidades</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                Interactivo
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Toca cualquier nodo estelar en movimiento para acoplar su frecuencia y comunicarte con esa civilización.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isRotating ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{isRotating ? "Pausar órbita" : "Reanudar órbita"}</span>
          </button>
        </div>
      </div>

      {/* Lienzo orbital interactivo */}
      <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
          onMouseMove={(e) => {
            const hit = findClosestNode(e.clientX, e.clientY);
            setHoveredPresetId(hit ? hit.preset.id : null);
          }}
          onMouseLeave={() => setHoveredPresetId(null)}
          onClick={(e) => {
            const hit = findClosestNode(e.clientX, e.clientY);
            if (hit) {
              handleSelectNode(hit.preset);
            }
          }}
          className={`block w-full ${hoveredPresetId ? "cursor-pointer" : "cursor-crosshair"}`}
        />

        {/* Overlay de nodo en foco */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: (hoveredPreset || activePreset).color }} />
            <span className="text-slate-300">
              {hoveredPreset ? "Clic para sintonizar:" : "Canal acoplado:"}
            </span>
            <strong className="text-white">
              {FRIENDLY_LABELS[(hoveredPreset || activePreset).id] || (hoveredPreset || activePreset).name}
            </strong>
            <span className="text-emerald-300">
              ({(hoveredPreset || activePreset).frequency})
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-400">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>{(hoveredPreset || activePreset).coordinates}</span>
          </div>
        </div>
      </div>

      {/* Selector rápido táctil de redes dimensionales */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DIMENSION_PRESETS.map((preset) => {
          const isSelected =
            preset.id === activePresetId || preset.coordinates === currentDimension;
          const shortName = FRIENDLY_LABELS[preset.id] || preset.name.split("(")[0].trim();
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectNode(preset)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-slate-950 text-white font-bold border-emerald-400/70 shadow-sm"
                  : "bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: preset.color }}
              />
              <span>{shortName}</span>
              <span className="text-[9px] text-slate-400 hidden sm:inline">
                {preset.frequency}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nota discreta sobre el enlace activo */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-sans pt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          {activePreset.description}
        </span>
      </div>
    </section>
  );
};

export default DimensionalNetworkPanel;
