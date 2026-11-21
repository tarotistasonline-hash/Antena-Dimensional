import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  HelpCircle,
  Radio,
  CheckCircle2,
  MessageSquare,
  Share2,
  X,
  Zap,
  Sliders,
  Users,
  History,
  ChevronDown,
  ChevronUp,
  Waves,
  Copy,
  Check,
  ExternalLink,
  Palette,
} from "lucide-react";
import { DimensionPreset, TransmitResponse, SignalResponse } from "../types";
import { VISUAL_THEMES, VisualThemeId } from "../themes";
import { TransdimensionalTuningHUD } from "./TransdimensionalTuningHUD";
import HoloSchematicModal from "./HoloSchematicModal";
import HoloSchematicPreviewCard from "./HoloSchematicPreviewCard";

interface SimpleOracleViewProps {
  presets: DimensionPreset[];
  activePresetId: string | null;
  dimension: string;
  frequencyValue: number;
  frequencyUnit: string;
  transmissionMessage: string;
  setTransmissionMessage: (msg: string) => void;
  lastTransmittedMessage?: string;
  onSelectPreset: (preset: DimensionPreset) => Promise<void>;
  onTransmit: () => Promise<void>;
  isTransmitting: boolean;
  isTuning?: boolean;
  tuningProgress?: number;
  tuningResult?: SignalResponse | null;
  onClearTuningResult?: () => void;
  selectedAntenna?: string;
  onOpenAntennaModal?: () => void;
  transmitResult: TransmitResponse | null;
  onClearTransmitResult: () => void;
  isSpeakingSolemn: boolean;
  welcomeVoiceState?: "idle" | "playing" | "needs_gesture" | "done";
  onPlayWelcomeGuide?: () => void;
  onStopWelcomeGuide?: () => void;
  onPlayVoice: (text: string, isSpanishAccent?: boolean, isNeutralWelcome?: boolean) => void;
  onStopVoice: () => void;
  forceBaritonePitch?: boolean;
  onToggleForceBaritonePitch?: () => void;
  baritonePitchValue?: number;
  onChangeBaritonePitch?: (val: number) => void;
  baritonePreset?: "pleiades" | "sirius" | "ancient" | "custom";
  onSelectBaritonePreset?: (preset: "pleiades" | "sirius" | "ancient" | "custom") => void;
  onTestBaritoneVoice?: (presetType?: "pleiades" | "sirius" | "ancient") => void;
  isOperatorAdmin?: boolean;
  isRecording: boolean;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onSwitchToAdvanced: () => void;
  onOpenBlog?: () => void;
  visitsCount?: number;
  onOpenTelemetry?: () => void;
  visualTheme?: VisualThemeId;
  onChangeVisualTheme?: (theme: VisualThemeId) => void;
}

interface SessionContactItem {
  id: string;
  entityTitle: string;
  entityEmoji: string;
  frequencyLabel: string;
  accentHex: string;
  question: string;
  reaction: string;
  guidance?: string;
  timestamp: string;
}

const FRIENDLY_ENTITIES = [
  {
    id: "arcturus-963",
    emoji: "💎",
    title: "Arcturianos (9D)",
    sub: "Frecuencia 963 Hz • Sanación y Alta Conciencia",
    desc: "Seres de luz cristalina especializados en paz interior, claridad mental y elevar tu vibración.",
    tag: "Paz y Sanación",
    resonantTag: "Armónica 963 Hz",
    accentHex: "#a855f7",
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300",
  },
  {
    id: "whisper-void",
    emoji: "🌌",
    title: "Pleyadianos y Guardianes 5D",
    sub: "Frecuencia 432 Hz • Amor y Conciencia Universal",
    desc: "Emisarios del amor incondicional y el despertar espiritual de la humanidad.",
    tag: "Amor y Despertar",
    resonantTag: "Armónica 432 Hz",
    accentHex: "#8b5cf6",
    color: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-300",
  },
  {
    id: "sirius-enki",
    emoji: "🌊",
    title: "Santuario de Sirio y Enki",
    sub: "Frecuencia 528 Hz • Alquimia y Regeneración",
    desc: "Sabiduría ancestral, conocimiento oculto de las aguas cósmicas y armonía emocional.",
    tag: "Alquimia Emocional",
    resonantTag: "Resonancia 528 Hz",
    accentHex: "#06b6d4",
    color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/40 text-cyan-300",
  },
  {
    id: "orion-council",
    emoji: "🔮",
    title: "Consejo de Orión",
    sub: "Frecuencia 888 Hz • Propósito del Alma",
    desc: "Maestros estelares que orientan sobre tu destino, superación de pruebas y misión en la Tierra.",
    tag: "Propósito y Destino",
    resonantTag: "Portal 888 Hz",
    accentHex: "#f59e0b",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300",
  },
  {
    id: "nibiru-anunnaki",
    emoji: "👑",
    title: "Elohim de Nibiru",
    sub: "Frecuencia 12.12 THz • Leyes Cósmicas",
    desc: "Ingenieros del cosmos y civilizaciones primordiales. Revelan secretos sobre el origen y la historia.",
    tag: "Historia Ancestral",
    resonantTag: "Portadora 12.12 THz",
    accentHex: "#fb923c",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-300",
  },
  {
    id: "mirror-earth",
    emoji: "🌿",
    title: "Conciencia Gaia (Tierra Espejo)",
    sub: "Frecuencia 11.11 GHz • Red Bioeléctrica",
    desc: "La inteligencia viva de la naturaleza y líneas temporales paralelas para armonizar tu vida diaria.",
    tag: "Naturaleza Viva",
    resonantTag: "Red 11.11 GHz",
    accentHex: "#10b981",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-300",
  },
];

const SUGGESTED_QUESTIONS = [
  "¿Quiénes son ustedes y cómo nos ven a los humanos?",
  "¿Cuál es el propósito o misión en la tierra de nosotros los humanos?",
  "¿Los conoceremos en algún momento?",
  "¿Qué mensajes tienen para darnos?",
  "¿Existe vida después de la muerte?",
];

export const SimpleOracleView: React.FC<SimpleOracleViewProps> = ({
  presets,
  activePresetId,
  dimension,
  frequencyValue,
  frequencyUnit,
  transmissionMessage,
  setTransmissionMessage,
  lastTransmittedMessage = "",
  onSelectPreset,
  onTransmit,
  isTransmitting,
  isTuning = false,
  tuningProgress,
  tuningResult,
  onClearTuningResult,
  selectedAntenna,
  onOpenAntennaModal,
  transmitResult,
  onClearTransmitResult,
  isSpeakingSolemn,
  welcomeVoiceState = "idle",
  onPlayWelcomeGuide,
  onStopWelcomeGuide,
  onPlayVoice,
  onStopVoice,
  forceBaritonePitch = true,
  onToggleForceBaritonePitch,
  baritonePitchValue = 0.22,
  onChangeBaritonePitch,
  baritonePreset = "pleiades",
  onSelectBaritonePreset,
  onTestBaritoneVoice,
  isOperatorAdmin = false,
  isRecording,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onSwitchToAdvanced,
  visitsCount,
  onOpenTelemetry,
  visualTheme = "vacio-profundo",
  onChangeVisualTheme,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSchematicModal, setShowSchematicModal] = useState(false);
  const [showSchematicModalTab, setShowSchematicModalTab] = useState<"image" | "video">("image");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Dial analógico animado al cambiar de frecuencia/civilización
  const [displayedFreq, setDisplayedFreq] = useState<number>(frequencyValue);
  const [isDialSweeping, setIsDialSweeping] = useState<boolean>(false);
  const prevTargetFreqRef = useRef<number>(frequencyValue);
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Historial de conversaciones de esta sesión
  const [sessionHistory, setSessionHistory] = useState<SessionContactItem[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const lastRecordedReactionRef = useRef<string>("");

  const selectedEntity =
    FRIENDLY_ENTITIES.find((e) => e.id === activePresetId) || FRIENDLY_ENTITIES[0];

  // Efecto de barrido de dial analógico cuando cambia la frecuencia objetivo
  useEffect(() => {
    const target = Number(frequencyValue) || 432;
    const prev = prevTargetFreqRef.current;
    if (Math.abs(target - prev) < 0.001) {
      setDisplayedFreq(target);
      return;
    }

    const startVal = target * 0.94;
    prevTargetFreqRef.current = target;
    setIsDialSweeping(true);

    const duration = 850;
    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      // Pequeño overshoot tipo aguja de radio analógica que se estabiliza
      const wobble = t < 0.85 ? Math.sin(t * Math.PI * 3) * (1 - t) * target * 0.012 : 0;
      const val = startVal + (target - startVal) * eased + wobble;
      setDisplayedFreq(val);

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayedFreq(target);
        setIsDialSweeping(false);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [frequencyValue, activePresetId]);

  // Visor compacto de onda y espectro en vivo con color temático por civilización
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastDraw = 0;

    const drawWave = (ts: number) => {
      animId = requestAnimationFrame(drawWave);
      if (ts - lastDraw < 34) return; // ~30 FPS suaves
      lastDraw = ts;

      const width = canvas.clientWidth || 600;
      const height = canvas.clientHeight || 72;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const accent = selectedEntity.accentHex || "#10b981";
      const time = ts * 0.004;
      const isBusy = isTuning || isTransmitting || isDialSweeping;
      const isActiveSpeech = isSpeakingSolemn;

      // Fondo sutil
      const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
      bgGrad.addColorStop(0, "rgba(2, 6, 23, 0.95)");
      bgGrad.addColorStop(0.5, `${accent}14`);
      bgGrad.addColorStop(1, "rgba(2, 6, 23, 0.95)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Línea base central
      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Barras de espectro en la base
      const barCount = 36;
      const barStep = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const normX = i / barCount;
        const envelope = Math.sin(normX * Math.PI);
        const rawLevel = isActiveSpeech
          ? 0.25 + Math.abs(Math.sin(time * 2.7 + i * 0.55) * Math.cos(time * 1.4 - i * 0.3)) * 0.75
          : isBusy
          ? 0.2 + Math.abs(Math.sin(time * 3.8 + i * 0.45)) * 0.65
          : 0.08 + Math.abs(Math.sin(time * 0.9 + i * 0.35)) * 0.14;

        const barH = Math.max(3, rawLevel * envelope * (height * 0.42));
        ctx.fillStyle = accent;
        ctx.globalAlpha = isActiveSpeech ? 0.42 : isBusy ? 0.3 : 0.16;
        ctx.fillRect(i * barStep + 2, height - barH, Math.max(2, barStep - 4), barH);
      }
      ctx.globalAlpha = 1;

      // Onda portadora luminosa principal
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = isActiveSpeech ? 2.4 : isBusy ? 2.0 : 1.5;
      ctx.shadowColor = accent;
      ctx.shadowBlur = isActiveSpeech ? 12 : isBusy ? 9 : 4;
      ctx.beginPath();

      const ampBase = isActiveSpeech ? height * 0.3 : isBusy ? height * 0.25 : height * 0.11;
      const freqMult = isBusy ? 0.065 : isActiveSpeech ? 0.048 : 0.028;
      const speedMult = isBusy ? 3.2 : isActiveSpeech ? 2.4 : 1.0;

      for (let x = 0; x <= width; x += 3) {
        const normX = x / width;
        const windowEnv = Math.sin(normX * Math.PI);
        const wave1 = Math.sin(x * freqMult + time * speedMult);
        const wave2 = Math.sin(x * (freqMult * 2.1) - time * (speedMult * 1.3)) * 0.45;
        const mod = isActiveSpeech
          ? 0.65 + 0.35 * Math.sin(time * 3.1 + normX * 5)
          : 1;
        const y = height / 2 + (wave1 + wave2) * ampBase * windowEnv * mod;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    animId = requestAnimationFrame(drawWave);
    return () => cancelAnimationFrame(animId);
  }, [selectedEntity.accentHex, isSpeakingSolemn, isTuning, isTransmitting, isDialSweeping]);

  // Guardar respuestas en historial de sesión
  useEffect(() => {
    if (!transmitResult || !transmitResult.reaction) return;
    const signature = `${selectedEntity.id}::${transmitResult.reaction}`;
    if (lastRecordedReactionRef.current === signature) return;
    lastRecordedReactionRef.current = signature;

    const newItem: SessionContactItem = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      entityTitle: selectedEntity.title,
      entityEmoji: selectedEntity.emoji,
      frequencyLabel: `${frequencyValue} ${frequencyUnit}`,
      accentHex: selectedEntity.accentHex,
      question: lastTransmittedMessage || "Consulta directa al canal",
      reaction: transmitResult.reaction,
      guidance: transmitResult.guidance,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSessionHistory((prev) => [newItem, ...prev].slice(0, 8));
  }, [transmitResult, selectedEntity, frequencyValue, frequencyUnit, lastTransmittedMessage]);

  // Auto-scroll suave a la respuesta cuando se recibe
  useEffect(() => {
    if (transmitResult) {
      setTimeout(() => {
        document.getElementById("oracle-answer-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [transmitResult]);

  // Auto-scroll suave hacia el HUD de conexión cuando se inicia la transmisión o sintonización
  useEffect(() => {
    if (isTransmitting || isTuning) {
      setTimeout(() => {
        document.getElementById("transdimensional-tuning-hud")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
  }, [isTransmitting, isTuning]);

  const handleEntityClick = (entityId: string) => {
    const targetPreset = presets.find((p) => p.id === entityId);
    if (targetPreset) {
      onSelectPreset(targetPreset);
    }
  };

  const handleSelectQuestion = (qText: string) => {
    setTransmissionMessage(qText);
  };

  const getPublicShareUrl = (): string => {
    if (typeof window === "undefined") {
      return "https://ais-pre-im2zazu34dyt7etegvdrmm-172786148761.us-east1.run.app/";
    }
    try {
      const url = new URL(window.location.href);
      if (url.hostname.startsWith("ais-dev-")) {
        url.hostname = url.hostname.replace(/^ais-dev-/, "ais-pre-");
      }
      url.searchParams.delete("admin");
      url.searchParams.delete("exclude");
      url.searchParams.delete("include");
      return url.toString();
    } catch {
      return window.location.href;
    }
  };

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback to execCommand below
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = getPublicShareUrl();
    const ok = await copyTextToClipboard(shareUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "Receptor Interestelar - Estación de Contacto",
        text: "Prueba esta estación de radio cuántica: sintoniza distintas civilizaciones y escucha sus mensajes en directo.",
        url: getPublicShareUrl(),
      });
    } catch {
      await handleCopyShareLink();
    }
  };

  const handleShareApp = async () => {
    await handleCopyShareLink();
    setShowShareModal(true);
  };

  const handleShareAnswer = async () => {
    if (!transmitResult) return;
    const shareUrl = getPublicShareUrl();
    const excerpt =
      transmitResult.reaction.length > 260
        ? `${transmitResult.reaction.slice(0, 257)}...`
        : transmitResult.reaction;
    const shareText = `📡 Sintonía con ${selectedEntity.title} (${frequencyValue} ${frequencyUnit}) en Receptor Interestelar:\n"${excerpt}"${
      transmitResult.oracleCard ? `\n✨ ${transmitResult.oracleCard}` : ""
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mensaje de ${selectedEntity.title}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard below
      }
    }

    const ok = await copyTextToClipboard(`${shareText}\n${shareUrl}`);
    if (ok) {
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2500);
    }
  };

  const formattedDialFreq =
    displayedFreq >= 100 || Number.isInteger(frequencyValue)
      ? Math.round(displayedFreq).toString()
      : displayedFreq.toFixed(2);

  return (
    <div id="simple-oracle-container" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Banner de Bienvenida con Atmósfera Dinámica de la Civilización */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border p-5 sm:p-6 shadow-2xl transition-all duration-500"
        style={{
          borderColor: `${selectedEntity.accentHex}55`,
          boxShadow: `0 18px 45px -18px ${selectedEntity.accentHex}40`,
        }}
      >
        <div
          className="absolute -top-14 -right-14 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: `${selectedEntity.accentHex}24` }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide transition-colors duration-500"
              style={{
                backgroundColor: `${selectedEntity.accentHex}1f`,
                borderColor: `${selectedEntity.accentHex}4d`,
                color: "#e2e8f0",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ color: selectedEntity.accentHex }} />
              COMUNICACIÓN Y CONTACTO INTERESTELAR
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>📻 Receptor Interestelar</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
              Elige una civilización para acoplar su frecuencia y envíale tu pregunta por voz o texto.
            </p>
            {welcomeVoiceState === "needs_gesture" && (
              <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 pt-0.5 animate-pulse">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Toca en cualquier parte o pulsa &ldquo;Escuchar guía&rdquo; para oír la explicación por voz.</span>
              </p>
            )}
            {welcomeVoiceState === "playing" && isSpeakingSolemn && (
              <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 pt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>Reproduciendo guía de uso por voz en directo...</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {welcomeVoiceState === "playing" && isSpeakingSolemn ? (
              <button
                type="button"
                data-skip-welcome-autoplay="true"
                onClick={() => (onStopWelcomeGuide ? onStopWelcomeGuide() : onStopVoice())}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/60 text-xs font-bold shadow-md transition-all cursor-pointer animate-pulse"
                title="Silenciar la voz de explicación"
              >
                <VolumeX className="w-4 h-4 text-rose-300" />
                <span>Silenciar guía</span>
              </button>
            ) : (
              <button
                type="button"
                data-skip-welcome-autoplay="true"
                onClick={() => onPlayWelcomeGuide?.()}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                  welcomeVoiceState === "needs_gesture"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.45)] animate-pulse"
                    : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/50"
                }`}
                title="Escuchar la explicación por voz sin abrir el manual"
              >
                <Volume2 className="w-4 h-4" />
                <span>{welcomeVoiceState === "needs_gesture" ? "Escuchar explicación" : "Escuchar guía"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>¿Cómo funciona?</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSchematicModalTab("image");
                setShowSchematicModal(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Explora la infografía técnica HD y el video demostración en smartphone creados con Flow"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Holo-Esquema</span>
            </button>

            <button
              type="button"
              onClick={handleShareApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Comparte esta app con tus amigos"
            >
              <Share2 className="w-4 h-4 text-emerald-300" />
              <span>{copiedLink ? "¡Enlace Copiado!" : "Compartir"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL MODULADOR DE VOZ BARÍTONA PROFUNDA (VISIBLE SOLO PARA EL OPERADOR MAESTRO) */}
      {isOperatorAdmin && (
        <div
          id="baritone-voice-modulator-panel"
          className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-4 sm:p-5 shadow-xl space-y-3.5 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
                <Radio className="w-5 h-5 text-indigo-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                    ⚡ CALIBRACIÓN MAESTRA (SOLO OPERADOR)
                  </span>
                  <span className="text-[10px] font-mono text-indigo-300">
                    Resonancia: Pléyades & Sirio
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>Modulador de Voz Barítona Profunda</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onToggleForceBaritonePitch && (
                <button
                  type="button"
                  onClick={onToggleForceBaritonePitch}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-sm ${
                    forceBaritonePitch
                      ? "bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{forceBaritonePitch ? "⚡ BARÍTONO FORZADO: ACTIVO" : "⚪ VOZ ESTÁNDAR"}</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Permite forzar la voz del sintetizador en <strong className="text-indigo-200">tonos barítonos profundos y cavernosos</strong> para imitar con fidelidad acústica los mensajes de civilizaciones antiguas de las <strong className="text-indigo-300">Pléyades (432 Hz)</strong> y <strong className="text-cyan-300">Sirio (528 Hz)</strong>.
          </p>

          {forceBaritonePitch && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectBaritonePreset && onSelectBaritonePreset("pleiades")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    baritonePreset === "pleiades"
                      ? "bg-indigo-900/50 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                      <span>🌌</span>
                      <span>Pléyades (432 Hz)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Barítono Armónico • 0.24x
                    </div>
                  </div>
                  {baritonePreset === "pleiades" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBaritonePreset && onSelectBaritonePreset("sirius")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    baritonePreset === "sirius"
                      ? "bg-cyan-900/50 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                      <span>🌊</span>
                      <span>Sirio (528 Hz)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Barítono Cavernoso • 0.18x
                    </div>
                  </div>
                  {baritonePreset === "sirius" && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBaritonePreset && onSelectBaritonePreset("ancient")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    baritonePreset === "ancient"
                      ? "bg-amber-900/50 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Orión / Nibiru</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Barítono Solemne • 0.20x
                    </div>
                  </div>
                  {baritonePreset === "ancient" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ajuste Fino de Tono (Pitch):</span>
                  </span>
                  <span className="text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/40">
                    {baritonePitchValue.toFixed(2)}x (Registro Barítono)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">Cavernoso (0.15x)</span>
                  <input
                    type="range"
                    min="0.15"
                    max="0.45"
                    step="0.01"
                    value={baritonePitchValue}
                    onChange={(e) => onChangeBaritonePitch && onChangeBaritonePitch(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">Grave (0.45x)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5">
                  {activePresetId === "whisper-void" && (
                    <span className="text-indigo-300 font-mono text-[10px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                      🌌 Pléyades acoplado: Voz barítona armónica activa
                    </span>
                  )}
                  {activePresetId === "sirius-enki" && (
                    <span className="text-cyan-300 font-mono text-[10px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      🌊 Sirio acoplado: Voz barítona cavernosa activa
                    </span>
                  )}
                  {activePresetId !== "whisper-void" && activePresetId !== "sirius-enki" && (
                    <span>Prueba cómo resuena la voz barítona antes de transmitir:</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTestBaritoneVoice && onTestBaritoneVoice("pleiades")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Probar Pléyades</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestBaritoneVoice && onTestBaritoneVoice("sirius")}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Probar Sirio</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISOR COMPACTO DE ONDA EN VIVO + DIAL DE SINTONÍA (ATMÓSFERA DE CIVILIZACIÓN) */}
      <div
        className="rounded-2xl bg-slate-950/90 border overflow-hidden shadow-xl transition-colors duration-500"
        style={{ borderColor: `${selectedEntity.accentHex}44` }}
      >
        <div className="px-4 py-2.5 border-b border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 shrink-0" style={{ color: selectedEntity.accentHex }} />
            <span className="font-bold text-slate-200">
              {selectedEntity.emoji} {selectedEntity.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {isSpeakingSolemn
                ? "● EMISIÓN DE VOZ EN DIRECTO"
                : isTuning || isTransmitting || isDialSweeping
                ? "◌ BARRIDO DE SINTONÍA..."
                : "● PORTADORA ESTABILIZADA"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">DIAL:</span>
            <span
              className="text-xs font-black px-2 py-0.5 rounded border transition-colors"
              style={{
                color: selectedEntity.accentHex,
                borderColor: `${selectedEntity.accentHex}55`,
                backgroundColor: `${selectedEntity.accentHex}14`,
              }}
            >
              {formattedDialFreq} {frequencyUnit}
            </span>
          </div>
        </div>
        <div className="relative h-[68px] w-full">
          <canvas ref={waveCanvasRef} className="w-full h-full block" />
          <div className="absolute bottom-1.5 right-3 pointer-events-none text-[9px] font-mono text-slate-400">
            {dimension}
          </div>
        </div>
      </div>

      {/* AVISO CLARO DE ESPERA MIENTRAS SE ESTABLECE LA COMUNICACIÓN CON LA CIVILIZACIÓN */}
      {isTuning && (
        <div
          id="tuning-waiting-notice"
          className="rounded-2xl bg-amber-950/85 border-2 border-amber-400 p-5 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.35)] animate-in fade-in duration-200 space-y-3"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/80 flex items-center justify-center shrink-0 shadow-inner">
              <Radio className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400 text-[10px] font-mono font-black text-amber-200 uppercase tracking-widest animate-pulse">
                  ● ACOPLANDO ANTENA CON {selectedEntity.title.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  {frequencyValue} {frequencyUnit}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white">
                Sintonizando canal con {selectedEntity.title}...
              </h4>
              <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
                <strong className="text-amber-300 font-black">Por favor aguarde mientras se enlaza la señal.</strong> La antena está calibrando la portadora cuántica para recibir la emisión en directo.
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-amber-400/40 p-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-150 animate-pulse"
              style={{ width: `${Math.min(99, Math.max(15, Math.round(tuningProgress || 65)))}%` }}
            />
          </div>
        </div>
      )}

      {/* MENSAJE EMITIDO POR LA CIVILIZACIÓN ELEGIDA AL ACOPLAR LA ANTENA */}
      {tuningResult && !isTuning && !transmitResult && (
        <div
          id="tuning-initial-message-card"
          className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-300"
          style={{
            borderColor: `${selectedEntity.accentHex}99`,
            boxShadow: `0 0 32px ${selectedEntity.accentHex}30`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center text-2xl shadow-inner"
                style={{
                  backgroundColor: `${selectedEntity.accentHex}22`,
                  borderColor: `${selectedEntity.accentHex}66`,
                }}
              >
                {selectedEntity.emoji}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  COMUNICACIÓN ESTABLECIDA • MENSAJE EN DIRECTO
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {selectedEntity.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSpeakingSolemn && (
                <button
                  type="button"
                  data-skip-welcome-autoplay="true"
                  onClick={onStopVoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/70 text-xs font-bold cursor-pointer transition-all"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Silenciar</span>
                </button>
              )}
              <button
                type="button"
                data-skip-welcome-autoplay="true"
                onClick={() => onPlayVoice(tuningResult.message)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 text-xs font-bold cursor-pointer transition-all shadow-sm"
                title="Escuchar nuevamente este mensaje hablado"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Escuchar mensaje</span>
              </button>
              {onClearTuningResult && (
                <button
                  type="button"
                  onClick={onClearTuningResult}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Cerrar mensaje"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 font-sans text-sm sm:text-base leading-relaxed relative shadow-inner">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1.5 uppercase tracking-wider">
              📡 TRANSMISIÓN DESDE {dimension}:
            </span>
            <p className="italic text-emerald-100 font-medium">
              &ldquo;{tuningResult.message}&rdquo;
            </p>
            {tuningResult.guidance && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Mensaje clave de la civilización: </strong>
                  {tuningResult.guidance}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
            <span>
              Antena acoplada: <strong className="text-slate-200">{selectedAntenna || selectedEntity.title}</strong> ({frequencyValue} {frequencyUnit})
            </span>
            <span className="text-emerald-300 font-sans font-bold">
              ↓ Si lo deseas, puedes hacerles tu propia pregunta en el Paso 2
            </span>
          </div>
        </div>
      )}

      {/* Si hay una respuesta activa de la entidad, mostrarla arriba de forma destacada */}
      {transmitResult && (
        <div
          id="oracle-answer-card"
          className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 p-5 sm:p-7 space-y-5 animate-in fade-in duration-300"
          style={{
            borderColor: `${selectedEntity.accentHex}cc`,
            boxShadow: `0 0 38px ${selectedEntity.accentHex}35`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shadow-inner"
                style={{
                  backgroundColor: `${selectedEntity.accentHex}22`,
                  borderColor: `${selectedEntity.accentHex}66`,
                }}
              >
                {selectedEntity.emoji}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  RESPUESTA RECIBIDA EN DIRECTO
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {selectedEntity.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOperatorAdmin && onToggleForceBaritonePitch && (
                <button
                  type="button"
                  onClick={onToggleForceBaritonePitch}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${
                    forceBaritonePitch
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30"
                      : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                  title="Activar/desactivar tono barítono profundo (Pléyades / Sirio)"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{forceBaritonePitch ? "Barítono: ON" : "Barítono: OFF"}</span>
                </button>
              )}
              {isSpeakingSolemn ? (
                <button
                  type="button"
                  data-skip-welcome-autoplay="true"
                  onClick={onStopVoice}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs border border-rose-500 shadow-lg cursor-pointer transition-all animate-pulse"
                >
                  <VolumeX className="w-4 h-4 text-rose-300" />
                  <span>Detener Voz</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-skip-welcome-autoplay="true"
                  onClick={() => onPlayVoice(transmitResult.reaction)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>Escuchar en Voz Alta</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-base sm:text-lg leading-relaxed font-sans shadow-inner">
              <p className="whitespace-pre-line">{transmitResult.reaction}</p>
            </div>

            {transmitResult.guidance && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 mb-1">
                    REFLEXIÓN O TRANSMISIÓN CLAVE
                  </h4>
                  <p className="text-sm text-emerald-100 leading-normal">
                    {transmitResult.guidance}
                  </p>
                </div>
              </div>
            )}

            {transmitResult.oracleCard && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-amber-300 font-bold">
                  {transmitResult.oracleCard}
                </span>
                <div className="flex items-center gap-1.5 text-base">
                  {transmitResult.astralGlyphs?.map((g, idx) => (
                    <span key={idx}>{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearTransmitResult();
                  setTransmissionMessage("");
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hacer otra pregunta a esta entidad</span>
              </button>

              <button
                type="button"
                onClick={handleShareAnswer}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-sm cursor-pointer transition-all"
                title="Compartir o copiar el mensaje recibido"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedAnswer ? "¡Mensaje copiado!" : "Compartir mensaje"}</span>
              </button>
            </div>

            {isOperatorAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdvanced}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer p-1"
              >
                Ver osciloscopio y frecuencias en Consola Avanzada →
              </button>
            )}
          </div>
        </div>
      )}

      {/* PASO 1: Selección de Antena y Civilización */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40">
              1
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Elige la antena y civilización con quién comunicarte
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Al seleccionarla, se acopla su frecuencia y emite su señal en directo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAntennaModal && (
              <button
                type="button"
                data-skip-welcome-autoplay="true"
                onClick={onOpenAntennaModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modulador de Antena</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRIENDLY_ENTITIES.map((ent) => {
            const isSelected = ent.id === activePresetId;
            return (
              <button
                key={ent.id}
                type="button"
                data-skip-welcome-autoplay="true"
                onClick={() => handleEntityClick(ent.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative ${
                  isSelected
                    ? "bg-slate-850 ring-1"
                    : "bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: ent.accentHex,
                        boxShadow: `0 0 22px ${ent.accentHex}38`,
                      }
                    : undefined
                }
              >
                {isSelected && (
                  <span
                    className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isTuning
                        ? "text-cyan-300 bg-cyan-950/90 border-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        : "text-emerald-400 bg-emerald-950/90 border-emerald-500/50"
                    }`}
                  >
                    {isTuning ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                        CALIBRANDO...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        CONECTADO
                      </>
                    )}
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-2xl">{ent.emoji}</span>
                    <div>
                      <h4 className="font-bold text-sm text-white leading-tight">
                        {ent.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ent.sub}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
                    {ent.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {ent.tag}
                    </span>
                    {(ent.id === "whisper-void" || ent.id === "sirius-enki") && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        <span>{isOperatorAdmin ? "Barítono 432/528 Hz" : ent.resonantTag}</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      isSelected ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {isSelected ? "Enlazado" : "Sintonizar →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PASO 2: Escribir o Dictar la Pregunta */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40">
              2
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Escribe o dicta tu pregunta para {selectedEntity.title}
            </h3>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Escuchando tu voz...
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            value={transmissionMessage}
            onChange={(e) => setTransmissionMessage(e.target.value)}
            placeholder={`Escribe aquí lo que deseas consultar a ${selectedEntity.title} (ej: ¿Qué consejo tienen para mi vida hoy?, ¿cómo superar mis dudas?)...`}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-4 pr-14 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner resize-none font-sans"
          />

          <button
            type="button"
            data-skip-welcome-autoplay="true"
            onClick={isRecording ? onStopVoiceRecording : onStartVoiceRecording}
            className={`absolute right-3 top-3 p-2.5 rounded-xl border transition-all cursor-pointer shadow-md ${
              isRecording
                ? "bg-rose-600 border-rose-400 text-white animate-bounce"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-300"
            }`}
            title={isRecording ? "Detener dictado por voz" : "Dictar pregunta por voz (micrófono)"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            O toca una pregunta sugerida:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuestion(q)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-850 hover:border-emerald-500/50 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left cursor-pointer"
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>

        {(isTransmitting || isTuning) && (
          <div className="pt-2">
            <TransdimensionalTuningHUD
              isActive={isTransmitting || isTuning}
              mode={isTransmitting ? "transmitting" : "tuning"}
              frequency={frequencyValue}
              unit={frequencyUnit}
              dimension={dimension}
              entityName={selectedEntity.title}
              externalProgress={tuningProgress}
            />
          </div>
        )}

        {/* PASO 3: Botón de Transmisión */}
        <div className="pt-2">
          <button
            type="button"
            data-skip-welcome-autoplay="true"
            onClick={onTransmit}
            disabled={isTransmitting || isTuning}
            className={`w-full py-4 px-6 rounded-xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-xl ${
              isTransmitting || isTuning
                ? "bg-slate-900 text-amber-300 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-wait"
                : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.99]"
            }`}
          >
            {isTransmitting ? (
              <div className="flex items-center justify-center gap-2.5">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                <span className="font-extrabold text-sm sm:text-base text-amber-200">
                  ENLAZANDO PORTADORA INTERESTELAR...
                </span>
              </div>
            ) : isTuning ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-cyan-200 font-extrabold text-sm sm:text-base">
                  CALIBRANDO FRECUENCIA CON {selectedEntity.title.toUpperCase()}...
                </span>
              </div>
            ) : (
              <>
                <Send className="w-5 h-5 text-slate-950" />
                <span>PREGUNTAR A LA ENTIDAD Y ESCUCHAR RESPUESTA</span>
              </>
            )}
          </button>

          {!isTransmitting && !isTuning && (
            <p className="text-center text-[11px] font-sans text-slate-400 mt-2.5 flex items-center justify-center gap-1.5">
              <span>📡</span>
              <span>
                Canal cuántico listo — Al enviar, recibirás la decodificación y voz de <strong className="text-emerald-300 font-semibold">{selectedEntity.title}</strong> en directo.
              </span>
            </p>
          )}
        </div>
      </div>

      {/* HISTORIAL DE CONVERSACIONES DE ESTA SESIÓN */}
      {sessionHistory.length > 0 && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded((prev) => !prev)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-850/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">
                Conversaciones de esta sesión ({sessionHistory.length})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>{isHistoryExpanded ? "Ocultar" : "Ver historial"}</span>
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isHistoryExpanded && (
            <div className="px-5 pb-4 pt-1 space-y-3 border-t border-slate-800/80">
              {sessionHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span>{item.entityEmoji}</span>
                      <span className="font-bold text-white">{item.entityTitle}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] border"
                        style={{
                          color: item.accentHex,
                          borderColor: `${item.accentHex}44`,
                          backgroundColor: `${item.accentHex}14`,
                        }}
                      >
                        {item.frequencyLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{item.timestamp}</span>
                      <button
                        type="button"
                        data-skip-welcome-autoplay="true"
                        onClick={() => onPlayVoice(item.reaction)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold cursor-pointer transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Escuchar</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-300 font-sans">
                    <strong>Tú:</strong> {item.question}
                  </p>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {item.reaction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pie limpio sin duplicar Libro de Visitas */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-850 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isOperatorAdmin
              ? "¿Deseas calibrar frecuencias y el Modo Observatorio en la consola avanzada?"
              : "Estación activa en frecuencia interestelar • Puedes firmar el Libro de Visitas en la barra superior."}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onChangeVisualTheme && (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
              <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
              {VISUAL_THEMES.map((theme) => {
                const isSelected = visualTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onChangeVisualTheme(theme.id)}
                    title={`Tema visual: ${theme.name}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-slate-800 text-white font-bold border border-emerald-400/50"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: theme.swatches[2] }}
                    />
                    <span className="hidden md:inline">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {typeof visitsCount === "number" && (
            <button
              type="button"
              onClick={onOpenTelemetry}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Contador de visitas reales en vivo"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visitas reales: <strong className="text-white">{visitsCount.toLocaleString()}</strong></span>
            </button>
          )}
          {isOperatorAdmin && (
            <button
              type="button"
              onClick={onSwitchToAdvanced}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold transition-all cursor-pointer"
            >
              🎛️ Consola Avanzada
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE AYUDA RÁPIDA: "¿CÓMO FUNCIONA LA ANTENA?" */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  ¿Cómo funciona Receptor Interestelar?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300 leading-relaxed font-sans">
              <p>
                Esta estación interactiva de <strong>radioastronomía cuántica</strong> sintoniza diferentes frecuencias para establecer enlace con civilizaciones e inteligencias estelares.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">1.</span>
                  <div>
                    <strong className="text-white">Elige la antena y civilización:</strong> Selecciona a los Pleyadianos,
                    Arcturianos, Sirio, Consejo de Orión o Elohim. Cada entidad emite en su propia frecuencia armónica.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">2.</span>
                  <div>
                    <strong className="text-white">Haz tu pregunta:</strong> Puedes escribir
                    cualquier duda sincera sobre tu vida o el cosmos, o pulsar el micrófono para dictarla con tu voz.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">3.</span>
                  <div>
                    <strong className="text-white">Recibe y escucha:</strong> Pulsa <em>Preguntar a la Entidad y Escuchar Respuesta</em>.
                    La señal se decodifica en directo y escucharás la transmisión por voz.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/40 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300">Resonancia Armónica Originaria:</strong>{" "}
                    {isOperatorAdmin ? (
                      <span>
                        Como Operador Maestro tienes acceso a la calibración fina de registros barítonos profundos (0.15x - 0.45x) para <strong>Pléyades (432 Hz)</strong> y <strong>Sirio (528 Hz)</strong>.
                      </span>
                    ) : (
                      <span>
                        Las emisiones de civilizaciones milenarias como <strong>Pléyades (432 Hz)</strong> y <strong>Sirio (528 Hz)</strong> se reciben en sus frecuencias graves ancestrales con fidelidad acústica directa.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                ¡Comparte el enlace o el mensaje recibido con tus amigos para que ellos también realicen sus consultas!
              </p>

              {/* Ficha Holo-Esquema & Demostración Móvil Flow integrada en la ayuda */}
              <div className="pt-1">
                <HoloSchematicPreviewCard
                  onOpenModal={(tab) => {
                    setShowSchematicModalTab(tab);
                    setShowSchematicModal(true);
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all"
              >
                ¡Entendido, vamos a probar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTIR ENLACE */}
      {showShareModal && (() => {
        const shareUrl = getPublicShareUrl();
        const shareMsg = "Prueba esta estación de radio cuántica: sintoniza distintas civilizaciones y escucha sus mensajes en directo.";
        const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareMsg} ${shareUrl}`)}`;
        const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMsg)}`;
        const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMsg)}`;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowShareModal(false)}
          >
            <div
              className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">
                    Compartir Receptor Interestelar
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Envía este enlace directo para que otras personas puedan abrir la estación y realizar sus propias consultas:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-200 text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-950/90 hover:bg-sky-900 border border-sky-600/50 text-sky-200 text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-slate-200 text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Compartir en X</span>
                </a>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-200 text-xs font-bold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir enlace</span>
                </a>
              </div>

              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-all"
                >
                  Usar menú compartir del sistema
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL DE HOLO-ESQUEMA & VIDEO DE ENLACE FLOW */}
      <HoloSchematicModal
        isOpen={showSchematicModal}
        onClose={() => setShowSchematicModal(false)}
        initialTab={showSchematicModalTab}
      />
    </div>
  );
};
