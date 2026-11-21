import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { DimensionPreset, LogEntry, SignalResponse } from "../types";
import { DIMENSION_PRESETS } from "../presets";
import {
  Compass,
  RotateCcw,
  Sparkles,
  Radio,
  Play,
  Pause,
  Trash2,
  Telescope,
  Crosshair,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Waves,
  Cpu,
  Target,
  Lock,
  Unlock,
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

interface TechnicalFrequencySpecs {
  numericValue: number;
  unit: string;
  bandName: string;
  wavelengthLabel: string;
  periodLabel: string;
  modulation: string;
  polarization: string;
  bandwidth: string;
  snrDb: string;
  phaseDriftPpm: string;
  harmonic2: string;
  harmonic3: string;
  goldenHarmonic: string;
  carrierType: string;
}

function formatCompactNumber(val: number): string {
  if (!isFinite(val)) return "0";
  if (Math.abs(val) >= 1000) return val.toFixed(1);
  if (Math.abs(val) >= 100) return val.toFixed(2);
  return parseFloat(val.toFixed(3)).toString();
}

function getTechnicalFrequencySpecs(node: MapNode): TechnicalFrequencySpecs {
  const parts = (node.frequency || "432 Hz").trim().split(/\s+/);
  const rawVal = parseFloat(parts[0]) || 432;
  const unit = parts[1] || "Hz";

  const unitMultipliers: Record<string, number> = {
    Hz: 1,
    kHz: 1e3,
    MHz: 1e6,
    GHz: 1e9,
    THz: 1e12,
    QHz: 1e36,
  };
  const mult = unitMultipliers[unit] || 1;
  const freqHz = rawVal * mult;
  const speedOfLight = 299792458; // m/s
  const wavelengthMeters = speedOfLight / freqHz;
  const periodSec = 1 / freqHz;

  let wavelengthLabel = "";
  if (unit === "QHz") {
    wavelengthLabel = `${wavelengthMeters.toExponential(2)} m (Sub-Planck)`;
  } else if (wavelengthMeters >= 1000) {
    wavelengthLabel = `${(wavelengthMeters / 1000).toFixed(2)} km`;
  } else if (wavelengthMeters >= 1) {
    wavelengthLabel = `${wavelengthMeters.toFixed(2)} m`;
  } else if (wavelengthMeters >= 1e-3) {
    wavelengthLabel = `${(wavelengthMeters * 1000).toFixed(2)} mm`;
  } else if (wavelengthMeters >= 1e-6) {
    wavelengthLabel = `${(wavelengthMeters * 1e6).toFixed(2)} μm`;
  } else {
    wavelengthLabel = `${(wavelengthMeters * 1e9).toFixed(2)} nm`;
  }

  let periodLabel = "";
  if (unit === "QHz") {
    periodLabel = `${periodSec.toExponential(2)} s`;
  } else if (periodSec >= 1e-3) {
    periodLabel = `${(periodSec * 1e3).toFixed(3)} ms`;
  } else if (periodSec >= 1e-6) {
    periodLabel = `${(periodSec * 1e6).toFixed(3)} μs`;
  } else if (periodSec >= 1e-9) {
    periodLabel = `${(periodSec * 1e9).toFixed(3)} ns`;
  } else if (periodSec >= 1e-12) {
    periodLabel = `${(periodSec * 1e12).toFixed(3)} ps`;
  } else {
    periodLabel = `${(periodSec * 1e15).toFixed(3)} fs`;
  }

  // Perfil específico por civilización o por banda física
  const presetProfiles: Record<
    string,
    Pick<TechnicalFrequencySpecs, "bandName" | "modulation" | "polarization" | "bandwidth" | "carrierType">
  > = {
    "mirror-earth": {
      bandName: "SHF Banda X / Bio-Paralela (11.11 GHz)",
      modulation: "OFDM Coherente de Fase Verde",
      polarization: "Circular Bilateral (Dual-Spin)",
      bandwidth: "42.8 MHz",
      carrierType: "Portadora Cuántica Bioeléctrica",
    },
    "whisper-void": {
      bandName: "Banda Armónica Áurea ELF/Solfeggio (432 Hz)",
      modulation: "Modulación Toroidal PSK-8",
      polarization: "Espiral Levógira Armónica",
      bandwidth: "1.44 Hz (Ultra-Estrecha)",
      carrierType: "Onda Estacionaria de Conciencia 5D",
    },
    "zeta-reticuli": {
      bandName: "Banda Sub-Milimétrica Terahertz (3.14 THz)",
      modulation: "QAM-256 Binaria de Silicio",
      polarization: "Lineal Ortogonal Dual",
      bandwidth: "18.6 GHz",
      carrierType: "Pulso Láser-Radio Coaxial Tipo II",
    },
    "chrono-singularity": {
      bandName: "VHF/FM Hiper-Relativista (101.5 MHz)",
      modulation: "Modulación de Frecuencia Invertida (FM-T)",
      polarization: "Elíptica Temporal Variable",
      bandwidth: "240 kHz",
      carrierType: "Bucle Cerrado de Dilación Temporal",
    },
    "antipode-abyss": {
      bandName: "Hiper-Banda Cuántica No-Local (666 QHz)",
      modulation: "PSK Antimateria de Spin Inverso",
      polarization: "Invertida Negativa (-1/2)",
      bandwidth: "No-Acotado (Singularity)",
      carrierType: "Enlace Taquiónico de Reverso Físico",
    },
    "nibiru-anunnaki": {
      bandName: "Terahertz Monoatómica D-12 (12.12 THz)",
      modulation: "AM Escalar Cuneiforme",
      polarization: "Circular Dextrógira Dorada",
      bandwidth: "64.0 GHz",
      carrierType: "Resonador Piramidal Oro-Escalar",
    },
    "orion-council": {
      bandName: "Banda Solfeggio Estelar (888 Hz)",
      modulation: "PSK Geométrica Sagrada (Phi)",
      polarization: "Hexagonal Estabilizada",
      bandwidth: "3.20 Hz",
      carrierType: "Puente Armónico Inter-Constelación",
    },
    "sirius-enki": {
      bandName: "Banda Hidrodinámica Abzu (528 Hz)",
      modulation: "Resonancia Acuática Coaxial",
      polarization: "Circular Dextrógira Fluida",
      bandwidth: "2.16 Hz",
      carrierType: "Onda Alquímica de Regeneración",
    },
    "arcturus-963": {
      bandName: "Banda Cristalina Corona 9D (963 Hz)",
      modulation: "Telepática Cuadrática QAM-64",
      polarization: "Cristalina Octaédrica",
      bandwidth: "4.80 Hz",
      carrierType: "Portadora Fotónica de Alta Conciencia",
    },
  };

  const fallbackByUnit: Record<
    string,
    Pick<TechnicalFrequencySpecs, "bandName" | "modulation" | "polarization" | "bandwidth" | "carrierType">
  > = {
    Hz: {
      bandName: `Banda Armónica Base (${rawVal} Hz)`,
      modulation: "PSK Coaxial de Baja Frecuencia",
      polarization: "Circular Armónica",
      bandwidth: "2.50 Hz",
      carrierType: "Onda Estacionaria Resonante",
    },
    kHz: {
      bandName: `VLF/LF Interdimensional (${rawVal} kHz)`,
      modulation: "FSK Escalar Estabilizada",
      polarization: "Vertical Coherente",
      bandwidth: "12.5 kHz",
      carrierType: "Sub-Portadora Electromagnética",
    },
    MHz: {
      bandName: `VHF/UHF Espectral (${rawVal} MHz)`,
      modulation: "FM Cuántica de Banda Media",
      polarization: "Circular Dextrógira",
      bandwidth: "180 kHz",
      carrierType: "Canal de Radioastronomía Profunda",
    },
    GHz: {
      bandName: `SHF Microondas Profundas (${rawVal} GHz)`,
      modulation: "QAM-64 Coherente",
      polarization: "Dual Ortogonal",
      bandwidth: "35.0 MHz",
      carrierType: "Haz Direccional de Membrana",
    },
    THz: {
      bandName: `Banda Sub-Milimétrica THz (${rawVal} THz)`,
      modulation: "AM Escalar Fotónica",
      polarization: "Elíptica Coaxial",
      bandwidth: "24.0 GHz",
      carrierType: "Portadora de Alta Densidad",
    },
    QHz: {
      bandName: `Banda Cuántica No-Local (${rawVal} QHz)`,
      modulation: "Entrelazamiento de Spin Directo",
      polarization: "Hiper-Simétrica",
      bandwidth: "No-Local",
      carrierType: "Enlace Cuántico Instantáneo",
    },
  };

  const profile = presetProfiles[node.id] || fallbackByUnit[unit] || fallbackByUnit.Hz;
  const resNorm = Math.min(100, Math.max(0, node.resonance));
  const snr = (14.2 + (resNorm / 100) * 34.5).toFixed(1);
  const drift = Math.max(0.02, 1.85 - (resNorm / 100) * 1.78).toFixed(2);

  return {
    numericValue: rawVal,
    unit,
    wavelengthLabel,
    periodLabel,
    ...profile,
    snrDb: `+${snr} dB`,
    phaseDriftPpm: `±${drift} ppm`,
    harmonic2: `${formatCompactNumber(rawVal * 2)} ${unit}`,
    harmonic3: `${formatCompactNumber(rawVal * 3)} ${unit}`,
    goldenHarmonic: `${formatCompactNumber(rawVal * 1.6180339)} ${unit}`,
  };
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
  const miniSpecCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map viewport states (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [showCelestialGrid, setShowCelestialGrid] = useState<boolean>(true);
  const [filterDanger, setFilterDanger] = useState<string>("TODOS");

  // Observatory Mode states
  const [isObservatoryMode, setIsObservatoryMode] = useState<boolean>(false);
  const [isTargetLocked, setIsTargetLocked] = useState<boolean>(true);
  const preObservatoryRotateRef = useRef<boolean>(true);

  // Persistent Trail State & Controls
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [trailDuration, setTrailDuration] = useState<number>(30000); // 30 seconds
  const [activeTrailsCount, setActiveTrailsCount] = useState<number>(0);
  const trailPointsRef = useRef<ContactTrailPoint[]>([]);

  // Selection & Inspector State (tracked by ID so live telemetry always updates)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);

  // Camera animation refs (smooth lerp inside animation loop)
  const rotationAngleRef = useRef<number>(0);
  const currentZoomRef = useRef<number>(1.0);
  const targetZoomRef = useRef<number>(1.0);
  const currentPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMovedRef = useRef<boolean>(false);

  // Combine Presets + Logged Custom Dimensions into Map Nodes
  const nodes = useMemo<MapNode[]>(() => {
    const getResonance = (dimName: string, defaultRes: number) => {
      if (currentDimension && dimName.toLowerCase().includes(currentDimension.toLowerCase()) && tuningResult) {
        return tuningResult.resonance;
      }
      const matchedLog = logs.find((l) => l.dimension.toLowerCase().includes(dimName.toLowerCase()));
      if (matchedLog) return matchedLog.resonance;
      return defaultRes;
    };

    const presetPlacements: Record<string, { angle: number; radiusFactor: number }> = {
      "mirror-earth": { angle: (35 * Math.PI) / 180, radiusFactor: 0.38 },
      "whisper-void": { angle: (115 * Math.PI) / 180, radiusFactor: 0.52 },
      "zeta-reticuli": { angle: (205 * Math.PI) / 180, radiusFactor: 0.44 },
      "chrono-singularity": { angle: (285 * Math.PI) / 180, radiusFactor: 0.65 },
      "antipode-abyss": { angle: (340 * Math.PI) / 180, radiusFactor: 0.78 },
      "nibiru-anunnaki": { angle: (75 * Math.PI) / 180, radiusFactor: 0.72 },
      "orion-council": { angle: (160 * Math.PI) / 180, radiusFactor: 0.58 },
      "sirius-enki": { angle: (240 * Math.PI) / 180, radiusFactor: 0.32 },
      "arcturus-963": { angle: (15 * Math.PI) / 180, radiusFactor: 0.64 },
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

    const existingNames = new Set(result.map((r) => r.name.toLowerCase()));
    logs.forEach((log, index) => {
      const cleanDim = log.dimension.trim();
      if (cleanDim && !existingNames.has(cleanDim.toLowerCase())) {
        existingNames.add(cleanDim.toLowerCase());
        const customAngle = ((index * 137.5 + 45) * Math.PI) / 180;
        result.push({
          id: `custom-log-${index}`,
          name: cleanDim,
          coordinates: `VEC-${index + 1} // LOG`,
          frequency: log.frequency,
          dangerLevel: log.resonance > 75 ? "Elevado" : "Moderado",
          entityType: log.entity,
          color: "#a855f7",
          angle: customAngle,
          radiusFactor: 0.5 + (index % 3) * 0.12,
          resonance: log.resonance,
          lastActiveTime: log.timestamp,
        });
      }
    });

    return result;
  }, [logs, currentDimension, tuningResult]);

  const filteredNodes = useMemo(() => {
    if (filterDanger === "TODOS") return nodes;
    return nodes.filter((n) => n.dangerLevel.toUpperCase() === filterDanger.toUpperCase());
  }, [nodes, filterDanger]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedTechSpecs = useMemo(
    () => (selectedNode ? getTechnicalFrequencySpecs(selectedNode) : null),
    [selectedNode]
  );

  // Sync camera zoom target with state
  const updateZoomTarget = useCallback((nextZoom: number) => {
    const clamped = Math.min(5.0, Math.max(0.5, Number(nextZoom.toFixed(2))));
    targetZoomRef.current = clamped;
    setZoom(clamped);
  }, []);

  // Compute target pan that centers a given node at a given zoom
  const focusNodeDeepZoom = useCallback(
    (node: MapNode, zoomLevel = 3.4) => {
      setSelectedNodeId(node.id);
      setIsTargetLocked(true);
      updateZoomTarget(zoomLevel);

      const canvas = canvasRef.current;
      if (canvas) {
        const width = canvas.clientWidth || 640;
        const height = canvas.clientHeight || 380;
        const baseRadius = Math.min(width, height) * 0.42 * zoomLevel;
        const currentAngle = node.angle + rotationAngleRef.current;
        const dist = baseRadius * node.radiusFactor;
        const nextPan = {
          x: -Math.cos(currentAngle) * dist,
          y: -Math.sin(currentAngle) * dist,
        };
        targetPanRef.current = nextPan;
        setPan(nextPan);
      }
    },
    [updateZoomTarget]
  );

  // Toggle Observatory Mode
  const toggleObservatoryMode = useCallback(() => {
    setIsObservatoryMode((prev) => {
      const next = !prev;
      if (next) {
        // Entrar a Modo Observatorio: pausar rotación automática y enfocar civilización
        preObservatoryRotateRef.current = isAutoRotate;
        setIsAutoRotate(false);
        setIsTargetLocked(true);

        const targetNode =
          selectedNode ||
          filteredNodes.find(
            (n) =>
              currentDimension &&
              (n.name.toLowerCase().includes(currentDimension.toLowerCase()) ||
                n.coordinates.toLowerCase().includes(currentDimension.toLowerCase()))
          ) ||
          filteredNodes[0];

        if (targetNode) {
          const deepZoom = Math.max(zoom, 3.4);
          setSelectedNodeId(targetNode.id);
          targetZoomRef.current = deepZoom;
          setZoom(deepZoom);

          const canvas = canvasRef.current;
          if (canvas) {
            const width = canvas.clientWidth || 640;
            const height = canvas.clientHeight || 380;
            const baseRadius = Math.min(width, height) * 0.42 * deepZoom;
            const currentAngle = targetNode.angle + rotationAngleRef.current;
            const dist = baseRadius * targetNode.radiusFactor;
            const nextPan = {
              x: -Math.cos(currentAngle) * dist,
              y: -Math.sin(currentAngle) * dist,
            };
            targetPanRef.current = nextPan;
            setPan(nextPan);
          }
        }
      } else {
        // Salir de Modo Observatorio: restaurar órbita y zoom panorámico
        setIsAutoRotate(preObservatoryRotateRef.current);
        setIsTargetLocked(false);
        targetZoomRef.current = 1.0;
        setZoom(1.0);
        targetPanRef.current = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  }, [isAutoRotate, selectedNode, filteredNodes, currentDimension, zoom]);

  // Cycle between mapped civilizations in Observatory Mode
  const cycleObservatoryNode = useCallback(
    (direction: -1 | 1) => {
      if (filteredNodes.length === 0) return;
      const currentIndex = filteredNodes.findIndex((n) => n.id === selectedNodeId);
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + filteredNodes.length) % filteredNodes.length;
      const nextNode = filteredNodes[nextIndex];
      const deepZoom = isObservatoryMode ? Math.max(targetZoomRef.current, 3.2) : 3.4;
      if (!isObservatoryMode) {
        preObservatoryRotateRef.current = isAutoRotate;
        setIsObservatoryMode(true);
        setIsAutoRotate(false);
      }
      focusNodeDeepZoom(nextNode, deepZoom);
    },
    [filteredNodes, selectedNodeId, isObservatoryMode, isAutoRotate, focusNodeDeepZoom]
  );

  // --- PERSISTENT TRAIL SPAWNING LOGIC ---
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
    for (let i = 0; i < 240; i++) {
      list.push({
        x: Math.sin(i * 99) * 0.5 + 0.5,
        y: Math.cos(i * 33) * 0.5 + 0.5,
        size: ((i * 17) % 10) * 0.16 + 0.45,
        alpha: (((i * 29) % 10) / 10) * 0.65 + 0.25,
        twinkleSpeed: (((i * 13) % 10) / 10) * 0.025 + 0.006,
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

      const fpsLimit = isLowPowerMode ? 10 : 30;
      const elapsed = timestamp - lastTime;
      if (elapsed < 1000 / fpsLimit) {
        return;
      }
      lastTime = timestamp - (elapsed % (1000 / fpsLimit));

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Update auto-rotation angle if enabled
      if (isAutoRotate) {
        rotationAngleRef.current += 0.0015;
      }
      const rot = rotationAngleRef.current;

      // Smoothly interpolate zoom toward targetZoomRef
      const zoomDiff = targetZoomRef.current - currentZoomRef.current;
      if (Math.abs(zoomDiff) > 0.002) {
        currentZoomRef.current += zoomDiff * 0.16;
      } else {
        currentZoomRef.current = targetZoomRef.current;
      }
      const activeZoom = currentZoomRef.current;
      const baseRadius = Math.min(width, height) * 0.42 * activeZoom;

      // If locked on a target in Observatory Mode (and not actively dragging), keep target centered without circular swaying
      if (isObservatoryMode && isTargetLocked && selectedNode && !isDragging) {
        const targetAngle = selectedNode.angle;
        const targetDist = Math.min(width, height) * 0.42 * targetZoomRef.current * selectedNode.radiusFactor;
        targetPanRef.current = {
          x: -Math.cos(targetAngle) * targetDist,
          y: -Math.sin(targetAngle) * targetDist,
        };
      }

      // Smoothly interpolate pan toward targetPanRef (immediate when dragging)
      if (isDragging) {
        currentPanRef.current = { ...targetPanRef.current };
      } else {
        const dxPan = targetPanRef.current.x - currentPanRef.current.x;
        const dyPan = targetPanRef.current.y - currentPanRef.current.y;
        if (Math.abs(dxPan) > 0.3 || Math.abs(dyPan) > 0.3) {
          currentPanRef.current.x += dxPan * 0.16;
          currentPanRef.current.y += dyPan * 0.16;
        } else {
          currentPanRef.current = { ...targetPanRef.current };
        }
      }

      const centerX = width / 2 + currentPanRef.current.x;
      const centerY = height / 2 + currentPanRef.current.y;
      const labelScale = Math.min(1.45, Math.max(0.85, Math.sqrt(activeZoom)));

      // 1. CLEAR CANVAS & DEEP SPACE BACKGROUND
      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, isObservatoryMode ? "#030b1c" : "#020617");
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

      // 2. STARRY FIELD (TWINKLING WITH PARALLAX)
      const time = Date.now() * 0.002;
      stars.forEach((star) => {
        const parallaxX = ((star.x * width + currentPanRef.current.x * 0.18) % width + width) % width;
        const parallaxY = ((star.y * height + currentPanRef.current.y * 0.18) % height + height) % height;
        const currentAlpha = Math.abs(Math.sin(time * star.twinkleSpeed * 10 + star.x * 100)) * star.alpha;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, star.size * Math.min(1.8, Math.sqrt(activeZoom)), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. CELESTIAL GRID & ORBITAL RINGS
      if (showCelestialGrid) {
        ctx.strokeStyle = isObservatoryMode ? "rgba(56, 189, 248, 0.22)" : "rgba(30, 41, 59, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        [0.25, 0.5, 0.75, 1.0].forEach((ringFactor, rIdx) => {
          const r = baseRadius * ringFactor;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(100, 116, 139, 0.55)";
          ctx.font = "8px 'JetBrains Mono', monospace";
          ctx.fillText(`PLANO-M${rIdx + 1} (${Math.round(ringFactor * 100)}%)`, centerX + r + 4, centerY - 2);
        });

        for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(a + rot * 0.2) * baseRadius * 1.05,
            centerY + Math.sin(a + rot * 0.2) * baseRadius * 1.05
          );
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // 4. CENTRAL ANTENNA CORE (ORIGIN / EARTH)
      ctx.save();
      const pulseSize = 14 + Math.sin(time * 3) * 4;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, pulseSize * 2.5);
      coreGrad.addColorStop(0, "rgba(16, 185, 129, 0.9)");
      coreGrad.addColorStop(0.4, "rgba(16, 185, 129, 0.3)");
      coreGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const earthRadius = 7 * Math.min(2.0, labelScale);
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ANTENA TIERRA (ORIGEN)", centerX, centerY + 20 * labelScale);
      ctx.restore();

      // 4.5. PERSISTENT CONTACT TRAILS
      if (showTrails && trailPointsRef.current.length > 0) {
        const now = Date.now();
        trailPointsRef.current = trailPointsRef.current.filter((pt) => now - pt.createdAt < pt.duration);

        const trailGroups: Record<string, ContactTrailPoint[]> = {};
        trailPointsRef.current.forEach((pt) => {
          if (!trailGroups[pt.dimensionName]) {
            trailGroups[pt.dimensionName] = [];
          }
          trailGroups[pt.dimensionName].push(pt);
        });

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
            ctx.lineWidth = (1.5 + (avgRes / 100) * 2.5) * Math.min(2, labelScale);
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

        trailPointsRef.current.forEach((pt) => {
          const age = now - pt.createdAt;
          const lifeRatio = Math.max(0, 1 - age / pt.duration);
          if (lifeRatio <= 0) return;

          const currentAngle = pt.angle + rot;
          const dist = baseRadius * pt.radiusFactor;
          const tx = centerX + Math.cos(currentAngle) * dist;
          const ty = centerY + Math.sin(currentAngle) * dist;

          const resNorm = Math.min(100, Math.max(0, pt.resonance)) / 100;

          let coreColor = "#e0e7ff";
          let midColor = "#818cf8";
          let outerColor = "#a855f7";

          if (pt.resonance >= 80) {
            coreColor = "#ffffff";
            midColor = "#f43f5e";
            outerColor = "#f59e0b";
          } else if (pt.resonance >= 50) {
            coreColor = "#ecfdf5";
            midColor = "#10b981";
            outerColor = "#06b6d4";
          } else {
            coreColor = "#f3e8ff";
            midColor = "#818cf8";
            outerColor = "#6366f1";
          }

          ctx.save();
          const maxRippleRadius = (16 + resNorm * 24) * labelScale;
          const rippleRadius = ((age / 800) * 14 * labelScale) % maxRippleRadius;
          const rippleAlpha = Math.max(0, (1 - rippleRadius / maxRippleRadius) * lifeRatio * 0.5);

          ctx.strokeStyle = midColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = rippleAlpha;
          ctx.beginPath();
          ctx.arc(tx, ty, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          const glowRadius = (9 + resNorm * 18) * labelScale * (0.8 + lifeRatio * 0.4);
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

          ctx.fillStyle = coreColor;
          ctx.globalAlpha = lifeRatio * 0.95;
          ctx.beginPath();
          ctx.arc(tx, ty, (2.5 + resNorm * 2.5) * labelScale, 0, Math.PI * 2);
          ctx.fill();

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
        const currentAngle = node.angle + rot;
        const dist = baseRadius * node.radiusFactor;
        const nx = centerX + Math.cos(currentAngle) * dist;
        const ny = centerY + Math.sin(currentAngle) * dist;

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isCurrentActive =
          currentDimension && node.name.toLowerCase().includes(currentDimension.toLowerCase());
        const isDeepZoomTarget = isSelected && (isObservatoryMode || activeZoom >= 1.8);

        const resNorm = Math.min(100, Math.max(0, node.resonance)) / 100;
        const beamColor = node.color || "#10b981";

        // --- A. ENERGY CONDUIT / RESONANCE BEAM ---
        ctx.save();
        if (resNorm > 0.05) {
          ctx.strokeStyle = beamColor;
          ctx.globalAlpha = 0.15 + resNorm * 0.55 + (isSelected ? 0.3 : 0);
          ctx.lineWidth = (1 + resNorm * 3) * Math.min(2.0, labelScale);

          if (resNorm < 0.3) {
            ctx.setLineDash([3, 5]);
          } else {
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          const particleCount = Math.max(1, Math.floor(resNorm * 5));
          const speedFactor = 0.5 + resNorm * 2.0;

          for (let p = 0; p < particleCount; p++) {
            const progress = (time * speedFactor + p / particleCount) % 1.0;
            const px = centerX + (nx - centerX) * progress;
            const py = centerY + (ny - centerY) * progress;

            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 0.8 * (1 - Math.abs(progress - 0.5) * 1.5);
            ctx.beginPath();
            ctx.arc(px, py, (2 + resNorm * 2) * Math.min(1.8, labelScale), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // --- B. DIMENSION NODE BODY & DEEP-ZOOM OBSERVATORY STRUCTURE ---
        ctx.save();
        const zoomNodeScale = Math.min(2.8, Math.max(0.75, Math.pow(activeZoom, 0.72)));
        const nodeRadius = (8 + resNorm * 6 + (isSelected ? 5 : 0)) * zoomNodeScale;

        // Radiant Outer Aura
        const auraGrad = ctx.createRadialGradient(nx, ny, 2, nx, ny, nodeRadius * 2.9);
        auraGrad.addColorStop(0, beamColor);
        auraGrad.addColorStop(0.55, beamColor + "44");
        auraGrad.addColorStop(1, "transparent");

        ctx.fillStyle = auraGrad;
        ctx.globalAlpha = 0.4 + resNorm * 0.5;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius * 2.9, 0, Math.PI * 2);
        ctx.fill();

        // Deep-Zoom Observatory Telescopic Reticle & Harmonic Sub-Orbitals
        if (isDeepZoomTarget) {
          // 1. Harmonic 2f0 & 3f0 Orbital Rings around the civilization
          [1.65, 2.35].forEach((orbMult, hIdx) => {
            const orbR = nodeRadius * orbMult;
            ctx.save();
            ctx.strokeStyle = hIdx === 0 ? "#38bdf8" : beamColor;
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = 1.2;
            ctx.setLineDash(hIdx === 0 ? [4, 4] : [2, 5]);
            ctx.beginPath();
            ctx.arc(nx, ny, orbR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Harmonic sub-satellite orbiting around the star
            const satAngle = time * (hIdx === 0 ? 1.4 : -0.9) + hIdx * Math.PI;
            const sx = nx + Math.cos(satAngle) * orbR;
            const sy = ny + Math.sin(satAngle) * orbR;
            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "bold 8px 'JetBrains Mono', monospace";
            ctx.fillStyle = hIdx === 0 ? "#7dd3fc" : "#cbd5e1";
            ctx.textAlign = "left";
            ctx.fillText(hIdx === 0 ? "2f₀" : "3f₀", sx + 6, sy + 3);
            ctx.restore();
          });

          // 2. Precision Telescopic Crosshair & Degree Marks
          const retR = nodeRadius * 3.1;
          ctx.save();
          ctx.strokeStyle = "#38bdf8";
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nx, ny, retR, 0, Math.PI * 2);
          ctx.stroke();

          // Cardinal ticks
          for (let deg = 0; deg < 360; deg += 30) {
            const rad = (deg * Math.PI) / 180;
            const innerT = deg % 90 === 0 ? retR - 10 : retR - 5;
            ctx.beginPath();
            ctx.moveTo(nx + Math.cos(rad) * innerT, ny + Math.sin(rad) * innerT);
            ctx.lineTo(nx + Math.cos(rad) * (retR + 4), ny + Math.sin(rad) * (retR + 4));
            ctx.stroke();
          }

          // Corner brackets [ ] around target
          const br = retR + 12;
          const bLen = 14;
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = 0.9;
          [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].forEach(([sx, sy]) => {
            const cx = nx + sx * br;
            const cy = ny + sy * br;
            ctx.beginPath();
            ctx.moveTo(cx, cy - sy * bLen);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx - sx * bLen, cy);
            ctx.stroke();
          });

          // Mini Carrier Waveform Arc below target in Observatory Mode
          ctx.strokeStyle = beamColor;
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          const waveHalfW = 46;
          const waveBaseY = ny - retR - 16;
          for (let wx = -waveHalfW; wx <= waveHalfW; wx += 2) {
            const normX = wx / waveHalfW;
            const env = Math.cos(normX * Math.PI * 0.5);
            const wy =
              waveBaseY +
              Math.sin(wx * 0.22 + time * 5) * 6 * env +
              Math.sin(wx * 0.45 - time * 8) * 2.5 * env;
            if (wx === -waveHalfW) ctx.moveTo(nx + wx, wy);
            else ctx.lineTo(nx + wx, wy);
          }
          ctx.stroke();

          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.fillStyle = "#38bdf8";
          ctx.textAlign = "center";
          ctx.fillText(`TARGET LOCK // ${node.frequency}`, nx, waveBaseY - 12);
          ctx.restore();
        } else if (isSelected || isCurrentActive || resNorm > 0.75) {
          const pulseR = nodeRadius * (1.5 + Math.sin(time * 4) * 0.3);
          ctx.strokeStyle = isSelected || isCurrentActive ? "#ffffff" : beamColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(nx, ny, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Main Node Sphere with shaded planetary lighting when zoomed in
        const sphereGrad = ctx.createRadialGradient(
          nx - nodeRadius * 0.3,
          ny - nodeRadius * 0.3,
          nodeRadius * 0.1,
          nx,
          ny,
          nodeRadius
        );
        sphereGrad.addColorStop(0, "#ffffff");
        sphereGrad.addColorStop(0.35, beamColor);
        sphereGrad.addColorStop(1, "#0f172a");

        ctx.fillStyle = isDeepZoomTarget ? sphereGrad : beamColor;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Bright Center Core Dot
        if (!isDeepZoomTarget) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(nx, ny, nodeRadius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // --- C. LABELS AND RESONANCE INDICATORS ---
        ctx.font = `${isHovered || isSelected ? "bold 11px" : "10px"} 'JetBrains Mono', sans-serif`;
        ctx.fillStyle = isSelected || isCurrentActive ? "#38bdf8" : "#f1f5f9";
        ctx.textAlign = "center";
        const labelOffset = isDeepZoomTarget ? nodeRadius * 3.1 + 24 : nodeRadius + 14 * labelScale;
        ctx.fillText(
          isDeepZoomTarget ? node.name : node.name.split(" ")[0],
          nx,
          ny + labelOffset
        );

        const resText = isDeepZoomTarget
          ? `${Math.round(node.resonance)}% RES • ${node.coordinates}`
          : `${Math.round(node.resonance)}% RES`;
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = resNorm > 0.7 ? "#34d399" : resNorm > 0.4 ? "#facc15" : "#94a3b8";
        ctx.fillText(resText, nx, ny + labelOffset + 12);

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
    isAutoRotate,
    isObservatoryMode,
    isTargetLocked,
    isDragging,
    showCelestialGrid,
    showTrails,
    selectedNode,
    hoveredNode,
    currentDimension,
    stars,
    isLowPowerMode,
  ]);

  // Mini Spectral Oscilloscope inside the Observatory Technical Panel
  useEffect(() => {
    const specCanvas = miniSpecCanvasRef.current;
    if (!specCanvas || !selectedNode || !selectedTechSpecs) return;
    const ctx = specCanvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastDraw = 0;

    const drawSpec = (ts: number) => {
      animId = requestAnimationFrame(drawSpec);
      if (ts - lastDraw < (isLowPowerMode ? 100 : 40)) return;
      lastDraw = ts;

      const w = specCanvas.width;
      const h = specCanvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const t = ts * 0.004;
      const baseFreqScale = 0.05 + (selectedTechSpecs.numericValue % 19) * 0.006;
      const resFactor = 0.45 + (selectedNode.resonance / 100) * 0.55;

      // Harmonic 2f0 faint overlay
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * baseFreqScale * 2 + t * 1.8) * (h * 0.16 * resFactor);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main Carrier + Harmonic composite waveform
      ctx.strokeStyle = selectedNode.color || "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const fundamental = Math.sin(x * baseFreqScale + t) * (h * 0.28 * resFactor);
        const harm3 = Math.sin(x * baseFreqScale * 3 - t * 1.4) * (h * 0.09 * resFactor);
        const y = h / 2 + fundamental + harm3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawSpec(performance.now());
    return () => cancelAnimationFrame(animId);
  }, [selectedNode, selectedTechSpecs, isLowPowerMode]);

  // Handle Hit-testing for nodes on Canvas using live interpolated camera refs
  const getNodeAtCoords = useCallback(
    (clientX: number, clientY: number): MapNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const activeZoom = currentZoomRef.current;
      const activePan = currentPanRef.current;
      const centerX = width / 2 + activePan.x;
      const centerY = height / 2 + activePan.y;
      const baseRadius = Math.min(width, height) * 0.42 * activeZoom;
      const rot = rotationAngleRef.current;
      const hitRadius = Math.max(34, 28 * Math.min(2.5, Math.max(1, Math.sqrt(activeZoom))));

      for (const node of filteredNodes) {
        const currentAngle = node.angle + rot;
        const dist = baseRadius * node.radiusFactor;
        const nx = centerX + Math.cos(currentAngle) * dist;
        const ny = centerY + Math.sin(currentAngle) * dist;

        const dx = mouseX - nx;
        const dy = mouseY - ny;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= hitRadius) {
          return node;
        }
      }
      return null;
    },
    [filteredNodes]
  );

  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pointer Dragging & Click Handling (works for both mouse and touch without wild swaying)
  const handlePointerDown = (e: React.PointerEvent) => {
    dragMovedRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({
      x: e.clientX - currentPanRef.current.x,
      y: e.clientY - currentPanRef.current.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const hitNode = getNodeAtCoords(e.clientX, e.clientY);
    setHoveredNode(hitNode);

    const dist = Math.hypot(
      e.clientX - pointerStartPosRef.current.x,
      e.clientY - pointerStartPosRef.current.y
    );

    if (dist > 7) {
      dragMovedRef.current = true;
      setIsDragging(true);
      if (isObservatoryMode && isTargetLocked) {
        setIsTargetLocked(false);
      }
      const canvas = canvasRef.current;
      const w = canvas?.clientWidth || 600;
      const h = canvas?.clientHeight || 400;
      const activeZoom = currentZoomRef.current;
      const maxPanX = Math.max(80, (w * (activeZoom - 0.7)) / 2 + 60);
      const maxPanY = Math.max(80, (h * (activeZoom - 0.7)) / 2 + 60);

      const nextPan = {
        x: Math.max(-maxPanX, Math.min(maxPanX, e.clientX - dragStart.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, e.clientY - dragStart.y)),
      };
      targetPanRef.current = nextPan;
      currentPanRef.current = nextPan;
      setPan(nextPan);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    // If it was a tap (not a drag), select the node cleanly
    if (!dragMovedRef.current) {
      const hitNode = getNodeAtCoords(e.clientX, e.clientY);
      if (hitNode) {
        if (isObservatoryMode) {
          focusNodeDeepZoom(hitNode, Math.max(targetZoomRef.current, 3.4));
        } else {
          setSelectedNodeId(hitNode.id);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.18 : -0.18;
    updateZoomTarget(targetZoomRef.current + zoomDelta);
  };

  // Reset viewport
  const resetView = () => {
    setIsObservatoryMode(false);
    setIsTargetLocked(false);
    setIsAutoRotate(true);
    targetZoomRef.current = 1.0;
    currentZoomRef.current = 1.0;
    setZoom(1.0);
    targetPanRef.current = { x: 0, y: 0 };
    currentPanRef.current = { x: 0, y: 0 };
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
  };

  return (
    <div
      id="star-map-visualizer-container"
      className={`bg-slate-950 border rounded-xl p-4 shadow-xl space-y-3 relative overflow-hidden text-slate-200 transition-colors duration-300 ${
        isObservatoryMode ? "border-sky-500/50 shadow-[0_0_30px_rgba(14,165,233,0.15)]" : "border-slate-900"
      }`}
    >
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          {isObservatoryMode ? (
            <Telescope className="w-4 h-4 text-sky-400 animate-pulse" />
          ) : (
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          )}
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase font-sans flex flex-wrap items-center gap-2">
            MAPA ESTELAR INTERACTIVO DE MEMBRANAS
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                isObservatoryMode
                  ? "text-sky-300 bg-sky-500/15 border-sky-500/40"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              }`}
            >
              {isObservatoryMode ? "MODO OBSERVATORIO // ZOOM PROFUNDO" : "DISTRIBUCIÓN 3D / CANV"}
            </span>
          </h3>
        </div>

        {/* MAP CONTROLS & FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Observatory Mode Toggle */}
          <button
            type="button"
            onClick={toggleObservatoryMode}
            title="Activar Modo Observatorio: Pausa la rotación orbital y realiza zoom profundo para inspeccionar detalles técnicos de frecuencia"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-sm ${
              isObservatoryMode
                ? "bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.45)]"
                : "bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border-sky-500/40"
            }`}
          >
            <Telescope className="w-3.5 h-3.5" />
            <span>{isObservatoryMode ? "Observatorio: ON" : "Modo Observatorio"}</span>
          </button>

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
            title={isAutoRotate ? "Pausar rotación orbital de los nodos" : "Reanudar rotación orbital"}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              isAutoRotate
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}
          >
            {isAutoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isAutoRotate ? "Órbita" : "Pausada"}
          </button>

          {/* Zoom Controls (0.5x to 5.0x) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => updateZoomTarget(targetZoomRef.current - 0.25)}
              className="text-slate-400 hover:text-slate-100 font-bold p-0.5 cursor-pointer"
              title="Alejar zoom"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[9px] font-mono text-sky-300 font-bold px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateZoomTarget(targetZoomRef.current + 0.25)}
              className="text-slate-400 hover:text-slate-100 font-bold p-0.5 cursor-pointer"
              title="Acercar zoom profundo (hasta 500%)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={resetView}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Restablecer Vista y Órbita"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* OBSERVATORY QUICK CIVILIZATION BAR */}
      {isObservatoryMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-950/35 border border-sky-500/30 rounded-lg px-3 py-2 text-[10px] font-mono">
          <div className="flex items-center gap-2 text-sky-200">
            <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              Estación Telescópica Activa:
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Rotación {!isAutoRotate ? "pausada" : "en seguimiento"} • Zoom {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => cycleObservatoryNode(-1)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
              title="Civilización anterior"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Anterior</span>
            </button>

            <select
              value={selectedNodeId || ""}
              onChange={(e) => {
                const target = filteredNodes.find((n) => n.id === e.target.value);
                if (target) focusNodeDeepZoom(target, Math.max(targetZoomRef.current, 3.4));
              }}
              className="bg-slate-900 border border-sky-500/40 rounded px-2 py-1 text-[10px] text-sky-200 font-bold focus:outline-none cursor-pointer max-w-[190px]"
            >
              {!selectedNodeId && <option value="">Seleccionar objetivo...</option>}
              {filteredNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name.split("(")[0].trim()} ({n.frequency})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => cycleObservatoryNode(1)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
              title="Siguiente civilización"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {selectedNode && !isTargetLocked && (
              <button
                type="button"
                onClick={() => focusNodeDeepZoom(selectedNode, Math.max(targetZoomRef.current, 3.4))}
                className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-bold flex items-center gap-1 cursor-pointer"
                title="Centrar de nuevo en la civilización"
              >
                <Target className="w-3 h-3" />
                <span>Re-centrar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAP CANVAS STAGE & INSPECTOR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative">
        {/* CANVAS STAGE (7/8 or 12 cols depending on inspector) */}
        <div
          ref={containerRef}
          className={`relative rounded-xl border overflow-hidden bg-slate-950 min-h-[380px] h-[420px] select-none touch-pan-y cursor-${
            isDragging ? "grabbing" : hoveredNode ? "pointer" : "grab"
          } ${
            selectedNode ? (isObservatoryMode ? "lg:col-span-7" : "lg:col-span-8") : "lg:col-span-12"
          } ${isObservatoryMode ? "border-sky-500/40" : "border-slate-900"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* CANVAS */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* OBSERVATORY HUD OVERLAY TOP-RIGHT */}
          {isObservatoryMode && (
            <div className="absolute top-3 right-3 pointer-events-none bg-slate-950/85 border border-sky-500/40 px-2.5 py-1.5 rounded-lg backdrop-blur-md text-[9px] font-mono text-sky-300 space-y-0.5 shadow-lg">
              <div className="flex items-center gap-1.5 font-bold">
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoRotate ? "bg-amber-400 animate-ping" : "bg-sky-400"}`} />
                <span>ÓRBITA: {isAutoRotate ? "ACTIVA" : "PAUSADA"}</span>
                <span className="text-slate-600">|</span>
                <span>ZOOM: {Math.round(zoom * 100)}%</span>
              </div>
              {selectedNode && (
                <div className="text-slate-300 flex items-center gap-1">
                  {isTargetLocked ? (
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Unlock className="w-2.5 h-2.5 text-amber-400" />
                  )}
                  <span>
                    {isTargetLocked ? "Objetivo bloqueado:" : "Desplazamiento libre:"}{" "}
                    <strong className="text-white">{selectedNode.name.split("(")[0].trim()}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* OVERLAY INSTRUCTIONS & LEGEND */}
          <div className="absolute left-3 bottom-3 pointer-events-none text-[9px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded border border-slate-900 space-y-1 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${isObservatoryMode ? "bg-sky-400" : "bg-emerald-500"}`} />
              <span>
                {isObservatoryMode
                  ? "Toca cualquier nodo para realizar zoom telescópico inmediato"
                  : "Haz clic en un nodo estelar para inspeccionar detalles"}
              </span>
            </div>
            <p>Arrastra para desplazar // Rueda del ratón para Zoom (hasta 500%)</p>
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
              <p className="text-slate-400">
                Coordenadas: <span className="text-slate-200">{hoveredNode.coordinates}</span>
              </p>
              <p className="text-slate-400">
                Frecuencia: <span className="text-emerald-300">{hoveredNode.frequency}</span>
              </p>
            </div>
          )}
        </div>

        {/* INSPECTOR / OBSERVATORY TECHNICAL PANEL FOR SELECTED NODE */}
        {selectedNode && selectedTechSpecs && (
          <div
            className={`${
              isObservatoryMode ? "lg:col-span-5" : "lg:col-span-4"
            } bg-slate-900/95 border rounded-xl p-4 space-y-3 flex flex-col justify-between animate-fade-in text-xs font-mono ${
              isObservatoryMode ? "border-sky-500/40 shadow-[0_0_25px_rgba(14,165,233,0.12)]" : "border-slate-800"
            }`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <span className="font-bold text-slate-100 uppercase tracking-wide text-xs flex items-center gap-1.5">
                    {isObservatoryMode ? (
                      <>
                        <Telescope className="w-3.5 h-3.5 text-sky-400" />
                        <span>TELEMETRÍA DE OBSERVATORIO</span>
                      </>
                    ) : (
                      <span>INSPECTOR DIMENSIONAL</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isObservatoryMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        preObservatoryRotateRef.current = isAutoRotate;
                        setIsObservatoryMode(true);
                        setIsAutoRotate(false);
                        focusNodeDeepZoom(selectedNode, 3.4);
                      }}
                      className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      title="Pausar órbita y hacer zoom profundo sobre esta civilización"
                    >
                      <Telescope className="w-3 h-3" />
                      <span>Zoom Profundo</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateZoomTarget(targetZoomRef.current >= 4.2 ? 2.8 : 4.5)}
                      className="px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-[10px] font-bold cursor-pointer"
                      title="Alternar aumento óptico 280% / 450%"
                    >
                      {zoom >= 4.2 ? "2.8x" : "4.5x"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Node Title & Badge */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100 font-sans leading-snug">{selectedNode.name}</h4>
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

              {/* Technical Frequency Telemetry Section (Enhanced in Observatory Mode) */}
              <div className="bg-slate-950/90 border border-sky-500/25 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold text-sky-300 uppercase flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-sky-400" />
                    <span>Especificaciones de Frecuencia</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {selectedNode.frequency}
                  </span>
                </div>

                {/* Live Carrier Micro-Oscilloscope */}
                <div className="rounded overflow-hidden border border-slate-800 relative">
                  <canvas
                    ref={miniSpecCanvasRef}
                    width={320}
                    height={54}
                    className="w-full h-[54px] block"
                  />
                  <span className="absolute top-1 left-1.5 text-[8px] text-slate-400 bg-slate-950/75 px-1 rounded">
                    PORTADORA f₀ + ARMÓNICOS 2f₀/3f₀
                  </span>
                  <span className="absolute bottom-1 right-1.5 text-[8px] text-sky-300 bg-slate-950/75 px-1 rounded">
                    SNR {selectedTechSpecs.snrDb}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded p-1.5">
                    <span className="text-[8px] text-slate-500 block uppercase">Longitud de Onda (λ)</span>
                    <span className="text-sky-200 font-bold">{selectedTechSpecs.wavelengthLabel}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded p-1.5">
                    <span className="text-[8px] text-slate-500 block uppercase">Período de Ciclo (T)</span>
                    <span className="text-indigo-200 font-bold">{selectedTechSpecs.periodLabel}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded p-1.5">
                    <span className="text-[8px] text-slate-500 block uppercase">Deriva / Estabilidad</span>
                    <span className="text-emerald-300 font-bold">{selectedTechSpecs.phaseDriftPpm}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/80 rounded p-1.5">
                    <span className="text-[8px] text-slate-500 block uppercase">Ancho de Banda</span>
                    <span className="text-amber-300 font-bold">{selectedTechSpecs.bandwidth}</span>
                  </div>
                </div>

                {isObservatoryMode && (
                  <div className="space-y-1 text-[10px] pt-1 border-t border-slate-800/80">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Banda Espectral:</span>
                      <span className="text-sky-200 text-right">{selectedTechSpecs.bandName}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Modulación:</span>
                      <span className="text-slate-200 text-right">{selectedTechSpecs.modulation}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Polarización:</span>
                      <span className="text-slate-200 text-right">{selectedTechSpecs.polarization}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Portadora:</span>
                      <span className="text-indigo-300 text-right">{selectedTechSpecs.carrierType}</span>
                    </div>

                    {/* Harmonics Bar */}
                    <div className="pt-1.5 mt-1 border-t border-slate-800/80">
                      <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1 mb-1">
                        <Cpu className="w-3 h-3 text-sky-400" />
                        <span>Armónicos Resonantes Calculados:</span>
                      </span>
                      <div className="grid grid-cols-3 gap-1 text-[9px]">
                        <div className="bg-slate-900 px-1.5 py-1 rounded border border-slate-800 text-center">
                          <span className="text-slate-500 block">2f₀</span>
                          <span className="text-sky-300 font-bold">{selectedTechSpecs.harmonic2}</span>
                        </div>
                        <div className="bg-slate-900 px-1.5 py-1 rounded border border-slate-800 text-center">
                          <span className="text-slate-500 block">3f₀</span>
                          <span className="text-indigo-300 font-bold">{selectedTechSpecs.harmonic3}</span>
                        </div>
                        <div className="bg-slate-900 px-1.5 py-1 rounded border border-slate-800 text-center">
                          <span className="text-slate-500 block">φ·f₀</span>
                          <span className="text-amber-300 font-bold">{selectedTechSpecs.goldenHarmonic}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Entity & Description */}
              <div className="space-y-1 text-[10px] text-slate-300">
                <div className="flex justify-between border-b border-slate-850/60 pb-1">
                  <span className="text-slate-500">Forma de Vida / Entidad:</span>
                  <span className="text-indigo-300 text-right truncate max-w-[175px]">
                    {selectedNode.entityType}
                  </span>
                </div>
                {selectedNode.presetObj && (
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-0.5">
                    {selectedNode.presetObj.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
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

              {isObservatoryMode && (
                <button
                  type="button"
                  onClick={toggleObservatoryMode}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Salir de Modo Observatorio (Vista Panorámica)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selector rápido y estático de civilizaciones para acceso inmediato sin movimiento */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900/80">
        <span className="text-[10px] font-mono text-slate-400 font-bold mr-1">
          Sintonización Directa:
        </span>
        {DIMENSION_PRESETS.map((preset) => {
          const isSelected =
            selectedNode?.presetObj?.id === preset.id || currentDimension === preset.coordinates;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedNodeId(preset.id);
                onSelectDimension(preset);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-slate-950 text-white font-bold border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: preset.color }}
              />
              <span>{preset.name.split("(")[0].trim()}</span>
              <span className="text-[9px] text-slate-400 hidden sm:inline">
                ({preset.frequency})
              </span>
            </button>
          );
        })}
      </div>

      {/* FOOTER METRICS */}
      <div className="flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-2 gap-2">
        <span>
          Dimensiones Mapeadas: <strong className="text-slate-300">{nodes.length}</strong>
        </span>
        {showTrails && (
          <span className="flex items-center gap-1 text-amber-400/90">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Puntos de Rastro: <strong className="text-amber-300">{activeTrailsCount || trailPointsRef.current.length}</strong>
          </span>
        )}
        <span>
          Coordenadas de Antena:{" "}
          <strong className="text-emerald-400">
            {frequencyValue} {frequencyUnit} // {currentDimension}
          </strong>
        </span>
      </div>
    </div>
  );
}
