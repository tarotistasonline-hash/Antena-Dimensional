import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { DimensionPreset, LogEntry, SignalResponse } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Radio,
  Zap,
  ShieldAlert,
  Sliders,
  Eye,
  Info,
  Globe,
  Play,
  Pause,
  Trash2,
  Activity,
} from "lucide-react";

interface StarMapVisualizerProps {
  logs: LogEntry[];
  currentDimension: string;
  tuningResult: SignalResponse | null;
  onSelectDimension: (preset: DimensionPreset) => void;
  frequencyValue: number;
  frequencyUnit: string;
  isLowPowerMode?: boolean;
}

interface MapNode {
  id: string;
  name: string;
  coordinates: string;
  frequency: string;
  dangerLevel: "Mínimo" | "Moderado" | "Elevado" | "Crítico" | "Desconocido";
  entityType: string;
  color: string;
  presetObj?: DimensionPreset;
  // Spatial coordinates on celestial sphere (angle in radians, distance factor 0.2 to 0.8)
  angle: number;
  radiusFactor: number;
  // Calculated resonance level 0 - 100
  resonance: number;
  lastActiveTime?: string;
}

interface ContactTrailPoint {
  id: string;
  dimensionName: string;
  nodeId: string;
  angle: number;
  radiusFactor: number;
  resonance: number;
  createdAt: number;
  duration: number;
  color: string;
}

export default function StarMapVisualizer({
  logs,
  currentDimension,
  tuningResult,
  onSelectDimension,
  frequencyValue,
  frequencyUnit,
  isLowPowerMode = false,
}: StarMapVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map viewport states (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [showCelestialGrid, setShowCelestialGrid] = useState<boolean>(true);
  const [filterDanger, setFilterDanger] = useState<string>("TODOS");

  // Persistent Trail State & Controls
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [trailDuration, setTrailDuration] = useState<number>(30000); // 30 seconds
  const [activeTrailsCount, setActiveTrailsCount] = useState<number>(0);
  const trailPointsRef = useRef<ContactTrailPoint[]>([]);

  // Selection & Inspector State
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);

  // Orbital Rotation Angle
  const rotationAngleRef = useRef<number>(0);

  // Combine Presets + Logged Custom Dimensions into Map Nodes
  const nodes = useMemo<MapNode[]>(() => {
    // Helper to calculate latest resonance for a dimension
    const getResonance = (dimName: string, defaultRes: number) => {
      if (currentDimension && dimName.toLowerCase().includes(currentDimension.toLowerCase()) && tuningResult) {
        return tuningResult.resonance;
      }
      const matchedLog = logs.find((l) => l.dimension.toLowerCase().includes(dimName.toLowerCase()));
      if (matchedLog) return matchedLog.resonance;
      return defaultRes;
    };

    // Preset mapping angles & radius factors for aesthetic cosmic layout
    const presetPlacements: Record<string, { angle: number; radiusFactor: number }> = {
      "mirror-earth": { angle: (35 * Math.PI) / 180, radiusFactor: 0.38 },
      "whisper-void": { angle: (115 * Math.PI) / 180, radiusFactor: 0.52 },
      "zeta-reticuli": { angle: (205 * Math.PI) / 180, radiusFactor: 0.44 },
      "chrono-singularity": { angle: (285 * Math.PI) / 180, radiusFactor: 0.65 },
      "antipode-abyss": { angle: (340 * Math.PI) / 180, radiusFactor: 0.78 },
      "nibiru-anunnaki": { angle: (75 * Math.PI) / 180, radiusFactor: 0.72 },
      "orion-council": { angle: (160 * Math.PI) / 180, radiusFactor: 0.58 },
      "sirius-enki": { angle: (240 * Math.PI) / 180, radiusFactor: 0.32 },
    };

    const result: MapNode[] = DIMENSION_PRESETS.map((preset, idx) => {
      const placement = presetPlacements[preset.id] || {
        angle: ((idx * 72 + 15) * Math.PI) / 180,
        radiusFactor: 0.4 + (idx % 3) * 0.15,
      };
      const resonance = getResonance(preset.name, 25 + idx * 12);
      return {
        id: preset.id,
        name: preset.name,
        coordinates: preset.coordinates,
        frequency: preset.frequency,
        dangerLevel: preset.dangerLevel,
        entityType: preset.entityType,
        color: preset.color,
        presetObj: preset,
        angle: placement.angle,
        radiusFactor: placement.radiusFactor,
        resonance,
      };
    });

    // Check for unique custom dimensions in logs not present in presets
    const existingNames = new Set(result.map((r) => r.name.toLowerCase()));
    logs.forEach((log, index) => {
      const cleanDim = log.dimension.trim();
      if (cleanDim && !existingNames.has(cleanDim.toLowerCase())) {
        existingNames.add(cleanDim.toLowerCase());
        const customAngle = ((index * 137.5 + 45) * Math.PI) / 180; // Golden angle distribution
        result.push({
          id: `custom-log-${index}`,
          name: cleanDim,
          coordinates: `VEC-${index + 1} // LOG`,
          frequency: log.frequency,
          dangerLevel: log.resonance > 75 ? "Elevado" : "Moderado",
          entityType: log.entity,
          color: "#a855f7", // purple
          angle: customAngle,
          radiusFactor: 0.5 + (index % 3) * 0.12,
          resonance: log.resonance,
          lastActiveTime: log.timestamp,
        });
      }
    });

    return result;
  }, [logs, currentDimension, tuningResult]);

  // Filter nodes based on danger level selection
  const filteredNodes = useMemo(() => {
    if (filterDanger === "TODOS") return nodes;
    return nodes.filter((n) => n.dangerLevel.toUpperCase() === filterDanger.toUpperCase());
  }, [nodes, filterDanger]);

  // --- PERSISTENT TRAIL SPAWNING LOGIC ---
  // Spawn contact trail point on tuningResult or currentDimension update
  useEffect(() => {
    if (!showTrails) return;
    if (currentDimension) {
      const matchedNode = nodes.find(
        (n) => n.name.toLowerCase().includes(currentDimension.toLowerCase()) || n.id === currentDimension
      );
      if (matchedNode) {
        const res = tuningResult ? tuningResult.resonance : matchedNode.resonance;
        trailPointsRef.current.push({
          id: `trail-tune-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dimensionName: matchedNode.name,
          nodeId: matchedNode.id,
          angle: matchedNode.angle,
          radiusFactor: matchedNode.radiusFactor,
          resonance: res,
          createdAt: Date.now(),
          duration: trailDuration,
          color: matchedNode.color,
        });
        if (trailPointsRef.current.length > 75) {
          trailPointsRef.current.shift();
        }
      }
    }
  }, [currentDimension, tuningResult, nodes, showTrails, trailDuration]);

  // Periodic contact point creation during continuous tuning
  useEffect(() => {
    if (!showTrails || !currentDimension) return;
    const interval = setInterval(() => {
      const matchedNode = nodes.find(
        (n) => n.name.toLowerCase().includes(currentDimension.toLowerCase()) || n.id === currentDimension
      );
      if (matchedNode) {
        const res = tuningResult ? tuningResult.resonance : matchedNode.resonance;
        trailPointsRef.current.push({
          id: `trail-loop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dimensionName: matchedNode.name,
          nodeId: matchedNode.id,
          angle: matchedNode.angle,
          radiusFactor: matchedNode.radiusFactor,
          resonance: res,
          createdAt: Date.now(),
          duration: trailDuration,
          color: matchedNode.color,
        });
        if (trailPointsRef.current.length > 75) {
          trailPointsRef.current.shift();
        }
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [currentDimension, tuningResult, nodes, showTrails, trailDuration]);

  // Starfield background generator (deterministic)
  const stars = useMemo(() => {
    const list = [];
    for (let i = 0; i < 220; i++) {
      list.push({
        x: (Math.sin(i * 99) * 0.5 + 0.5), // 0 to 1
        y: (Math.cos(i * 33) * 0.5 + 0.5),
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        color: i % 7 === 0 ? "#818cf8" : i % 11 === 0 ? "#67e8f9" : i % 13 === 0 ? "#fde047" : "#ffffff",
      });
    }
    return list;
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    const render = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Frame rate limiting on Low Power Mode (10 FPS) vs normal (30 FPS)
      const fpsLimit = isLowPowerMode ? 10 : 30;
      const elapsed = timestamp - lastTime;
      if (elapsed < 1000 / fpsLimit) {
        return;
      }
      lastTime = timestamp - (elapsed % (1000 / fpsLimit));
      // Handle canvas resize dynamically
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const baseRadius = Math.min(width, height) * 0.42 * zoom;

      // Update auto-rotation angle if enabled
      if (isAutoRotate) {
        rotationAngleRef.current += 0.0015;
      }
      const rot = rotationAngleRef.current;

      // 1. CLEAR CANVAS & DEEP SPACE BACKGROUND
      ctx.clearRect(0, 0, width, height);

      // Deep space radial gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, "#020617");
      bgGrad.addColorStop(0.6, "#030712");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Cosmic dust nebulas
      ctx.save();
      const nebula1 = ctx.createRadialGradient(
        centerX + Math.cos(rot * 0.5) * 80,
        centerY + Math.sin(rot * 0.5) * 80,
        10,
        centerX,
        centerY,
        baseRadius * 1.1
      );
      nebula1.addColorStop(0, "rgba(99, 102, 241, 0.06)");
      nebula1.addColorStop(0.5, "rgba(16, 185, 129, 0.03)");
      nebula1.addColorStop(1, "transparent");
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 2. STARRY FIELD (TWINKLING)
      const time = Date.now() * 0.002;
      stars.forEach((star) => {
        const starX = star.x * width;
        const starY = star.y * height;
        const currentAlpha = Math.abs(Math.sin(time * star.twinkleSpeed * 10 + star.x * 100)) * star.alpha;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(starX, starY, star.size * zoom, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. CELESTIAL GRID & ORBITAL RINGS
      if (showCelestialGrid) {
        ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        // Concentric Orbital Rings (Membrane distance boundaries)
        [0.25, 0.5, 0.75, 1.0].forEach((ringFactor, rIdx) => {
          const r = baseRadius * ringFactor;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.stroke();

          // Ring label
          ctx.fillStyle = "rgba(100, 116, 139, 0.5)";
          ctx.font = "8px 'JetBrains Mono', monospace";
          ctx.fillText(`PLANO-M${rIdx + 1} (${Math.round(ringFactor * 100)}%)`, centerX + r + 4, centerY - 2);
        });

        // Radial RA/Dec Vector Lines
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(a + rot * 0.2) * baseRadius * 1.05, centerY + Math.sin(a + rot * 0.2) * baseRadius * 1.05);
          ctx.stroke();
        }
        ctx.setLineDash([]); // Reset line dash
      }

      // 4. CENTRAL ANTENNA CORE (ORIGIN / EARTH)
      ctx.save();
      // Pulsing outer halo for Central Earth Antenna
      const pulseSize = 14 + Math.sin(time * 3) * 4;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, pulseSize * 2.5);
      coreGrad.addColorStop(0, "rgba(16, 185, 129, 0.9)");
      coreGrad.addColorStop(0.4, "rgba(16, 185, 129, 0.3)");
      coreGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Earth antenna core circle
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Inner white core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Core label
      ctx.fillStyle = "#34d399";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ANTENA TIERRA (ORIGEN)", centerX, centerY + 20 * zoom);
      ctx.restore();

      // 4.5. PERSISTENT CONTACT TRAILS (RASTRO PERSISTENTE DE SINTONIZACIÓN)
      if (showTrails && trailPointsRef.current.length > 0) {
        const now = Date.now();
        // Filter out expired points
        trailPointsRef.current = trailPointsRef.current.filter(
          (pt) => now - pt.createdAt < pt.duration
        );

        // Group points by dimensionName to draw connecting trail ribbons
        const trailGroups: Record<string, ContactTrailPoint[]> = {};
        trailPointsRef.current.forEach((pt) => {
          if (!trailGroups[pt.dimensionName]) {
            trailGroups[pt.dimensionName] = [];
          }
          trailGroups[pt.dimensionName].push(pt);
        });

        // A. Draw connecting trail ribbon segments between points of the same dimension
        Object.values(trailGroups).forEach((group) => {
          if (group.length < 2) return;
          const sorted = [...group].sort((a, b) => a.createdAt - b.createdAt);

          ctx.save();
          for (let i = 0; i < sorted.length - 1; i++) {
            const p1 = sorted[i];
            const p2 = sorted[i + 1];

            const age1 = now - p1.createdAt;
            const life1 = 1 - age1 / p1.duration;
            const age2 = now - p2.createdAt;
            const life2 = 1 - age2 / p2.duration;

            if (life1 <= 0 || life2 <= 0) continue;

            const x1 = centerX + Math.cos(p1.angle + rot) * (baseRadius * p1.radiusFactor);
            const y1 = centerY + Math.sin(p1.angle + rot) * (baseRadius * p1.radiusFactor);
            const x2 = centerX + Math.cos(p2.angle + rot) * (baseRadius * p2.radiusFactor);
            const y2 = centerY + Math.sin(p2.angle + rot) * (baseRadius * p2.radiusFactor);

            const avgRes = (p1.resonance + p2.resonance) / 2;
            const lineAlpha = Math.min(life1, life2) * 0.45;

            // Gradient line color based on signal intensity
            const lineGrad = ctx.createLinearGradient(x1, y1, x2, y2);
            if (avgRes >= 80) {
              lineGrad.addColorStop(0, "#f43f5e");
              lineGrad.addColorStop(1, "#f59e0b");
            } else if (avgRes >= 50) {
              lineGrad.addColorStop(0, "#10b981");
              lineGrad.addColorStop(1, "#06b6d4");
            } else {
              lineGrad.addColorStop(0, "#818cf8");
              lineGrad.addColorStop(1, "#c084fc");
            }

            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = (1.5 + (avgRes / 100) * 2.5) * zoom;
            ctx.globalAlpha = lineAlpha;
            ctx.setLineDash([3, 4]);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
        });

        // B. Draw individual contact trail points with signal intensity color gradients
        trailPointsRef.current.forEach((pt) => {
          const age = now - pt.createdAt;
          const lifeRatio = Math.max(0, 1 - age / pt.duration);
          if (lifeRatio <= 0) return;

          const currentAngle = pt.angle + rot;
          const dist = baseRadius * pt.radiusFactor;
          const tx = centerX + Math.cos(currentAngle) * dist;
          const ty = centerY + Math.sin(currentAngle) * dist;

          const resNorm = Math.min(100, Math.max(0, pt.resonance)) / 100;

          // Color Gradient stops based on signal intensity (resonance)
          let coreColor = "#e0e7ff";
          let midColor = "#818cf8";
          let outerColor = "#a855f7";

          if (pt.resonance >= 80) {
            // High Intensity: Brilliant Crimson/Gold/Cyan Gradient
            coreColor = "#ffffff";
            midColor = "#f43f5e";
            outerColor = "#f59e0b";
          } else if (pt.resonance >= 50) {
            // Medium Intensity: Emerald/Cyan Gradient
            coreColor = "#ecfdf5";
            midColor = "#10b981";
            outerColor = "#06b6d4";
          } else {
            // Low Intensity: Deep Violet/Indigo Gradient
            coreColor = "#f3e8ff";
            midColor = "#818cf8";
            outerColor = "#6366f1";
          }

          ctx.save();

          // 1. Expanding Contact Wave Ripple
          const maxRippleRadius = (16 + resNorm * 24) * zoom;
          const rippleRadius = ((age / 800) * 14 * zoom) % maxRippleRadius;
          const rippleAlpha = Math.max(0, (1 - rippleRadius / maxRippleRadius) * lifeRatio * 0.5);

          ctx.strokeStyle = midColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = rippleAlpha;
          ctx.beginPath();
          ctx.arc(tx, ty, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 2. Radiant Multi-stop Gradient Glow Sphere
          const glowRadius = (9 + resNorm * 18) * zoom * (0.8 + lifeRatio * 0.4);
          const radGrad = ctx.createRadialGradient(tx, ty, 1, tx, ty, glowRadius);
          radGrad.addColorStop(0, coreColor);
          radGrad.addColorStop(0.35, midColor);
          radGrad.addColorStop(0.75, outerColor);
          radGrad.addColorStop(1, "transparent");

          ctx.fillStyle = radGrad;
          ctx.globalAlpha = lifeRatio * (0.45 + resNorm * 0.5);
          ctx.beginPath();
          ctx.arc(tx, ty, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // 3. Central Contact Core
          ctx.fillStyle = coreColor;
          ctx.globalAlpha = lifeRatio * 0.95;
          ctx.beginPath();
          ctx.arc(tx, ty, (2.5 + resNorm * 2.5) * zoom, 0, Math.PI * 2);
          ctx.fill();

          // 4. Signal Intensity Text Tag (+RES%)
          if (lifeRatio > 0.35) {
            ctx.font = "8px 'JetBrains Mono', monospace";
            ctx.fillStyle = outerColor;
            ctx.globalAlpha = (lifeRatio - 0.35) * 1.3;
            ctx.textAlign = "center";
            ctx.fillText(`+${Math.round(pt.resonance)}%`, tx, ty - glowRadius - 2);
          }

          ctx.restore();
        });

        if (Math.random() < 0.05) {
          setActiveTrailsCount(trailPointsRef.current.length);
        }
      }

      // 5. DRAW RESONANCE BEAMS & DIMENSION NODES
      filteredNodes.forEach((node) => {
        // Calculate dynamic node position on star map canvas
        const currentAngle = node.angle + rot;
        const dist = baseRadius * node.radiusFactor;
        const nx = centerX + Math.cos(currentAngle) * dist;
        const ny = centerY + Math.sin(currentAngle) * dist;

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isCurrentActive = currentDimension && node.name.toLowerCase().includes(currentDimension.toLowerCase());

        // --- A. ENERGY CONDUIT / RESONANCE BEAM ---
        const resNorm = Math.min(100, Math.max(0, node.resonance)) / 100; // 0 to 1
        const beamColor = node.color || "#10b981";

        ctx.save();
        if (resNorm > 0.05) {
          // Beam Line
          ctx.strokeStyle = beamColor;
          ctx.globalAlpha = 0.15 + resNorm * 0.55 + (isSelected ? 0.3 : 0);
          ctx.lineWidth = (1 + resNorm * 3) * zoom;

          if (resNorm < 0.3) {
            ctx.setLineDash([3, 5]); // weak signal
          } else {
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Plasma particles traveling along beam
          const particleCount = Math.max(1, Math.floor(resNorm * 5));
          const speedFactor = 0.5 + resNorm * 2.0;

          for (let p = 0; p < particleCount; p++) {
            const progress = ((time * speedFactor + p / particleCount) % 1.0);
            const px = centerX + (nx - centerX) * progress;
            const py = centerY + (ny - centerY) * progress;

            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 0.8 * (1 - Math.abs(progress - 0.5) * 1.5);
            ctx.beginPath();
            ctx.arc(px, py, (2 + resNorm * 2) * zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // --- B. DIMENSION NODE BODY & AURA ---
        ctx.save();
        const nodeRadius = (8 + resNorm * 6 + (isSelected ? 4 : 0)) * zoom;

        // Radiant Outer Aura
        const auraGrad = ctx.createRadialGradient(nx, ny, 2, nx, ny, nodeRadius * 2.8);
        auraGrad.addColorStop(0, beamColor);
        auraGrad.addColorStop(0.6, beamColor + "44");
        auraGrad.addColorStop(1, "transparent");

        ctx.fillStyle = auraGrad;
        ctx.globalAlpha = 0.4 + resNorm * 0.5;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Selection / Resonance pulse ring
        if (isSelected || isCurrentActive || resNorm > 0.75) {
          const pulseR = nodeRadius * (1.5 + Math.sin(time * 4) * 0.3);
          ctx.strokeStyle = isSelected || isCurrentActive ? "#ffffff" : beamColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(nx, ny, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Main Node Sphere
        ctx.fillStyle = beamColor;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bright Center Dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // --- C. LABELS AND RESONANCE INDICATORS ---
        ctx.font = `${isHovered || isSelected ? "bold 11px" : "10px"} 'JetBrains Mono', sans-serif`;
        ctx.fillStyle = isSelected || isCurrentActive ? "#38bdf8" : "#f1f5f9";
        ctx.textAlign = "center";
        ctx.fillText(node.name.split(" ")[0], nx, ny + nodeRadius + 14 * zoom);

        // Resonance % Pill
        const resText = `${Math.round(node.resonance)}% RES`;
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = resNorm > 0.7 ? "#34d399" : resNorm > 0.4 ? "#facc15" : "#94a3b8";
        ctx.fillText(resText, nx, ny + nodeRadius + 24 * zoom);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    filteredNodes,
    pan,
    zoom,
    isAutoRotate,
    showCelestialGrid,
    showTrails,
    selectedNode,
    hoveredNode,
    currentDimension,
    stars,
    isLowPowerMode,
  ]);

  // Handle Mouse Hit-testing for nodes on Canvas
  const getNodeAtCoords = useCallback(
    (clientX: number, clientY: number): MapNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const baseRadius = Math.min(width, height) * 0.42 * zoom;
      const rot = rotationAngleRef.current;

      for (const node of filteredNodes) {
        const currentAngle = node.angle + rot;
        const dist = baseRadius * node.radiusFactor;
        const nx = centerX + Math.cos(currentAngle) * dist;
        const ny = centerY + Math.sin(currentAngle) * dist;

        const dx = mouseX - nx;
        const dy = mouseY - ny;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 22 * zoom) {
          return node;
        }
      }
      return null;
    },
    [filteredNodes, pan, zoom]
  );

  // Mouse / Touch Dragging & Click Handling
  const handleMouseDown = (e: React.MouseEvent) => {
    const hitNode = getNodeAtCoords(e.clientX, e.clientY);
    if (hitNode) {
      setSelectedNode(hitNode);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const hitNode = getNodeAtCoords(e.clientX, e.clientY);
    setHoveredNode(hitNode);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(2.5, Math.max(0.5, prev + zoomDelta)));
  };

  // Reset viewport
  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  return (
    <div
      id="star-map-visualizer-container"
      className="bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-xl space-y-3 relative overflow-hidden text-slate-200"
    >
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase font-sans flex items-center gap-2">
            MAPA ESTELAR INTERACTIVO DE MEMBRANAS
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              DISTRIBUCIÓN 3D / CANV
            </span>
          </h3>
        </div>

        {/* MAP CONTROLS & FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Danger Filter */}
          <select
            value={filterDanger}
            onChange={(e) => setFilterDanger(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="TODOS">🌐 Todas las Dimensiones</option>
            <option value="MÍNIMO">🟢 Peligro Mínimo</option>
            <option value="MODERADO">🟡 Peligro Moderado</option>
            <option value="ELEVADO">🟠 Peligro Elevado</option>
            <option value="CRÍTICO">🔴 Peligro Crítico</option>
          </select>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowCelestialGrid(!showCelestialGrid)}
            title="Alternar Rejilla Celestial"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              showCelestialGrid
                ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            🌐 Rejilla
          </button>

          {/* Persistent Trail Toggle & Options */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => setShowTrails(!showTrails)}
              title="Alternar rastro persistente de sintonización"
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showTrails
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Rastro</span>
              {showTrails && (
                <span className="text-[8px] bg-amber-950 text-amber-300 px-1 rounded font-mono font-bold">
                  {trailPointsRef.current.length}
                </span>
              )}
            </button>

            {showTrails && (
              <>
                <select
                  value={trailDuration}
                  onChange={(e) => setTrailDuration(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded text-[9px] font-mono text-slate-300 px-1 py-0.5 focus:outline-none cursor-pointer"
                  title="Duración del rastro persistente"
                >
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>60s</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    trailPointsRef.current = [];
                    setActiveTrailsCount(0);
                  }}
                  title="Limpiar rastros guardados"
                  className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Auto Rotation Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title="Alternar Órbita Automática"
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              isAutoRotate
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isAutoRotate ? "Órbita" : "Pausa"}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="text-slate-400 hover:text-slate-100 font-bold px-1 text-xs cursor-pointer"
            >
              -
            </button>
            <span className="text-[9px] font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="text-slate-400 hover:text-slate-100 font-bold px-1 text-xs cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={resetView}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Restablecer Vista"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MAP CANVAS STAGE & INSPECTOR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative">
        {/* CANVAS STAGE (8 or 12 cols depending on inspector) */}
        <div
          ref={containerRef}
          className={`relative rounded-xl border border-slate-900 overflow-hidden bg-slate-950 min-h-[360px] h-[380px] select-none cursor-${
            isDragging ? "grabbing" : hoveredNode ? "pointer" : "grab"
          } ${selectedNode ? "lg:col-span-8" : "lg:col-span-12"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* CANVAS */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* OVERLAY INSTRUCTIONS & LEGEND */}
          <div className="absolute left-3 bottom-3 pointer-events-none text-[9px] font-mono text-slate-500 bg-slate-950/80 p-2 rounded border border-slate-900 space-y-1 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Haz clic en un nodo estelar para inspeccionar detalles</span>
            </div>
            <p>Arrastra para desplazar el mapa // Rueda del ratón para Zoom</p>
          </div>

          {/* HOVER TOOLTIP */}
          {hoveredNode && !isDragging && (
            <div className="absolute top-3 left-3 pointer-events-none bg-slate-950/95 border border-emerald-500/40 p-2.5 rounded-lg shadow-2xl backdrop-blur-md text-[10px] font-mono space-y-1 max-w-xs animate-fade-in z-20">
              <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-1">
                <span className="font-bold text-slate-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                  {hoveredNode.name}
                </span>
                <span className="text-emerald-400 font-bold">{Math.round(hoveredNode.resonance)}% RES</span>
              </div>
              <p className="text-slate-400">Coordenadas: <span className="text-slate-200">{hoveredNode.coordinates}</span></p>
              <p className="text-slate-400">Frecuencia: <span className="text-emerald-300">{hoveredNode.frequency}</span></p>
            </div>
          )}
        </div>

        {/* INSPECTOR PANEL FOR SELECTED NODE */}
        {selectedNode && (
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between animate-fade-in text-xs font-mono">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <span className="font-bold text-slate-100 uppercase tracking-wide text-xs">
                    INSPECTOR DIMENSIONAL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>

              {/* Node Title & Badge */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100 font-sans">{selectedNode.name}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                    {selectedNode.coordinates}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      selectedNode.dangerLevel === "Crítico"
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : selectedNode.dangerLevel === "Elevado"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    Nivel: {selectedNode.dangerLevel}
                  </span>
                </div>
              </div>

              {/* Resonance Meter */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Resonancia Coaxial Actual:</span>
                  <span className="text-emerald-400 font-bold">{Math.round(selectedNode.resonance)}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-indigo-400 transition-all duration-500"
                    style={{ width: `${selectedNode.resonance}%` }}
                  />
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between border-b border-slate-850/60 pb-1">
                  <span className="text-slate-500">Frecuencia Base:</span>
                  <span className="text-emerald-300 font-bold">{selectedNode.frequency}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850/60 pb-1">
                  <span className="text-slate-500">Forma de Vida / Entidad:</span>
                  <span className="text-indigo-300 text-right truncate max-w-[140px]">
                    {selectedNode.entityType}
                  </span>
                </div>
                {selectedNode.presetObj && (
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-1">
                    {selectedNode.presetObj.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button: Tune directly to this dimension */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetPreset: DimensionPreset = selectedNode.presetObj || {
                    id: selectedNode.id,
                    name: selectedNode.name,
                    frequency: selectedNode.frequency,
                    coordinates: selectedNode.coordinates,
                    description: `Matriz de portadora registrada en la red. Entidad: ${selectedNode.entityType}`,
                    entityType: selectedNode.entityType,
                    dangerLevel: (selectedNode.dangerLevel as any) || "Elevado",
                    color: selectedNode.color,
                  };
                  onSelectDimension(targetPreset);
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.01]"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                CONECTAR CON ESTA DIMENSIÓN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRICS */}
      <div className="flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2 gap-2">
        <span>Dimensiones Mapeadas: <strong className="text-slate-300">{nodes.length}</strong></span>
        {showTrails && (
          <span className="flex items-center gap-1 text-amber-400/90">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Puntos de Rastro: <strong className="text-amber-300">{trailPointsRef.current.length}</strong>
          </span>
        )}
        <span>Coordenadas de Antena: <strong className="text-emerald-400">{frequencyValue} {frequencyUnit} // {currentDimension}</strong></span>
      </div>
    </div>
  );
}
