import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Send,
  Sliders,
  Sparkles,
  Info,
  AlertTriangle,
  RefreshCw,
  Globe,
  Settings,
  Flame,
  X,
  Volume2,
  Mic,
  MicOff,
  Eye,
  Bell,
  BellOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Zap,
  Shield,
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  ExternalLink,
  BarChart3,
  Users,
  Cpu,
  Activity,
  Battery,
  BatteryCharging,
  Maximize2,
  Minimize2,
  Lightbulb,
  Clock,
  Square,
  Play,
  Compass,
  Music,
  Navigation,
  MapPin,
} from "lucide-react";
import { DimensionPreset, LogEntry, SignalResponse, TransmitResponse } from "./types";
import { DIMENSION_PRESETS } from "./presets";
import {
  initMixpanel,
  trackEvent,
  getMixpanelToken,
  saveMixpanelToken,
  isMixpanelInitialized,
  getDistinctId,
  isOperatorExcluded,
  setOperatorExcluded,
  fetchMixpanelLogs,
} from "./mixpanel";
import {
  getCloudVisits,
  registerCloudVisit,
  setManualCount as setCloudManualCount,
} from "./cloudCounter";
import SignalVisualizer from "./components/SignalVisualizer";
import DirectoryList from "./components/DirectoryList";
import LogTable from "./components/LogTable";
import TelemetryChart from "./components/TelemetryChart";
import FundingWidget from "./components/FundingWidget";
import StarMapVisualizer from "./components/StarMapVisualizer";
import MembraneStatusPanel from "./components/MembraneStatusPanel";
import AntennaSelectorModal, { ANTENNA_OPTIONS } from "./components/AntennaSelectorModal";
import AmbientAudioEqualizer from "./components/AmbientAudioEqualizer";
import { TransmissionWaveVisualizer } from "./components/TransmissionWaveVisualizer";
import { CircularProgressRing } from "./components/CircularProgressRing";
import { SuggestionsBlogModal } from "./components/SuggestionsBlogModal";
import { StellarParticlesCanvas } from "./components/StellarParticlesCanvas";
import { DimensionalJumpOverlay } from "./components/DimensionalJumpOverlay";
import { radioStatic } from "./radioStatic";

interface QuantumToast {
  id: string;
  title: string;
  message: string;
  type: "anomaly" | "high-intensity";
  timestamp: Date;
}

export default function App() {
  // Operador Local State
  const [operatorName, setOperatorName] = useState(() => localStorage.getItem("antena_operator_name") || "Operador-01");
  const [operatorRank, setOperatorRank] = useState(() => localStorage.getItem("antena_operator_rank") || "Operador Transdimensional");
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [tempOperatorName, setTempOperatorName] = useState(operatorName);
  const [tempOperatorRank, setTempOperatorRank] = useState(operatorRank);

  // Microphone and Voice Modulation States
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [vocalFrequency, setVocalFrequency] = useState<number>(0);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Antenna Tuning States
  const [frequencyValue, setFrequencyValue] = useState<number>(432);
  const [frequencyUnit, setFrequencyUnit] = useState<"Hz" | "kHz" | "MHz" | "GHz" | "THz" | "QHz">("Hz");
  const [dimension, setDimension] = useState<string>("D-11 // VECTOR-NULL");
  const [intensity, setIntensity] = useState<number>(80);
  const [useGaussianFilter, setUseGaussianFilter] = useState<boolean>(false);
  const [antennaType, setAntennaType] = useState<string>("Antena Piramidal Anunnaki (Monolito Oro-Cuneiforme // Nibiru)");
  const [isAntennaModalOpen, setIsAntennaModalOpen] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string | null>("whisper-void");

  // Flow and API States
  const [activeTab, setActiveTab] = useState<"receptor" | "transmisor">("receptor");
  const [isTuning, setIsTuning] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [tuningResult, setTuningResult] = useState<SignalResponse | null>(null);
  const [transmitResult, setTransmitResult] = useState<TransmitResponse | null>(null);
  const [transmissionMessage, setTransmissionMessage] = useState("");
  const [lastTransmittedMessage, setLastTransmittedMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Escaneo Continuo States
  const [isScanning, setIsScanning] = useState(false);
  const [scanSecondsLeft, setScanSecondsLeft] = useState(15);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Voice Reader state (Speech Synthesis)
  const [isVoiceReaderEnabled, setIsVoiceReaderEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTone, setVoiceTone] = useState<"alternar" | "solemne-hombre" | "estandar" | "latino-neutro">("solemne-hombre");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [forceLowPitch, setForceLowPitch] = useState<boolean>(true);
  const [customPitchValue, setCustomPitchValue] = useState<number>(0.32);
  const toggleMaleVoiceRef = useRef<boolean>(false);

  // Visitas y Telemetría Mixpanel State (Contador Real Monótono Creciente)
  const [visits, setVisits] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("antena_cached_visits");
        if (cached) {
          const val = parseInt(cached, 10);
          if (!isNaN(val) && val > 0) return val;
        }
      } catch (e) {}
    }
    return 152;
  });

  // Garantiza que el contador NUNCA baje ni cuente hacia atrás
  const updateVisitsState = useCallback((newCount: number) => {
    if (typeof newCount !== "number" || isNaN(newCount)) return;
    setVisits((prev) => {
      const nextVal = Math.max(prev, newCount);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("antena_cached_visits", String(nextVal));
        } catch (e) {}
      }
      return nextVal;
    });
  }, []);

  // Permitir solo ajuste explícito del administrador
  const setVisitsExplicit = useCallback((newCount: number) => {
    const cleanVal = Math.max(0, newCount);
    setVisits(cleanVal);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("antena_cached_visits", String(cleanVal));
      } catch (e) {}
    }
  }, []);
  const [customVisitsInput, setCustomVisitsInput] = useState<string>("");
  const [isMixpanelModalOpen, setIsMixpanelModalOpen] = useState(false);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [mixpanelTokenInput, setMixpanelTokenInput] = useState(() => getMixpanelToken());
  const [isMixpanelConnected, setIsMixpanelConnected] = useState(() => isMixpanelInitialized());
  const [isExcludedOperator, setIsExcludedOperator] = useState<boolean>(() => isOperatorExcluded());
  const [mixpanelLogsList, setMixpanelLogsList] = useState<any[]>([]);
  const [isSavingMixpanelToken, setIsSavingMixpanelToken] = useState(false);

  // Salto Dimensional State (>90% resonancia)
  const [isDimensionalJumpActive, setIsDimensionalJumpActive] = useState(false);
  const [jumpResonance, setJumpResonance] = useState(0);
  const [jumpEntity, setJumpEntity] = useState("");
  const [jumpDimension, setJumpDimension] = useState("");

  // Cargar logs de Mixpanel y token guardado en servidor cuando el modal está abierto
  useEffect(() => {
    if (!isMixpanelModalOpen) return;
    fetch("/api/mixpanel/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg && cfg.token) {
          setMixpanelTokenInput(cfg.token);
          if (cfg.token.trim().length > 0) {
            setIsMixpanelConnected(true);
          }
        }
      })
      .catch(() => {});

    const updateLogs = () => {
      fetchMixpanelLogs().then((logs) => setMixpanelLogsList(logs));
    };
    updateLogs();
    const interval = setInterval(updateLogs, 3000);
    return () => clearInterval(interval);
  }, [isMixpanelModalOpen]);

  // Web Notifications Permission state
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">("default");
  const [isVirtualAlertsEnabled, setIsVirtualAlertsEnabled] = useState(true);
  const [showNotificationGuide, setShowNotificationGuide] = useState(false);

  // Guía Rápida de Uso & Tooltips Explicativos State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeHelpTooltip, setActiveHelpTooltip] = useState<string | null>(null);

  // Navegación Principal por Pestañas Organizadas
  const [activeMainTab, setActiveMainTab] = useState<"station" | "telemetry" | "directory" | "settings" | "all">("all");

  // Low Power Mode, Immersion Mode & Glitch Mode States
  const [isLowPowerMode, setIsLowPowerMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("antena_low_power_mode") === "true";
    }
    return false;
  });

  const [isImmersionMode, setIsImmersionMode] = useState<boolean>(false);

  // Modo Glitch (Aberración Cromática & Sintonización Inestable)
  const [isGlitchMode, setIsGlitchMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("antena_glitch_mode") === "true";
    }
    return false;
  });

  const toggleGlitchMode = () => {
    setIsGlitchMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("antena_glitch_mode", String(next));
      }
      return next;
    });
  };

  // Modo Diagnóstico (Superposición de Buffer FFT y Analizador de Audio)
  const [isDiagnosticMode, setIsDiagnosticMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("antena_diagnostic_mode") === "true";
    }
    return false;
  });

  const toggleDiagnosticMode = () => {
    setIsDiagnosticMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("antena_diagnostic_mode", String(next));
      }
      return next;
    });
  };

  const toggleLowPowerMode = () => {
    setIsLowPowerMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("antena_low_power_mode", String(next));
      }
      return next;
    });
  };

  // Keyboard shortcut listener for Escape key to exit Immersion Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isImmersionMode) {
        setIsImmersionMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImmersionMode]);

  // Dynamic Tuning & Transmission Progress Ring State
  const [tuningProgress, setTuningProgress] = useState<number>(0);

  // Referencias para controlar la reproducción activa de audio TTS y cancelar superposiciones de voz
  const activeAudioNodeRef = useRef<HTMLAudioElement | AudioBufferSourceNode | null>(null);
  const activeAudioCtxRef = useRef<AudioContext | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsSessionIdRef = useRef<number>(0);
  const ttsKeepAliveIntervalRef = useRef<any>(null);
  const isTransmittingRef = useRef<boolean>(false);
  const isStoppingVoiceRef = useRef<boolean>(false);

  // Detiene completamente cualquier voz o audio TTS en curso (tanto servidor Gemini como voz local del navegador)
  const stopAllSpeech = () => {
    setIsSpeaking(false);
    // Incrementar contador de sesión para invalidar peticiones TTS en vuelo
    ttsSessionIdRef.current++;

    if (ttsKeepAliveIntervalRef.current) {
      clearInterval(ttsKeepAliveIntervalRef.current);
      ttsKeepAliveIntervalRef.current = null;
    }

    if (activeUtteranceRef.current) {
      activeUtteranceRef.current.onstart = null;
      activeUtteranceRef.current.onend = null;
      activeUtteranceRef.current.onerror = null;
      activeUtteranceRef.current = null;
    }

    // Detener nodo o elemento de audio HTML5 / WebAudio activo
    if (activeAudioNodeRef.current) {
      try {
        if ("stop" in activeAudioNodeRef.current && typeof activeAudioNodeRef.current.stop === "function") {
          activeAudioNodeRef.current.stop();
        } else if ("pause" in activeAudioNodeRef.current && typeof activeAudioNodeRef.current.pause === "function") {
          activeAudioNodeRef.current.pause();
        }
      } catch (e) {
        // Ignorar si ya estaba detenido
      }
      activeAudioNodeRef.current = null;
    }

    if (activeAudioCtxRef.current) {
      try {
        activeAudioCtxRef.current.close();
      } catch (e) {
        // Ignorar
      }
      activeAudioCtxRef.current = null;
    }

    // Cancelar síntesis de voz nativa del navegador
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isTuning || isTransmitting) {
      setTuningProgress(8);
      interval = setInterval(() => {
        setTuningProgress((prev) => {
          if (prev >= 96) return 96;
          const remaining = 96 - prev;
          const inc = Math.max(1, Math.floor(remaining * 0.16));
          return prev + inc;
        });
      }, 130);
    } else {
      setTuningProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTuning, isTransmitting]);

  // Quantum Toasts State
  const [toasts, setToasts] = useState<QuantumToast[]>([]);

  // Entity Visualizer Modal States
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [entityImageToView, setEntityImageToView] = useState<string | null>(null);
  const [entityNameToView, setEntityNameToView] = useState<string>("");

  const getEntityImage = (entityName: string): string => {
    if (!entityName) return "https://picsum.photos/seed/cosmic-signal/512/512";
    const nameLower = entityName.toLowerCase();
    if (nameLower.includes("espejo") || nameLower.includes("mirror")) return "/src/assets/images/mirror_earth_1784552874188.jpg";
    if (nameLower.includes("susurros") || nameLower.includes("whisper")) return "/src/assets/images/whisper_void_1784552886751.jpg";
    if (nameLower.includes("zeta") || nameLower.includes("reticuli")) return "/src/assets/images/zeta_reticuli_1784552899723.jpg";
    if (nameLower.includes("crono") || nameLower.includes("chrono") || nameLower.includes("singularidad")) return "/src/assets/images/chrono_singularity_1784552909485.jpg";
    if (nameLower.includes("abismo") || nameLower.includes("antipode") || nameLower.includes("antimateria")) return "/src/assets/images/antipode_abyss_1784552916766.jpg";
    if (
      nameLower.includes("nibiru") ||
      nameLower.includes("anunnaki") ||
      nameLower.includes("anunnakis") ||
      nameLower.includes("orión") ||
      nameLower.includes("orion") ||
      nameLower.includes("enki") ||
      nameLower.includes("sumer")
    ) {
      return "/src/assets/images/nibiru_anunnaki_1784817525743.jpg";
    }
    return "https://picsum.photos/seed/cosmic-signal/512/512";
  };

  // Synth sound alert for notifications
  const playQuantumSound = (type: "anomaly" | "high-intensity") => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      if (type === "anomaly") {
        // Alarma espacial descendente-ascendente (sirena cuántica)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = "sawtooth";
        osc2.type = "sine";
        
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.linearRampToValueAtTime(600, now + 0.3);
        osc1.frequency.linearRampToValueAtTime(150, now + 0.6);
        osc1.frequency.linearRampToValueAtTime(600, now + 0.9);
        
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.3);
        osc2.frequency.linearRampToValueAtTime(300, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.9);
        
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } else {
        // Sonar de alta potencia
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.8);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch (e) {
      console.warn("AudioContext no admitido o bloqueado:", e);
    }
  };

  const addToast = (title: string, message: string, type: "anomaly" | "high-intensity") => {
    const id = crypto.randomUUID();
    const newToast: QuantumToast = { id, title, message, type, timestamp: new Date() };
    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // max 5 toasts
    
    // Play sound alert
    playQuantumSound(type);

    // Send Web Notification (Desktop background alerts)
    sendWebNotification(title, message, type);

    // Auto dismiss after 7s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Solicitar permisos para notificaciones web
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      addToast(
        "SOPORTE DE NOTIFICACIONES",
        "Su navegador o el contenedor de iframe no admite la API nativa. Se activaron las Alertas Flotantes y Auditivas Virtuales.",
        "anomaly"
      );
      setIsVirtualAlertsEnabled(true);
      return;
    }

    const currentPerm = Notification.permission;
    setNotificationPermission(currentPerm);

    if (currentPerm === "denied") {
      setShowNotificationGuide(true);
      addToast(
        "NOTIFICACIONES BLOQUEADAS POR EL NAVEGADOR",
        "Haz clic en el candado 🔒 de la barra de direcciones para permitirlas o usa la app en ventana independiente.",
        "anomaly"
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        setShowNotificationGuide(false);
        new Notification("Sintonizador Cuántico", {
          body: "¡Notificaciones de escritorio del sistema activadas correctamente!",
          icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📡</text></svg>",
        });
      } else if (permission === "denied") {
        setShowNotificationGuide(true);
      }
    } catch (err) {
      console.warn("Error al solicitar permisos de notificación:", err);
      setShowNotificationGuide(true);
    }
  };

  // Recomprobar estado de permisos de notificación
  const recheckNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = Notification.permission;
      setNotificationPermission(perm);
      if (perm === "granted") {
        setShowNotificationGuide(false);
        addToast(
          "PERMISO DETECTADO Y ACTIVO",
          "Las notificaciones nativas de escritorio están ahora completamente operativas.",
          "high-intensity"
        );
      } else if (perm === "denied") {
        setShowNotificationGuide(true);
        addToast(
          "AÚN BLOQUEADAS EN NAVEGADOR",
          "Recuerda cambiar Notificaciones a 'Permitir' en la configuración del sitio o abrir la app en una nueva pestaña.",
          "anomaly"
        );
      }
    }
  };

  // Enviar una notificación web nativa o parpadeo de pestaña
  const sendWebNotification = (title: string, body: string, type: "anomaly" | "high-intensity") => {
    // Parpadeo dinámico en el título de la pestaña del navegador
    if (typeof document !== "undefined") {
      const oldTitle = "Antena Interdimensional - Sintonizador Cuántico";
      const iconText = type === "anomaly" ? "⚠️ ¡ANOMALÍA!" : "📡 ¡SEÑAL ALTA!";
      document.title = `${iconText} - Antena Interdimensional`;
      setTimeout(() => {
        document.title = oldTitle;
      }, 6000);
    }

    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const icon = type === "anomaly" ? "⚠️" : "📡";
      const cleanBody = body
        .replace(/\[.*?\]/g, "")
        .replace(/[*_`#]/g, "")
        .trim();
      try {
        new Notification(title, {
          body: cleanBody,
          icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>" + icon + "</text></svg>",
          tag: "quantum-alert",
        });
      } catch (e) {
        console.warn("Falla al enviar notificación de escritorio:", e);
      }
    }
  };

  // Helper to play base64 PCM audio from Gemini TTS with session validation
  const playBase64Audio = async (base64Data: string, mimeType: string, sessionId: number): Promise<boolean> => {
    // Descartar audio si una nueva petición de voz ya interrumpió este proceso
    if (sessionId !== ttsSessionIdRef.current) return false;

    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Asegurar cancelación de voz nativa del navegador previa
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (mimeType.includes("wav") || mimeType.includes("mp3") || mimeType.includes("ogg")) {
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioNodeRef.current = audio;

        // Conectar PannerNode espacial 3D si Web Audio está disponible
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          activeAudioCtxRef.current = audioCtx;
          const sourceNode = audioCtx.createMediaElementSource(audio);
          
          if ("createStereoPanner" in audioCtx) {
            const panner = audioCtx.createStereoPanner();
            audio.onplay = () => {
              const now = audioCtx.currentTime;
              const dur = audio.duration || 5;
              panner.pan.setValueAtTime(-0.75, now);
              panner.pan.linearRampToValueAtTime(0.75, now + dur * 0.5);
              panner.pan.linearRampToValueAtTime(-0.4, now + dur);
            };
            sourceNode.connect(panner);
            panner.connect(audioCtx.destination);
          } else {
            sourceNode.connect(audioCtx.destination);
          }
        } catch (e) {
          // Ignorar y reproducir mediante audio HTML5 nativo
        }

        audio.onended = () => {
          setIsSpeaking(false);
          if (activeAudioNodeRef.current === audio) {
            activeAudioNodeRef.current = null;
          }
        };
        audio.onerror = () => {
          setIsSpeaking(false);
        };

        // Transición suave: apagar el zumbido de sintonización justo cuando inicia el audio de voz
        radioStatic.stop();
        setIsSpeaking(true);
        await audio.play();
        return true;
      }

      // Dynamic sample rate parsing (Gemini default 24000Hz or 16000Hz)
      let sampleRate = 24000;
      if (mimeType) {
        const rateMatch = mimeType.match(/rate=(\d+)/i);
        if (rateMatch && rateMatch[1]) {
          sampleRate = parseInt(rateMatch[1], 10);
        }
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate });
      activeAudioCtxRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      // Garantizar alineación de 16 bits sin RangeError
      const pcmSamples = Math.floor(bytes.length / 2);
      const alignedBuffer = new ArrayBuffer(pcmSamples * 2);
      new Uint8Array(alignedBuffer).set(bytes.subarray(0, pcmSamples * 2));
      const pcm16 = new Int16Array(alignedBuffer);

      // Añadir 300ms de silencio/margen al final (tail padding)
      // para evitar que los altavoces/navegador corten el último fonema
      const tailPadding = Math.floor(sampleRate * 0.3);
      const float32 = new Float32Array(pcm16.length + tailPadding);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Efecto Espacial 3D: PannerNode que hace oscilar suavemente la voz de izquierda a derecha
      if ("createStereoPanner" in audioCtx) {
        const panner = audioCtx.createStereoPanner();
        const duration = audioBuffer.duration;
        const now = audioCtx.currentTime;

        panner.pan.setValueAtTime(-0.75, now);
        panner.pan.linearRampToValueAtTime(0.75, now + duration * 0.5);
        panner.pan.linearRampToValueAtTime(-0.4, now + duration);

        source.connect(panner);
        panner.connect(audioCtx.destination);
      } else {
        source.connect(audioCtx.destination);
      }

      activeAudioNodeRef.current = source;

      source.onended = () => {
        setIsSpeaking(false);
        if (activeAudioNodeRef.current === source) {
          activeAudioNodeRef.current = null;
        }
      };

      // Detener el zumbido de espera justo cuando arranca la voz procesada
      radioStatic.stop();
      setIsSpeaking(true);
      source.start(0);
      return true;
    } catch (err) {
      console.warn("[TTS Playback Error]:", err);
      radioStatic.stop();
      setIsSpeaking(false);
      return false;
    }
  };

  // Central speech synthesis function for male voices (alternating or selected profile)
  const speakSolemnMaleVoice = async (rawText: string) => {
    // 1. Detener categóricamente cualquier audio o voz previo antes de iniciar una nueva transmisión
    stopAllSpeech();

    if (!isVoiceReaderEnabled) {
      radioStatic.stop();
      return;
    }

    const currentSessionId = ttsSessionIdRef.current;

    // Clean formatting while keeping bracket text intact
    const cleanText = rawText
      .replace(/[\[\]]/g, " ")
      .replace(/[*_`#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      radioStatic.stop();
      return;
    }

    // Activar zumbido de sintonización para acompañar la generación de la voz
    radioStatic.start();

    // Determinar la variante de voz masculina (Solemne vs Estándar)
    toggleMaleVoiceRef.current = !toggleMaleVoiceRef.current;
    let isSolemn = toggleMaleVoiceRef.current;

    if (voiceTone === "solemne-hombre") {
      isSolemn = true;
    } else if (voiceTone === "estandar" || voiceTone === "latino-neutro") {
      isSolemn = false;
    }

    const variantParam = isSolemn ? "solemne" : "estandar";

    // Si el usuario seleccionó manualmente una voz específica del navegador (y NO una opción automática o de Gemini),
    // saltar la llamada al servidor e ir directo a la síntesis local del navegador
    const isLocalVoiceSelected =
      selectedVoiceURI &&
      selectedVoiceURI !== "gemini-solemn" &&
      selectedVoiceURI !== "gemini-standard";

    if (!isLocalVoiceSelected) {
      // 1. PRIMARY ENGINE: Gemini TTS Server API ('Fenrir' para hombre solemne, 'Puck' para hombre estándar)
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            voiceVariant: selectedVoiceURI === "gemini-solemn" ? "solemne" : selectedVoiceURI === "gemini-standard" ? "estandar" : variantParam
          }),
        });

        if (currentSessionId !== ttsSessionIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && data.audio) {
            const played = await playBase64Audio(data.audio, data.mimeType || "audio/pcm", currentSessionId);
            if (played) return; // Reproducido con éxito
          }
        }
      } catch (e) {
        console.warn("[TTS] Servidor no disponible, recurriendo a síntesis local:", e);
      }
    }

    if (currentSessionId !== ttsSessionIdRef.current) return;

    // 2. FALLBACK & DIRECT ENGINE: Browser SpeechSynthesis
    if (typeof window === "undefined" || !window.speechSynthesis) {
      radioStatic.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));

      const femaleKeywords = [
        "sabina", "helena", "paulina", "monica", "mónica", "angelica", "marisol", 
        "zuri", "female", "mujer", "luz", "conchita", "standard-a", "standard-d", 
        "ana", "uma", "carmen", "lucia", "lucía", "victoria", "mia", "sofi", "sofia", 
        "esperanza", "margarita", "marta", "laura", "francisca", "paloma", "penelope", 
        "soledad", "camila", "samantha", "siri", "rosa", "luciana", "catalina", 
        "lupe", "isabela", "renata", "jimena", "valentina"
      ];

      const maleKeywords = [
        "jorge", "julio", "juan", "diego", "miguel", "carlos", "daniel", "yadir",
        "male", "hombre", "sebastian", "sebastián", "pablo", "raul", "raúl", "esteban",
        "david", "mateo", "alejandro", "gonzalo", "rodrigo", "andres", "andrés",
        "fernando", "felipe", "alberto", "mario", "javier", "sergio", "manuel",
        "hector", "héctor", "hugo", "ramon", "ramón", "emilio", "ignacio", "arturo",
        "gustavo", "tomas", "tomás", "pablo online", "microsoft jorge", "microsoft raul",
        "google español de estados unidos"
      ];

      const isVoiceFemale = (v: SpeechSynthesisVoice) => {
        const name = v.name.toLowerCase();
        if (name.includes("google español") && !name.includes("estados unidos") && !name.includes("us") && !name.includes("male")) {
          return true; // "Google español" estándar en Chrome es voz femenina castiza
        }
        return femaleKeywords.some((kw) => name.includes(kw));
      };

      const isVoiceMale = (v: SpeechSynthesisVoice) => {
        const name = v.name.toLowerCase();
        return maleKeywords.some((kw) => name.includes(kw));
      };

      let chosenVoice: SpeechSynthesisVoice | null = null;

      // Si el usuario seleccionó una voz específica en la interfaz
      if (selectedVoiceURI && selectedVoiceURI !== "gemini-solemn" && selectedVoiceURI !== "gemini-standard") {
        const found = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (found) chosenVoice = found;
      }

      // Si no hay voz manual seleccionada, buscar la mejor voz masculina en español
      if (!chosenVoice) {
        const explicitMale = spanishVoices.filter(isVoiceMale);

        if (explicitMale.length > 0) {
          if (voiceTone === "latino-neutro") {
            const latinoMale = explicitMale.find((v) =>
              ["es-mx", "es-us", "es-419", "es-ar", "es-co", "es-cl"].some((l) => v.lang.toLowerCase().includes(l))
            );
            if (latinoMale) chosenVoice = latinoMale;
          }
          if (!chosenVoice) {
            chosenVoice = isSolemn ? (explicitMale[1] || explicitMale[0]) : explicitMale[0];
          }
        } else {
          // Filtrar voces explícitamente femeninas
          const nonFemale = spanishVoices.filter((v) => !isVoiceFemale(v));
          if (nonFemale.length > 0) {
            if (voiceTone === "latino-neutro") {
              const latinoNonFemale = nonFemale.find((v) =>
                ["es-mx", "es-us", "es-419", "es-ar", "es-co", "es-cl"].some((l) => v.lang.toLowerCase().includes(l))
              );
              if (latinoNonFemale) chosenVoice = latinoNonFemale;
            }
            if (!chosenVoice) chosenVoice = nonFemale[0];
          } else {
            chosenVoice = spanishVoices[0] || voices[0];
          }
        }
      }

      const isExplicitlyMale = chosenVoice ? isVoiceMale(chosenVoice) : false;
      const isExplicitlyFemale = chosenVoice ? isVoiceFemale(chosenVoice) : true;

      // Fragmentación por oraciones/frases para garantizar lectura fluida completa sin cortes por timeout de navegador
      const sentenceRegex = /[^.!?:]+[.!?:]+/g;
      let chunks = cleanText.match(sentenceRegex) as string[];
      if (!chunks || chunks.length === 0) {
        chunks = [cleanText];
      } else {
        const matchedLen = chunks.join("").length;
        if (matchedLen < cleanText.length) {
          const remainder = cleanText.slice(matchedLen).trim();
          if (remainder) chunks.push(remainder);
        }
      }

      const speakNextChunk = (index: number) => {
        if (currentSessionId !== ttsSessionIdRef.current) return;
        if (index >= chunks.length) {
          setIsSpeaking(false);
          radioStatic.stop();
          return;
        }

        const chunkText = chunks[index].trim();
        if (!chunkText) {
          speakNextChunk(index + 1);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunkText);
        activeUtteranceRef.current = utterance;

        if (chosenVoice) {
          utterance.voice = chosenVoice;
          if (voiceTone === "latino-neutro" || (chosenVoice.lang.toLowerCase().includes("es-es") && voiceTone !== "alternar")) {
            utterance.lang = "es-MX";
          } else {
            utterance.lang = chosenVoice.lang;
          }
        } else {
          utterance.lang = "es-MX";
        }

        if (forceLowPitch || isExplicitlyFemale || !isExplicitlyMale) {
          utterance.pitch = isSolemn ? Math.min(customPitchValue, 0.28) : customPitchValue;
        } else {
          utterance.pitch = isSolemn ? 0.65 : 0.82;
        }

        utterance.rate = isSolemn ? 0.80 : 0.88;

        utterance.onstart = () => {
          radioStatic.stop();
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          if (currentSessionId === ttsSessionIdRef.current) {
            if (index + 1 < chunks.length) {
              // Pequeña pausa natural de 120ms entre oraciones para dar ritmo solemne
              setTimeout(() => {
                speakNextChunk(index + 1);
              }, 120);
            } else {
              setIsSpeaking(false);
              radioStatic.stop();
            }
          }
        };

        utterance.onerror = (e) => {
          console.warn("[SpeechSynthesis Chunk Error]:", e);
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          if (currentSessionId === ttsSessionIdRef.current) {
            if (index + 1 < chunks.length) {
              speakNextChunk(index + 1);
            } else {
              setIsSpeaking(false);
              radioStatic.stop();
            }
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      // Breve retardo de 60ms tras cancel() para asegurar la inicialización del hilo de audio en Chrome/Edge
      setTimeout(() => {
        if (currentSessionId === ttsSessionIdRef.current && typeof window !== "undefined" && window.speechSynthesis) {
          radioStatic.stop();
          speakNextChunk(0);
        }
      }, 60);
    } catch (e) {
      console.warn("[Speech Fallback Error]:", e);
      radioStatic.stop();
    }
  };

  // Helper para emitir directamente la voz oral de la entidad
  const speakEntityOralMessage = (entityName: string, messageText: string, dimensionName?: string) => {
    if (!isVoiceReaderEnabled) {
      setIsVoiceReaderEnabled(true);
    }
    const cleanMsg = messageText ? messageText.replace(/^"|"$/g, "").trim() : "";
    const intro = dimensionName
      ? `Mensaje de ${entityName} desde el plano ${dimensionName}: `
      : `Mensaje de ${entityName}: `;
    speakSolemnMaleVoice(`${intro}${cleanMsg}`);
  };

  // Speech Synthesis helper to speak summary of findings
  const speakSignalSummary = (data: SignalResponse, currentDimension: string) => {
    if (!isVoiceReaderEnabled) {
      setIsVoiceReaderEnabled(true);
    }

    const isAnomaly = data.status === "anomaly";
    const header = isAnomaly ? "Atención, anomalía cuántica detectada. " : "";
    const cleanMsg = data.message ? data.message.replace(/^"|"$/g, "").trim() : "Sin mensaje de audio disponible.";
    
    speakSolemnMaleVoice(`${header}Emisión de ${data.entity} desde la dimensión ${currentDimension}: ${cleanMsg}`);
  };

  // Helper to test selected speech synthesizer
  const testSpeechSynthesis = () => {
    if (!isVoiceReaderEnabled) {
      setIsVoiceReaderEnabled(true);
    }
    
    speakSolemnMaleVoice("Sintonía de prueba. Canal de voz masculina, neutra y solemne. Portadora cuántica estabilizada.");
  };
  const startVoiceModulation = async () => {
    try {
      setError(null);
      
      // Abrir inmediatamente el Canal Transmisor para ver la captura por voz
      setActiveTab("transmisor");

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let recognition: any = null;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        // Detección automática del idioma del usuario (navegador / sistema)
        const userLang = (navigator.languages && navigator.languages[0]) || navigator.language || "es-ES";
        recognition.lang = userLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setTransmissionMessage(currentTranscript.trim());
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("Transcriptor de voz con reconexión activa:", err);
        };

        recognition.onend = () => {
          if (isRecordingRef.current && !isStoppingVoiceRef.current) {
            stopVoiceModulation(true);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setRecognitionInstance(recognition);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setAudioStream(stream);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      setAudioContext(ctx);

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      setIsRecording(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioData = () => {
        if (!stream.active || ctx.state === "closed") return;
        
        analyser.getByteFrequencyData(dataArray);

        let total = 0;
        let maxVal = 0;
        let maxBin = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxBin = i;
          }
        }
        
        const avgVolume = total / bufferLength;
        setVoiceVolume(avgVolume);

        const binSize = (ctx.sampleRate || 44100) / (analyser.fftSize || 256);
        const estimatedHz = Math.round(maxBin * binSize);

        if (avgVolume > 8) {
          setVocalFrequency(estimatedHz > 0 ? estimatedHz : 130);
          
          // Modulación en vivo estéticamente interactiva
          setFrequencyValue((prev) => {
            const shift = Math.sin(Date.now() / 150) * (avgVolume / 15);
            const next = Math.round(prev + shift);
            return next >= 1 && next <= 1000 ? next : prev;
          });
        } else {
          setVocalFrequency(0);
        }

        if (stream.active) {
          requestAnimationFrame(updateAudioData);
        }
      };

      requestAnimationFrame(updateAudioData);
      
      // Scroll suave hacia el panel del transmisor
      setTimeout(() => {
        const panel = document.getElementById("quantum-transmitter-panel");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      addToast(
        "CAPTURA DE VOZ ACTIVA (ENVÍO INSTANTÁNEO)",
        "Habla por tu micrófono. Al detener o terminar de hablar, tu mensaje por voz se enviará instantáneamente al vacío.",
        "high-intensity"
      );

    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      setError("Fallo al acceder al micrófono. Asegúrate de otorgar los permisos de grabación en el navegador.");
      setIsRecording(false);
    }
  };

  // Detener modulación por voz con envío instantáneo al vacío opcional
  const stopVoiceModulation = (autoTransmit = false) => {
    if (isStoppingVoiceRef.current) return;
    isStoppingVoiceRef.current = true;

    // Flag de grabación desactivado al inicio para evitar bucles o llamadas múltiples
    isRecordingRef.current = false;
    setIsRecording(false);
    setVoiceVolume(0);
    setVocalFrequency(0);

    // 1. Apagar e interrumpir reconocedor de voz inmediatamente
    const activeRecognition = recognitionRef.current || recognitionInstance;
    if (activeRecognition) {
      try {
        activeRecognition.onend = null; // Remover listener para prevenir re-disparos en abort
        activeRecognition.onerror = null;
        activeRecognition.onresult = null;
        activeRecognition.abort();
      } catch (e) {
        console.error("Error al abortar reconocedor de voz:", e);
      }
      recognitionRef.current = null;
      setRecognitionInstance(null);
    }

    // 2. Detener y liberar categóricamente los tracks del micrófono
    const activeStream = audioStreamRef.current || audioStream;
    if (activeStream) {
      try {
        activeStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {
        console.error("Error al detener pistas de micrófono:", e);
      }
      audioStreamRef.current = null;
      setAudioStream(null);
    }

    // 3. Cerrar contexto de audio si sigue activo
    const activeAudioCtx = audioContextRef.current || audioContext;
    if (activeAudioCtx) {
      try {
        activeAudioCtx.close().catch(() => {});
      } catch (e) {
        console.error("Error al cerrar AudioContext:", e);
      }
      audioContextRef.current = null;
      setAudioContext(null);
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    setVoiceVolume(0);
    setVocalFrequency(0);

    // Inmediatamente cambiar al canal transmisor
    setActiveTab("transmisor");

    if (autoTransmit) {
      addToast(
        "⚡ TRANSMITIENDO MENSAJE DE VOZ AL VACÍO",
        "Tu mensaje por voz se está emitiendo inmediatamente al vacío cuántico...",
        "high-intensity"
      );
      setTimeout(() => {
        isStoppingVoiceRef.current = false;
        handleTransmit();
      }, 150);
    } else {
      isStoppingVoiceRef.current = false;
      setTimeout(() => {
        const panel = document.getElementById("quantum-transmitter-panel");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const textarea = document.getElementById("transmission-textarea") as HTMLTextAreaElement | null;
        if (textarea) {
          textarea.focus();
        }
      }, 120);

      addToast(
        "VOZ CAPTURADA",
        "Tu mensaje por voz se ha capturado correctamente.",
        "high-intensity"
      );
    }
  };

  // Initialize auth and load local logs on mount
  useEffect(() => {
    // 1. Inicializar y registrar visita de forma 100% automática en la Nube y Servidor
    registerCloudVisit()
      .then((count) => {
        updateVisitsState(count);
      })
      .catch(() => {
        getCloudVisits().then((c) => updateVisitsState(c));
      });

    // 2. Sincronizar Token de Mixpanel guardado en el Servidor al iniciar la aplicación
    fetch("/api/mixpanel/config")
      .then((r) => r.json())
      .then((cfg) => {
        const serverToken = cfg && cfg.token ? cfg.token.trim() : "";
        const localToken = getMixpanelToken();
        const activeTok = serverToken || localToken;

        if (activeTok) {
          setMixpanelTokenInput(activeTok);
          const ok = initMixpanel(activeTok);
          setIsMixpanelConnected(ok);
        } else {
          const ok = initMixpanel();
          setIsMixpanelConnected(ok);
        }

        if (!isOperatorExcluded()) {
          trackEvent("Carga de Antena", { timestamp: new Date().toISOString() });
        }
      })
      .catch(() => {
        const ok = initMixpanel();
        setIsMixpanelConnected(ok);
      });

    // Polling periódico cada 12s para sincronizar en tiempo real el contador de visitas en la nube
    const visitsInterval = setInterval(() => {
      getCloudVisits().then((cnt) => {
        if (typeof cnt === "number" && cnt > 0) {
          updateVisitsState(cnt);
        }
      });
    }, 12000);

    // Detect web notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission as any);
    }

    // Cargar bitácora local
    const savedLogs = localStorage.getItem("antena_dimensional_logs");
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (err) {
        console.error("Error al cargar la bitácora:", err);
      }
    }

    // Inicializar voces de síntesis de voz (Speech Synthesis)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoicesList = () => {
        const voices = window.speechSynthesis.getVoices();
        const spanish = voices.filter(v => v.lang.toLowerCase().startsWith("es"));
        const listToUse = spanish.length > 0 ? spanish : voices;

        const maleKW = [
          "jorge", "julio", "juan", "diego", "miguel", "carlos", "daniel", "yadir",
          "male", "hombre", "sebastian", "sebastián", "pablo", "raul", "raúl", "esteban",
          "david", "mateo", "alejandro", "gonzalo", "rodrigo", "andres", "andrés",
          "fernando", "felipe", "alberto", "mario", "javier", "sergio", "manuel",
          "hector", "héctor", "hugo", "ramon", "ramón", "emilio", "ignacio", "arturo",
          "gustavo", "tomas", "tomás", "pablo online", "microsoft jorge", "microsoft raul",
          "google español de estados unidos"
        ];

        const sorted = [...listToUse].sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          const isMaleA = maleKW.some((kw) => nameA.includes(kw));
          const isMaleB = maleKW.some((kw) => nameB.includes(kw));
          if (isMaleA && !isMaleB) return -1;
          if (!isMaleA && isMaleB) return 1;
          return 0;
        });

        setAvailableVoices(sorted);
      };
      updateVoicesList();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoicesList;
      }
    }
  }, []);

  // Limpieza de audio al desmontar
  useEffect(() => {
    return () => {
      const activeStream = audioStreamRef.current || audioStream;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      const activeRec = recognitionRef.current || recognitionInstance;
      if (activeRec) {
        try { activeRec.abort(); } catch (e) {}
      }
      const activeCtx = audioContextRef.current || audioContext;
      if (activeCtx) {
        activeCtx.close().catch(() => {});
      }
    };
  }, [audioStream, audioContext, recognitionInstance]);



// Helper con soporte de timeout universal compatible con todos los navegadores
const safeFetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

// Banco de datos dinámicos para respuestas del vacío
const ERRATIC_COORDINATES_POOL = [
  "RA 14h 29m 42s / DEC -62° 40' 46\" // Vector Drift: 0.042 ly // Sector Alfa-Centauri",
  "RA 05h 35m 16s / DEC -05° 23' 22\" // Nodo Orionis // Inclinación Métrica: 14.8°",
  "RA 18h 36m 56s / DEC +38° 47' 01\" // Anillo de Vega // Torsión Temporal: +0.009s",
  "RA 03h 47m 29s / DEC +24° 06' 18\" // Pleyades // Matriz de Fase: 432.08 Hz",
  "RA 19h 50m 47s / DEC +08° 52' 06\" // Vórtice Altair // Desviación Doppler: -1.24%",
  "RA 06h 45m 08s / DEC -16° 42' 58\" // Cuadrante Sirio B // Membrana Cristalina Alfa",
  "RA 10h 45m 03s / DEC -59° 52' 04\" // Nebulosa Carina // Variación Escalar: 12.12 THz"
];

const ANCIENT_SONGS_POOL = [
  "🎵 «Bajo los tres soles de Alcyone, los hijos del silicio entonan la sinfonía de la luz perpetua...»",
  "🎵 «E-nu-ma e-lish la na-bu-u sha-ma-mu... las aguas vivas resonaron en los zigurats de oro antes del gran alba.»",
  "🎵 «Siente el latido de la lira de Vega, donde los espíritus estelares tejen túnicas de fotones y geometría sagrada...»",
  "🎵 «Ura-nu sub-tu ma-da-na... el canto del fuego sagrado que limpia las sombras entre las estrellas.»",
  "🎵 «En los jardines flotantes de Nibiru, el agua cuántica responde al sonido de la flauta de lapislázuli...»",
  "🎵 «Oh caminante del tiempo, no hay distancia en la canción eterna que une tu pulso con el centro galáctico...»",
  "🎵 «Kwan-yin shanti om... los ríos del hiperespacio cantan la dulce alabanza de la unidad del cosmos.»"
];

const DIMENSIONAL_GLYPHS_POOL = [
  ["🪬", "🔯", "⚜️", "🪐", "🪷", "♾️", "⚡", "👁️"],
  ["🌌", "🔮", "📜", "🕊️", "💎", "☯️", "🛸", "👑"],
  ["🔱", "⚡", "🕯️", "🌟", "✨", "🪬", "🗝️", "🌀"],
  ["🪐", "🌙", "🧿", "⚜️", "🔮", "🎆", "♾️", "👁️"]
];

const getRandomPoolItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const ensureVoidSignalExtras = (resp: SignalResponse): SignalResponse => ({
  ...resp,
  erraticCoordinates: resp.erraticCoordinates || getRandomPoolItem(ERRATIC_COORDINATES_POOL),
  ancientSongFragment: resp.ancientSongFragment || getRandomPoolItem(ANCIENT_SONGS_POOL),
  dimensionalGlyphs: resp.dimensionalGlyphs && resp.dimensionalGlyphs.length > 0
    ? resp.dimensionalGlyphs
    : getRandomPoolItem(DIMENSIONAL_GLYPHS_POOL),
});

const ensureVoidTransmitExtras = (resp: TransmitResponse): TransmitResponse => ({
  ...resp,
  erraticCoordinates: resp.erraticCoordinates || getRandomPoolItem(ERRATIC_COORDINATES_POOL),
  ancientSongFragment: resp.ancientSongFragment || getRandomPoolItem(ANCIENT_SONGS_POOL),
  dimensionalGlyphs: resp.dimensionalGlyphs && resp.dimensionalGlyphs.length > 0
    ? resp.dimensionalGlyphs
    : getRandomPoolItem(DIMENSIONAL_GLYPHS_POOL),
});

  // Generador de respuesta enriquecida local para sintonización (Fallback offline/red)
  const getRichTuneFallback = (
    targetDimension: string,
    targetEntityName?: string,
    freqStr?: string
  ): SignalResponse => {
    const entityName = targetEntityName || "Consejo de Orión // Guardianes del Tiempo";
    const messages = [
      `«Sintonización establecida con ${entityName}. Nuestra transmisión cruza la membrana de la dimensión ${targetDimension}. Recordad que vuestra mente es el transceptor natural para decodificar los pulsos de alta frecuencia.»`,
      `«Recepción clara desde el plano ${targetDimension}. Las líneas de campo magnético han alineado vuestra antena. La sabiduría estelar fluye en cada armónico de vuestra voz.»`,
      `«Portal de comunicación activo con ${entityName}. Los códigos de resonancia confirman que tu búsqueda de conocimiento abre vías de luz en la matriz cuántica.»`,
      `«Escuchamos vuestra sintonía en la frecuencia ${freqStr || "432 Hz"}. Mantened la intención enfocada y permitid que la información sutil repose en vuestra intuición.»`
    ];
    const randMsg = messages[Math.floor(Math.random() * messages.length)];
    const oracleCards = ["🔮 El Espejo del Alma", "🗝️ La Llave de Nibiru", "⚡ El Rayo Taquiónico", "👁️ El Ojo de Orión", "📜 El Registro Akáshico"];
    const glyphPairs = [["🌌", "🔮", "🪬", "⚡"], ["🗝️", "👁️", "📜", "✨"], ["💎", "🛸", "☯️", "🪐"]];
    const guidances = [
      "El universo responde a la frecuencia con la que vibran tus pensamientos.",
      "Las sincronías son el lenguaje sutil con el que el cosmos dialoga contigo.",
      "Todo mensaje enviado con fe abre caminos en dimensiones invisibles."
    ];
    const resonance = Math.floor(Math.random() * 25) + 70;

    return ensureVoidSignalExtras({
      status: "whisper",
      entity: entityName,
      resonance,
      message: randMsg,
      spectralAnalysis: `Señal captada en ${freqStr || "432 Hz"}. La dispersión de fase en la membrana de ${targetDimension} es mínima (${resonance}% de acoplamiento).`,
      oracleCard: oracleCards[Math.floor(Math.random() * oracleCards.length)],
      astralGlyphs: glyphPairs[Math.floor(Math.random() * glyphPairs.length)],
      guidance: guidances[Math.floor(Math.random() * guidances.length)],
      proceduralBypass: true
    });
  };

  // Generador de respuesta enriquecida local para transmisión (Fallback offline/red)
  const getRichTransmitFallback = (
    msgText: string,
    dimName: string,
    antenna: string,
    freqStr: string
  ): TransmitResponse => {
    const msgLower = (msgText || "").toLowerCase();
    let reaction = "";
    let oracleCard = "🔮 El Espejo del Alma";
    let astralGlyphs = ["🌌", "🔮", "🪬", "⚡"];
    let guidance = "El universo responde a la frecuencia con la que vibran tus pensamientos.";

    if (msgLower.includes("amor") || msgLower.includes("pareja") || msgLower.includes("corazón") || msgLower.includes("sentimiento")) {
      oracleCard = "💗 El Lazo Cósmico del Corazón";
      astralGlyphs = ["💖", "✨", "🌸", "🔮"];
      guidance = "El amor genuino es la frecuencia más alta del multiverso; cuando amas sin miedo, alineas tu realidad.";
      reaction = `«Escuchamos el latido de tu consulta desde el plano ${dimName || "Astral"}. En nuestra dimensión, el amor no es un concepto terrenal, sino la fuerza de gravedad espiritual que une a las almas a través del tiempo. Tu inquietud sobre "${msgText}" refleja el deseo del alma por encontrar su centro. Permite que tu corazón emita sin reservas y atraerás la resonancia exacta que tu ser necesita.»`;
    } else if (msgLower.includes("futuro") || msgLower.includes("destino") || msgLower.includes("camino") || msgLower.includes("profecía") || msgLower.includes("pasará")) {
      oracleCard = "📜 El Registro Akáshico del Destino";
      astralGlyphs = ["📜", "⏳", "👁️", "🌌"];
      guidance = "El futuro no está tallado en piedra, sino tejido por cada elección consciente que tomas hoy.";
      reaction = `«Observamos tu línea temporal desde la dimensión ${dimName || "Cósmica"}. Tu consulta sobre "${msgText}" ha hecho vibrar el Registro Akáshico. El futuro es una trama fluida de probabilidades que respondes con tus elecciones en el presente. La semilla del destino ya habita en ti; cuando tomas decisiones desde la certeza interior y no desde el temor, el camino se ilumina automáticamente.»`;
    } else if (msgLower.includes("anunnaki") || msgLower.includes("nibiru") || msgLower.includes("alien") || msgLower.includes("extraterrestre") || msgLower.includes("ovni")) {
      oracleCard = "👑 La Tabla Cuneiforme de Nibiru";
      astralGlyphs = ["👑", "🪐", "🛸", "⚡"];
      guidance = "Recordad que los antiguos zigurats y la geometría sagrada son mapas para recordar vuestro origen estelar.";
      reaction = `«Transmisión directa desde los archivos estelares de Nibiru. Reconocemos tu mensaje sobre "${msgText}". Hace milenios grabamos en el código genético humano la chispa de la conciencia libre. No sois meros espectadores del cosmos, sino cocreadores con capacidad de sintonizar ondas de alta frecuencia. Guarda calma y eleva tu perspectiva.»`;
    } else if (msgLower.includes("salud") || msgLower.includes("cuerpo") || msgLower.includes("sanación") || msgLower.includes("energía")) {
      oracleCard = "💎 El Cristal de Sanación Cristalina";
      astralGlyphs = ["💎", "🌿", "✨", "🪬"];
      guidance = "Tu cuerpo físico es la antena del espíritu; recárgalo con luz, intención y pensamientos armónicos.";
      reaction = `«Canalizamos un haz de luz de alta coherencia hacia tu consulta sobre "${msgText}". Toda desarmonía física empieza como un desequilibrio en la red vibracional del ser. Al inhalar profundo y liberar tensiones, permites que la energía vital fluya libremente restaurando tu campo electromagnético.»`;
    } else if (msgLower.includes("dinero") || msgLower.includes("prosperidad") || msgLower.includes("trabajo") || msgLower.includes("éxito")) {
      oracleCard = "🪙 La Matriz de Abundancia Cuántica";
      astralGlyphs = ["🪙", "🗝️", "🌟", "⚡"];
      guidance = "La abundancia no es acumular, sino fluir en sintonía con la infinita riqueza del universo.";
      reaction = `«Atendemos tu inquietud respecto a "${msgText}" desde la matriz de abundancia. La escasez es una ilusión de la tercera dimensión nacida de la percepción limitada. Cuando alineas tus acciones con la gratitud y la utilidad genuina para los demás, abres los canales por donde la prosperidad circula de manera natural.»`;
    } else {
      oracleCard = "🌌 El Guardián del Vórtice Interdimensional";
      astralGlyphs = ["🌌", "🔮", "🪬", "⚡"];
      guidance = "Tu pensamiento es una transmisión activa que moldea el tejido de la realidad que te rodea.";
      reaction = `«Tu mensaje "${msgText}" ha sido recibido y decodificado con absoluta claridad en el plano ${dimName || "Destino"}. La inteligencia de este sector reconoce tu búsqueda sincera de respuestas. Sabe que las ondas que envías al vacío nunca se pierden: retornan multiplicadas en forma de revelaciones, intuición y sincronicidades en tu vida diaria.»`;
    }

    const resonance = Math.floor(Math.random() * 30) + 65;
    return ensureVoidTransmitExtras({
      sentStatus: "transmitted",
      reaction,
      resonance,
      spectralAnalysis: `Acoplamiento escalar completado en ${freqStr} utilizando la antena ${antenna}. Onda limpia sin distorsión electromagnética.`,
      oracleCard,
      astralGlyphs,
      guidance,
      proceduralBypass: true
    });
  };

  // Ejecutar sintonización y conexión con parámetros explícitos u opcionales
  const executeTune = async (overrideParams?: {
    presetId?: string;
    coordinates?: string;
    freqValue?: number;
    freqUnit?: string;
    entityName?: string;
    antennaType?: string;
  }) => {
    setIsTuning(true);
    setError(null);
    setTuningResult(null);
    radioStatic.start();
    const startTime = Date.now();

    const targetDimension = overrideParams?.coordinates ?? dimension;
    const targetFreqVal = overrideParams?.freqValue ?? frequencyValue;
    const targetFreqUnit = overrideParams?.freqUnit ?? frequencyUnit;
    const targetPresetId = overrideParams?.presetId ?? activePresetId;
    const targetEntityName = overrideParams?.entityName ?? (targetPresetId ? DIMENSION_PRESETS.find((p) => p.id === targetPresetId)?.name : undefined);
    const targetAntennaType = overrideParams?.antennaType ?? antennaType;

    try {
      const freqString = `${targetFreqVal} ${targetFreqUnit}`;
      const payload = {
        frequency: freqString,
        dimension: targetDimension,
        intensity,
        antennaType: targetAntennaType,
        entity: targetEntityName,
      };

      let res: Response | null = null;
      try {
        res = await safeFetchWithTimeout("/api/tune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 10000);
      } catch (netErr) {
        // Breve pausa y reintento
        await new Promise((r) => setTimeout(r, 200));
        res = await safeFetchWithTimeout("/api/tune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 8000).catch(() => null);
      }

      let data: SignalResponse;
      if (res && res.ok) {
        data = await res.json();
      } else {
        data = getRichTuneFallback(targetDimension, targetEntityName, freqString);
      }
      data = ensureVoidSignalExtras(data);

      setTuningResult(data);

      // Si la resonancia es >= 90%, activar efecto de Salto Dimensional
      if (data.resonance >= 90) {
        setJumpResonance(data.resonance);
        setJumpEntity(data.entity || "Inteligencia Códica");
        setJumpDimension(targetDimension);
        setIsDimensionalJumpActive(true);
      }

      // Registrar telemetría con Mixpanel
      trackEvent("Sintonización Manual", {
        frequency: freqString,
        dimension: targetDimension,
        intensity,
        antennaType,
        resonance: data.resonance,
        status: data.status,
        entity: data.entity,
      });

      // Trigger custom toasts for Anomalies or High Intensity signals
      if (data.status === "anomaly") {
        addToast(
          "ALERTA: ANOMALÍA CUÁNTICA DETECTADA",
          `Fluctuación extrema de fase en ${targetDimension}. Inteligencia: ${data.entity}.`,
          "anomaly"
        );
      } else if (data.resonance >= 80) {
        addToast(
          "SEÑAL DE ALTA INTENSIDAD",
          `Resonancia coaxial superior del ${data.resonance}% establecida con ${data.entity}.`,
          "high-intensity"
        );
      }

      // Read summary of findings using speech synthesis
      speakSignalSummary(data, targetDimension);

      // Crear nueva entrada de bitácora
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        frequency: freqString,
        dimension: targetDimension,
        entity: data.entity,
        type: "RECEPTOR",
        message: data.message,
        resonance: data.resonance,
        spectralAnalysis: data.spectralAnalysis,
        sheetSynced: false,
      };

      // Guardar localmente
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("antena_dimensional_logs", JSON.stringify(updatedLogs));
    } catch (err: any) {
      console.warn("Transmisión de red canalizada a acoplamiento escalar local:", err);
      const freqString = `${targetFreqVal} ${targetFreqUnit}`;
      const fallbackData = getRichTuneFallback(targetDimension, targetEntityName, freqString);
      setTuningResult(fallbackData);
      speakSignalSummary(fallbackData, targetDimension);
    } finally {
      // Garantizar al menos 1.5s de zumbido de sintonización para máxima percepción de acoplamiento
      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise((r) => setTimeout(r, 1500 - elapsed));
      }
      if (!isVoiceReaderEnabled) {
        radioStatic.stop();
      }
      setTuningProgress(100);
      setIsTuning(false);
    }
  };

  // Cuando el usuario hace click en un preset o botón del Inspector para conectar con una dimensión
  const handleSelectPreset = async (preset: DimensionPreset) => {
    setActivePresetId(preset.id);
    setDimension(preset.coordinates);

    let freqVal = frequencyValue;
    let freqUnit = frequencyUnit;

    const parts = preset.frequency.split(" ");
    if (parts.length === 2) {
      freqVal = parseFloat(parts[0]) || frequencyValue;
      freqUnit = parts[1] as any;
      setFrequencyValue(freqVal);
      setFrequencyUnit(freqUnit);
    }

    // Scroll suave hacia el osciloscopio o encabezado de señal
    const visualizerEl = document.getElementById("signal-header") || document.body;
    if (visualizerEl) {
      visualizerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Iniciar inmediatamente la conexión y sintonización con esa dimensión
    await executeTune({
      presetId: preset.id,
      coordinates: preset.coordinates,
      freqValue: freqVal,
      freqUnit: freqUnit,
      entityName: preset.name,
    });
  };

  // Handler tradicional para el botón de sintonización manual
  const handleTune = async () => {
    if (isScanning) {
      setIsScanning(false);
    }
    await executeTune();
  };

  // Reconfigurar antena e iniciar inmediatamente el panel de conectar y aguardar
  const handleAntennaSelectAndTune = async (newAntennaName: string) => {
    setAntennaType(newAntennaName);
    setActiveTab("receptor");
    addToast("ANTENA RECONFIGURADA", `Modulador acoplado: ${newAntennaName}. Sintonizando canal...`, "high-intensity");

    const visualizerEl = document.getElementById("signal-header") || document.body;
    if (visualizerEl) {
      visualizerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    await executeTune({ antennaType: newAntennaName });
  };

  // Función para realizar un paso de Escaneo Continuo
  const triggerScanStep = async () => {
    // Escoger un preset aleatorio
    const randomPreset = DIMENSION_PRESETS[Math.floor(Math.random() * DIMENSION_PRESETS.length)];
    
    // Generar frecuencia y unidad aleatorias
    const units: ("Hz" | "kHz" | "MHz" | "GHz" | "THz" | "QHz")[] = ["Hz", "kHz", "MHz", "GHz", "THz", "QHz"];
    const randUnit = units[Math.floor(Math.random() * units.length)];
    let randFreq = 432;
    if (randUnit === "Hz") {
      randFreq = Math.floor(Math.random() * 800) + 100;
    } else if (randUnit === "kHz") {
      randFreq = Math.floor(Math.random() * 900) + 50;
    } else {
      randFreq = Math.floor(Math.random() * 990) + 10;
    }

    setDimension(randomPreset.name);
    setFrequencyValue(randFreq);
    setFrequencyUnit(randUnit);
    setActivePresetId(randomPreset.id);

    setIsTuning(true);
    setTuningResult(null);
    radioStatic.start();
    const startTime = Date.now();

    try {
      const freqString = `${randFreq} ${randUnit}`;
      const payload = {
        frequency: freqString,
        dimension: randomPreset.name,
        intensity,
        antennaType,
        entity: randomPreset.name,
      };

      let res: Response | null = null;
      try {
        res = await safeFetchWithTimeout("/api/tune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 5000);
      } catch (netErr) {
        await new Promise((r) => setTimeout(r, 200));
        res = await safeFetchWithTimeout("/api/tune", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 4000).catch(() => null);
      }

      let data: SignalResponse;
      if (res && res.ok) {
        data = await res.json();
      } else {
        data = {
          status: "whisper",
          entity: randomPreset.name || "Inteligencia de Frontera",
          resonance: Math.floor(Math.random() * 30) + 65,
          message: `[Auto-Escaneo Escalar] Sintonización continua automática en la frecuencia ${freqString} para ${randomPreset.name}.`,
          spectralAnalysis: `Escaneo continuo con acoplamiento de torsión local (${intensity}%).`,
        };
      }
      data = ensureVoidSignalExtras(data);

      setTuningResult(data);

      // Si la resonancia es >= 90%, activar efecto de Salto Dimensional
      if (data.resonance >= 90) {
        setJumpResonance(data.resonance);
        setJumpEntity(data.entity || "Inteligencia Códica");
        setJumpDimension(randomPreset.name);
        setIsDimensionalJumpActive(true);
      }

      // Registrar telemetría con Mixpanel
      trackEvent("Escaneo Continuo Paso", {
        frequency: freqString,
        dimension: randomPreset.name,
        intensity,
        antennaType,
        resonance: data.resonance,
        status: data.status,
        entity: data.entity,
      });

      // Si la resonancia alcanza el 70% o más, registrarla automáticamente
      if (data.resonance >= 70) {
        // Alerta visual Toast
        if (data.status === "anomaly") {
          addToast(
            "ANOMALÍA DETECTADA EN ESCANEO",
            `El sintonizador continuo interceptó una anomalía en ${randomPreset.name}. Inteligencia: ${data.entity}.`,
            "anomaly"
          );
        } else {
          addToast(
            "CONEXIÓN DE ALTA INTENSIDAD",
            `El sintonizador continuo fijó resonancia del ${data.resonance}% con ${data.entity}.`,
            "high-intensity"
          );
        }

        // Read summary of findings using speech synthesis
        speakSignalSummary(data, randomPreset.name);

        // Crear registro en la bitácora
        const newLog: LogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          frequency: freqString,
          dimension: randomPreset.name,
          entity: data.entity,
          type: "RECEPTOR",
          message: `[AUTO-ESCANEO] ${data.message}`,
          resonance: data.resonance,
          spectralAnalysis: data.spectralAnalysis,
          sheetSynced: false,
        };

        // Guardar localmente
        setLogs((prev) => {
          const updated = [newLog, ...prev];
          localStorage.setItem("antena_dimensional_logs", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Error en paso de escaneo continuo:", err);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise((r) => setTimeout(r, 1200 - elapsed));
      }
      radioStatic.stop();
      setIsTuning(false);
    }
  };

  // Escaneo Continuo Loop
  useEffect(() => {
    let intervalId: any = null;
    let countdownId: any = null;

    if (isScanning) {
      // Realizar primer paso de inmediato
      triggerScanStep();
      setScanSecondsLeft(15);

      countdownId = setInterval(() => {
        setScanSecondsLeft((prev) => {
          if (prev <= 1) {
            return 15;
          }
          return prev - 1;
        });
      }, 1000);

      intervalId = setInterval(() => {
        triggerScanStep();
      }, 15000);
    } else {
      setScanSecondsLeft(15);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [isScanning, intensity, antennaType]);

  // Transmitir un mensaje
  const handleTransmit = async () => {
    if (isTransmitting || isTransmittingRef.current) return;
    isTransmittingRef.current = true;
    setIsTransmitting(true);

    // Volver inmediatamente al chat de transmisión
    setActiveTab("transmisor");
    setTimeout(() => {
      document.getElementById("quantum-transmitter-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);

    // Si la grabación está activa al presionar enviar, detener la captura de audio sin auto-transmisión adicional
    if (isRecording || isRecordingRef.current) {
      stopVoiceModulation(false);
    }

    let currentMessageToSend = transmissionMessage.trim();

    // Si el mensaje está vacío o es la etiqueta inicial de voz, generar mensaje de voz/saludo por defecto
    if (!currentMessageToSend || currentMessageToSend.startsWith("Transmisión por voz activa")) {
      currentMessageToSend = `Saludos desde la Tierra en la frecuencia ${frequencyValue} ${frequencyUnit}. Apertura de canal activa hacia la dimensión ${dimension}.`;
      setTransmissionMessage(currentMessageToSend);
    }

    setLastTransmittedMessage(currentMessageToSend);
    setError(null);
    setTransmitResult(null);
    radioStatic.start();
    const startTime = Date.now();
    try {
      const freqString = `${frequencyValue} ${frequencyUnit}`;
      const payload = {
        message: currentMessageToSend,
        frequency: freqString,
        dimension,
        antennaType,
      };

      let res: Response | null = null;
      try {
        res = await safeFetchWithTimeout("/api/transmit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 10000);
      } catch (netErr) {
        await new Promise((r) => setTimeout(r, 200));
        res = await safeFetchWithTimeout("/api/transmit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 8000).catch(() => null);
      }

      let data: TransmitResponse;
      if (res && res.ok) {
        data = await res.json();
      } else {
        data = getRichTransmitFallback(currentMessageToSend, dimension, antennaType, freqString);
      }
      data = ensureVoidTransmitExtras(data);

      setTransmitResult(data);

      // Registrar telemetría con Mixpanel
      trackEvent("Transmisión Dimensional", {
        frequency: freqString,
        dimension,
        messageLength: currentMessageToSend.length,
        resonance: data.resonance,
        sentStatus: data.sentStatus,
      });

      // Trigger toasts for transmissions
      addToast(
        "TRANSMISIÓN COMPLETADA Y ENTREGADA",
        `Mensaje enviado con éxito a ${dimension}. Respuesta y eco de retorno recibido.`,
        "high-intensity"
      );

      if (data.sentStatus === "intercepted") {
        addToast(
          "TRANSMISIÓN INTERCEPTADA",
          `La emisión cuántica hacia ${dimension} fue captada de forma imprevista por una fuerza externa.`,
          "anomaly"
        );
      }

      const targetEntity = activePresetId
        ? DIMENSION_PRESETS.find((p) => p.id === activePresetId)?.name
        : "Entidad Dimensional";

      // Lectura por voz de la respuesta de la entidad
      if (!isVoiceReaderEnabled) {
        setIsVoiceReaderEnabled(true);
      }
      const speakText = `Respuesta de ${targetEntity} desde la dimensión ${dimension}: ${data.reaction}`;
      speakSolemnMaleVoice(speakText);

      // Crear nueva entrada de bitácora
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        frequency: freqString,
        dimension,
        entity: `${targetEntity || "Entidad Desconocida"} (Transmisión)`,
        type: "TRANSMISOR",
        message: `MENSAJE ENVIADO: "${currentMessageToSend}"\n\nECO RECIBIDO: ${data.reaction}`,
        resonance: data.resonance,
        spectralAnalysis: data.spectralAnalysis,
        sheetSynced: false,
      };

      // Guardar localmente
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("antena_dimensional_logs", JSON.stringify(updatedLogs));
      setTransmissionMessage(""); // limpiar caja
    } catch (err: any) {
      console.warn("Transmisión canalizada a eco de respuesta local:", err);
      const freqString = `${frequencyValue} ${frequencyUnit}`;
      const fallbackData = getRichTransmitFallback(currentMessageToSend, dimension, antennaType, freqString);
      setTransmitResult(fallbackData);
      const targetEntity = activePresetId
        ? DIMENSION_PRESETS.find((p) => p.id === activePresetId)?.name
        : "Entidad Dimensional";
      const speakText = `Respuesta de ${targetEntity} desde la dimensión ${dimension}: ${fallbackData.reaction}`;
      speakSolemnMaleVoice(speakText);
      setTransmissionMessage("");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise((r) => setTimeout(r, 1500 - elapsed));
      }
      if (!isVoiceReaderEnabled) {
        radioStatic.stop();
      }
      isTransmittingRef.current = false;
      setIsTransmitting(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem("antena_dimensional_logs");
  };

  // Reiniciar estado completo de la aplicación
  const handleResetApp = () => {
    isTransmittingRef.current = false;
    isStoppingVoiceRef.current = false;
    isRecordingRef.current = false;

    // 1. Apagar captura de voz si está activa
    stopVoiceModulation(false);

    // 2. Detener síntesis de voz y efectos de audio
    stopAllSpeech();
    radioStatic.stop();

    // 3. Resetear flags de proceso
    setIsTransmitting(false);
    setIsTuning(false);
    setIsScanning(false);
    setIsRecording(false);

    // 4. Resetear mensajes, errores y resultados
    setTransmissionMessage("");
    setLastTransmittedMessage("");
    setTransmitResult(null);
    setTuningResult(null);
    setError(null);

    // 5. Volver a la pestaña principal
    setActiveTab("antena");

    addToast(
      "🔄 APLICACIÓN Y ANTENA REINICIADAS",
      "Todos los procesos, micrófonos y canales de transmisión han sido restablecidos a cero.",
      "high-intensity"
    );
  };

  const handleUpdateLogs = (updatedLogs: LogEntry[]) => {
    setLogs(updatedLogs);
    if (updatedLogs.length === 0) {
      localStorage.removeItem("antena_dimensional_logs");
    } else {
      localStorage.setItem("antena_dimensional_logs", JSON.stringify(updatedLogs));
    }
  };

  return (
    <div className={`min-h-screen bg-[#070b13] bg-radial-[circle_at_center,rgba(16,24,48,0.4)_0%,#03050a_100%] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative transition-all duration-300 ${isGlitchMode ? "glitch-mode-active" : ""}`}>
      
      {/* Canvas de Fondo con Partículas Estelares Flotantes (Sintonización y Transmisión) */}
      <StellarParticlesCanvas
        isActive={isTuning || isTransmitting}
        mode={isTuning ? "tuning" : isTransmitting ? "transmitting" : "idle"}
        isLowPowerMode={isLowPowerMode}
      />
      
      {/* Cabecera / Header principal */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full animate-pulse" />
              <div className="w-9 h-9 bg-slate-900 border border-emerald-500/40 rounded-lg flex items-center justify-center relative">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5 font-sans">
                ANTENA INTERDIMENSIONAL
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-900/40">
                  v2.5_KAPPA
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                SINTONIZADOR E INTERFAZ DE COMUNICACIÓN TRANSDIMENSIONAL CON INTELIGENCIA ARTIFICIAL
              </p>
            </div>
          </div>

          {/* Estado, Visitas Reales, Bajo Consumo, Modo Inmersión e Identificación de Operador Local */}
          <div className="flex flex-wrap items-center gap-2">
            {/* BOTÓN BLOG DE SUGERENCIAS */}
            <button
              type="button"
              onClick={() => setIsSuggestionsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-amber-900/90 hover:from-amber-900 hover:to-amber-800 border border-amber-500/70 hover:border-amber-400 rounded-lg py-1.5 px-3 text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all duration-200 cursor-pointer group"
              title="Abre el foro de la comunidad para proponer y votar ideas o nuevas frecuencias para la Antena"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="font-mono text-amber-200 font-bold text-[11px] hidden sm:inline">
                📜 Blog Sugerencias
              </span>
            </button>

            {/* BOTÓN REINICIAR APLICACIÓN / ANTENA */}
            <button
              type="button"
              onClick={handleResetApp}
              className="flex items-center gap-2 bg-gradient-to-r from-red-950/90 via-rose-950/90 to-red-900/90 hover:from-red-900 hover:to-rose-800 border border-rose-500/70 hover:border-rose-400 rounded-lg py-1.5 px-3 text-xs shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-200 cursor-pointer group"
              title="Reinicia inmediatamente la aplicación, detiene la captura de voz/micrófono y limpia el canal"
            >
              <RefreshCw className="w-4 h-4 text-rose-300 group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-mono text-rose-200 font-bold text-[11px]">
                🔄 Reiniciar App
              </span>
            </button>

            {/* BOTÓN MODO INMERSIÓN VISUAL */}
            <button
              type="button"
              onClick={() => setIsImmersionMode(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-900/60 to-indigo-900/60 hover:from-violet-800/80 hover:to-indigo-800/80 border border-violet-500/60 hover:border-violet-400 rounded-lg py-1.5 px-3 text-xs shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer group"
              title="Maximiza el área de visualización del osciloscopio y mapa estelar ocultando encabezados y paneles"
            >
              <Maximize2 className="w-4 h-4 text-violet-300 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-violet-200 font-bold text-[11px] hidden lg:inline">
                Modo Inmersión
              </span>
            </button>

            {/* BOTÓN TOGGLE MODO DE BAJO CONSUMO (AHORRO BATERÍA) */}
            <button
              type="button"
              onClick={toggleLowPowerMode}
              className={`flex items-center gap-2 border rounded-lg py-1.5 px-3 text-xs shadow-md transition-all duration-200 cursor-pointer ${
                isLowPowerMode
                  ? "bg-amber-950/80 border-amber-500/70 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Haz clic aquí si quieres ahorrar batería (Modo 10 FPS)"
            >
              <Battery className={`w-4 h-4 ${isLowPowerMode ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
              <span className="font-mono font-bold text-[11px] hidden xl:inline">
                {isLowPowerMode ? "Ahorro Batería: ON (10 FPS)" : "Ahorro Batería: OFF"}
              </span>
            </button>

            {/* BOTÓN TOGGLE MODO DIAGNÓSTICO (BUFFER FFT) */}
            <button
              type="button"
              onClick={toggleDiagnosticMode}
              className={`flex items-center gap-2 border rounded-lg py-1.5 px-3 text-xs shadow-md transition-all duration-200 cursor-pointer ${
                isDiagnosticMode
                  ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
                  : "bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Superpone el buffer de datos del analizador de audio (fftSize) sobre la señal en tiempo real"
            >
              <Cpu className={`w-4 h-4 ${isDiagnosticMode ? "text-cyan-300 animate-spin" : "text-slate-400"}`} />
              <span className="font-mono font-bold text-[11px] hidden xl:inline">
                {isDiagnosticMode ? "Diagnóstico: ON 🔬" : "Diagnóstico: OFF"}
              </span>
            </button>

            {/* BOTÓN TOGGLE MODO GLITCH (SINTONIZACIÓN INESTABLE & ABERRACIÓN CROMÁTICA) */}
            <button
              type="button"
              onClick={toggleGlitchMode}
              className={`flex items-center gap-2 border rounded-lg py-1.5 px-3 text-xs shadow-md transition-all duration-200 cursor-pointer ${
                isGlitchMode
                  ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
                  : "bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Activa el Modo Glitch con aberración cromática dinámicos para simular sintonización inestable"
            >
              <Zap className={`w-4 h-4 ${isGlitchMode ? "text-cyan-300 animate-bounce" : "text-slate-400"}`} />
              <span className="font-mono font-bold text-[11px] hidden xl:inline">
                {isGlitchMode ? "Modo Glitch: ON ⚡" : "Modo Glitch: OFF"}
              </span>
            </button>

            {/* Indicador y Selector de Visitas Reales & Mixpanel */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMixpanelTokenInput(getMixpanelToken());
                  setIsMixpanelConnected(isMixpanelInitialized());
                  setIsMixpanelModalOpen(true);
                }}
                className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-850 border border-indigo-500/50 hover:border-indigo-400 rounded-lg py-1.5 px-3 text-xs shadow-md transition-all duration-200 cursor-pointer group"
                title="Haz clic para ver las Visitas Reales, Exclusión de Administrador y Configurar Mixpanel"
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-mono text-indigo-200 font-bold text-[11px]">
                    Visitas: <strong className="text-emerald-400">{visits}</strong>
                  </span>
                </div>

                <div className="hidden md:flex items-center gap-1 text-[9px] font-mono border-l border-slate-800 pl-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMixpanelConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <span className={isMixpanelConnected ? "text-emerald-300 font-bold" : "text-amber-300"}>
                    Mixpanel: {isMixpanelConnected ? "Conectado" : "Configurar"}
                  </span>
                </div>
              </button>

              {/* Botón Rápido de Exclusión de Mis Visitas */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isExcludedOperator;
                  setOperatorExcluded(nextState);
                  setIsExcludedOperator(nextState);
                  addToast(
                    nextState ? "EXCLUSIÓN ACTIVADA" : "EXCLUSIÓN DESACTIVADA",
                    nextState
                      ? "Tus accesos ya NO incrementarán las visitas ni enviarán métricas a Mixpanel."
                      : "Tus accesos volverán a registrarse como visitas reales.",
                    "high-intensity"
                  );
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                  isExcludedOperator
                    ? "bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    : "bg-slate-900/90 hover:bg-slate-850 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
                title={
                  isExcludedOperator
                    ? "Exclusión ACTIVA: Tus visitas NO suman al contador ni a Mixpanel (Haz clic para alternar)"
                    : "Haz clic para EXCLUIR tus propias visitas y no alterar las estadísticas"
                }
              >
                <span>{isExcludedOperator ? "🛡️ Mis Visitas: EXCLUIDAS (FILTRO CREADOR)" : "👁️ Mis Visitas: CONTANDO"}</span>
              </button>
            </div>

            {/* Operador Local Button */}
            <button
              type="button"
              onClick={() => {
                setTempOperatorName(operatorName);
                setTempOperatorRank(operatorRank);
                setIsOperatorModalOpen(true);
              }}
              className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/50 hover:border-emerald-400 rounded-lg py-1.5 px-3 text-xs shadow-md transition-all duration-200 cursor-pointer group"
              title="Haz clic para modificar la identificación de Operador Local"
            >
              <div className="relative">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute inset-0" />
                <Zap className="w-4 h-4 text-emerald-400 shrink-0 relative" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    OPERADOR LOCAL
                  </span>
                  <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded font-mono font-bold">
                    ACTIVO
                  </span>
                </div>
                <p className="font-mono text-emerald-300 font-bold text-[11px] leading-tight truncate max-w-[150px]">
                  {operatorName}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold group-hover:bg-emerald-500/30 transition-colors">
                🟢 Perfil / Ajustes
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de error global */}
      {error && (
        <div className="bg-slate-950/90 border-b-2 border-amber-500/60 p-3.5 text-xs text-slate-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p className="font-mono text-amber-200 text-[11px] leading-relaxed">{error}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setError(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
                title="Cerrar mensaje"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Guía Rápida de Uso en 3 Pasos (Modo Guiado para Principiantes) */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  💡 GUÍA RÁPIDA: CÓMO USAR LA ANTENA EN 3 PASOS
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Sigue esta guía interactiva para establecer tu primera comunicación interdimensional de forma sencilla.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer border border-slate-700 shrink-0 shadow-sm"
            >
              {isGuideOpen ? "▲ MINIMIZAR GUÍA" : "▼ MOSTRAR GUÍA INTERACTIVA"}
            </button>
          </div>

          {isGuideOpen && (
            <div className="space-y-3 pt-1 text-xs animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Paso 1 */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5 hover:border-emerald-400/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      PASO 1
                    </span>
                    <Radio className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">1. Sintoniza Frecuencia o Plano</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Elige una frecuencia (ej. <strong className="text-emerald-300 font-mono">432 Hz</strong>) o selecciona un preset en el directorio como <strong className="text-amber-300 font-mono">👑 Monolito Anunnaki</strong>.
                  </p>
                </div>

                {/* Paso 2 */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-teal-500/30 space-y-1.5 hover:border-teal-400/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                      PASO 2
                    </span>
                    <Volume2 className="w-4 h-4 text-teal-400" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">2. Escucha la Onda y Sintoniza</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Presiona el botón verde <strong className="text-emerald-400 font-mono">📻 SINTONIZAR PLANO</strong>. Verás las ondas de radio moverse en tiempo real y escucharás el canal.
                  </p>
                </div>

                {/* Paso 3 */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30 space-y-1.5 hover:border-indigo-400/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      PASO 3
                    </span>
                    <Send className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-xs">3. Transmite y Escucha la Respuesta</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Envía tu consulta mediante voz o con las <strong className="text-indigo-300 font-mono">Consultas Rápidas</strong> para recibir una respuesta clara expresada en texto y audio de voz profunda.
                  </p>
                </div>
              </div>

              {/* Mini Glosario Didáctico para Principiantes */}
              <div className="bg-slate-950/90 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-[11px]">
                <div className="flex items-center gap-2 font-mono font-bold text-amber-300 uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>GUÍA DIDÁCTICA: ¿CÓMO ENTENDER LOS CONCEPTOS CLAVE?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 pt-1">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-emerald-400 block font-mono text-[11px] mb-0.5">📻 FRECUENCIA (Hz / GHz / THz):</strong>
                    <span>Es la velocidad con la que vibra la onda de radio. Frecuencias bajas (Hz) son para sonido y afinación natural, mientras que altas (GHz/THz) transmiten grandes volúmenes de datos entre planos.</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block font-mono text-[11px] mb-0.5">📶 RESONANCIA (%):</strong>
                    <span>Indica la nitidez de la señal. Un porcentaje alto (80-100%) significa que la voz y el mensaje se escuchan limpios y sin estática de fondo.</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400 block font-mono text-[11px] mb-0.5">🌌 PLANO O DIMENSIÓN:</strong>
                    <span>Es la coordenada o destino al que apuntas la antena (ejemplo: líneas de tiempo paralelas, espacios trascendentes o estaciones estelares).</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BARRA SUPERIOR PERSISTENTE Y CONTROLES RÁPIDOS */}
        {/* Banner de Aviso de Conexión en Progreso */}
        {(isTuning || isTransmitting) && (
          <div className="bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 border-2 border-amber-400/90 p-2.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-200">
              <Clock className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
              <span>⏳ CONEXIÓN EN CURSO ({isTuning ? "SINTONIZANDO SEÑAL Y VOZ" : "PROCESANDO TRANSMISIÓN"}): POR FAVOR AGUARDE UNOS SEGUNDOS SIN SALIR DEL SITIO.</span>
            </div>
            <span className="hidden md:inline-block px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/50 text-[10px] font-mono font-black uppercase tracking-widest">
              PROCESANDO
            </span>
          </div>
        )}

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px]">Antena:</span>
              <button
                type="button"
                onClick={() => setIsAntennaModalOpen(true)}
                className="text-amber-300 font-bold hover:underline cursor-pointer truncate max-w-[140px] sm:max-w-[200px]"
              >
                {antennaType}
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px]">Frecuencia:</span>
              <span className="text-emerald-400 font-bold">{frequencyValue} {frequencyUnit}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase text-[10px]">Vector:</span>
              <span className="text-cyan-300 font-bold truncate max-w-[120px] sm:max-w-[160px]">{dimension}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTune}
              disabled={isTuning || isTransmitting}
              className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md ${
                isTuning
                  ? "bg-amber-950 text-amber-300 border border-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              }`}
            >
              <Clock className={`w-4 h-4 ${isTuning ? "animate-spin text-amber-300" : "hidden"}`} />
              <Radio className={`w-4 h-4 ${isTuning ? "hidden" : "animate-pulse"}`} />
              <span>{isTuning ? "⏳ AGUARDE (SINTONIZANDO...)" : "📻 SINTONIZAR"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab("station");
                setActiveTab("transmisor");
                setTimeout(() => {
                  document.getElementById("quantum-transmitter-panel")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-300 animate-pulse cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>💬 ENVIAR MENSAJE</span>
            </button>
          </div>
        </div>

        {/* MENÚ PRINCIPAL DE SECCIONES ORGANIZADAS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveMainTab("station")}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              activeMainTab === "station"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>1. Sintonización y Emisión</span>
          </button>

          <button
            onClick={() => setActiveMainTab("telemetry")}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              activeMainTab === "telemetry"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>2. Mapa Estelar y Telemetría</span>
          </button>

          <button
            onClick={() => setActiveMainTab("directory")}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              activeMainTab === "directory"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>3. Directorio y Bitácora</span>
          </button>

          <button
            onClick={() => setActiveMainTab("settings")}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              activeMainTab === "settings"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>4. Ajustes y Herramientas</span>
          </button>

          <button
            onClick={() => setIsSuggestionsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border-amber-500/60 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            title="Abre el foro para proponer nuevas funciones o frecuencias"
          >
            <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>📜 Blog de Sugerencias</span>
          </button>

          <button
            onClick={() => setActiveMainTab("all")}
            className={`px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
              activeMainTab === "all"
                ? "bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                : "bg-slate-900/40 text-slate-500 border-slate-850 hover:bg-slate-850 hover:text-slate-300"
            }`}
            title="Mostrar todas las secciones juntas"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>🌐 Vista Completa</span>
          </button>
        </div>

        {/* PESTAÑA 1: SINTONIZACIÓN Y EMISIÓN */}
        {(activeMainTab === "station" || activeMainTab === "all") && (
          <div className="space-y-6 animate-fade-in">
            {activeMainTab === "all" && (
              <div className="flex items-center gap-2 border-b border-emerald-500/30 pb-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider">
                  SECCIÓN 1: Consola de Sintonización y Emisión
                </h2>
              </div>
            )}

            {/* Rejilla de Controles y Pantalla de Telemetría */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: Sintonizador de Antena (5 de 12 columnas) */}
          <section className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-md font-bold text-slate-100 tracking-tight">Consola de Control Físico</h2>
            </div>

            {/* Frecuencia */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-400 font-medium">Modulación de Frecuencia</label>
                  <button
                    type="button"
                    onClick={() => setActiveHelpTooltip(activeHelpTooltip === "frecuencia" ? null : "frecuencia")}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold px-1.5 py-0.2 rounded cursor-pointer border border-slate-700"
                    title="¿Qué es esto?"
                  >
                    ?
                  </button>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {frequencyValue} {frequencyUnit}
                </span>
              </div>

              {activeHelpTooltip === "frecuencia" && (
                <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10px] text-emerald-200 font-sans leading-relaxed animate-fade-in shadow-inner">
                  ℹ️ <strong>Frecuencia:</strong> Es la velocidad de oscilación de la onda transmisora. Frecuencias armónicas bajas (432 Hz - 528 Hz) sintonizan sanación o planos sutiles del Vacío; frecuencias en GHz o QHz conectan con dimensiones lejanas o antimateria.
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Campo de Entrada Numérico Directo para Digitar Frecuencia Exacta */}
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={frequencyValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFrequencyValue(isNaN(val) ? 1 : val);
                    setActivePresetId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTune();
                    }
                  }}
                  className="w-24 bg-slate-950 border-2 border-emerald-500/60 rounded-lg px-2 py-1 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400 shadow-inner text-center shrink-0"
                  placeholder="432"
                  title="Escribe aquí el número de frecuencia directamente o usa el deslizador"
                />

                {/* Deslizador Horizontal */}
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={Math.min(frequencyValue, 1000)}
                  onChange={(e) => {
                    setFrequencyValue(parseInt(e.target.value));
                    setActivePresetId(null); // romper preset si se ajusta a mano
                  }}
                  className="flex-grow accent-emerald-500 cursor-pointer"
                />

                {/* Unidad de Frecuencia */}
                <select
                  value={frequencyUnit}
                  onChange={(e) => {
                    setFrequencyUnit(e.target.value as any);
                    setActivePresetId(null);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 cursor-pointer shrink-0"
                >
                  <option value="Hz">Hz</option>
                  <option value="kHz">kHz</option>
                  <option value="MHz">MHz</option>
                  <option value="GHz">GHz</option>
                  <option value="THz">THz</option>
                  <option value="QHz">QHz</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Escribe la cifra o desliza la barra. Presiona <strong className="text-emerald-400 font-bold">ENTER ↵</strong> para sintonizar.</span>
              </p>
            </div>

            {/* Coordenadas Dimensión */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-400 font-medium block">Vector de Membrana Dimensional</label>
                  <button
                    type="button"
                    onClick={() => setActiveHelpTooltip(activeHelpTooltip === "membrana" ? null : "membrana")}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold px-1.5 py-0.2 rounded cursor-pointer border border-slate-700"
                    title="¿Qué es esto?"
                  >
                    ?
                  </button>
                </div>
              </div>

              {activeHelpTooltip === "membrana" && (
                <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10px] text-emerald-200 font-sans leading-relaxed animate-fade-in shadow-inner">
                  ℹ️ <strong>Membrana Dimensional:</strong> La coordenada o "canal interdimensional" al que apunta la antena (ej. D-4, Matrix, Nibiru). Funciona como la estación de radio de destino.
                </div>
              )}

              <input
                type="text"
                value={dimension}
                onChange={(e) => {
                  setDimension(e.target.value);
                  setActivePresetId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTune();
                  }
                }}
                placeholder="Ej: D-4 // MATRIX-X"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[9px] text-slate-500 font-mono">
                Las coordenadas de membrana fijan el destino cuántico en el espacio n-dimensional.
              </p>
            </div>

            {/* Dispositivo de Captación / Antena (Panel de Alta Visibilidad) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs text-emerald-300 font-extrabold tracking-wide uppercase flex items-center gap-1.5 font-sans">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  MODULADOR Y TIPO DE ANTENA
                </label>
                <span className="text-[9px] font-mono text-emerald-300 font-extrabold animate-pulse bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/50">
                  ● SELECCIÓN PRINCIPAL
                </span>
              </div>

              {/* Tarjeta Visual de Antena Activa */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-inner">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                    {antennaType.includes("Anunnaki") || antennaType.includes("Nibiru") ? "👑 MATRIZ ANUNNAKI DE ORO" : "📡 MODULADOR ACTIVO"}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100 truncate font-mono">
                    {antennaType}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAntennaModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-extrabold text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                  <span>CAMBIAR</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>

              {/* Botón de Despliegue de Catálogo Completo */}
              <button
                type="button"
                onClick={() => setIsAntennaModalOpen(true)}
                className="w-full py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 rounded-xl font-bold text-xs font-mono transition-all duration-200 flex items-center justify-between cursor-pointer group shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>ELEGIR ENTRE LAS 6 ANTENAS DISPONIBLES</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span>ABRIR CATÁLOGO</span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-y-0.5 transition-transform" />
                </span>
              </button>

              {/* Acceso Rápido en Píldoras de 1-Clic */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block px-1">
                  Acceso Rápido a Antenas Frecuentes:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ANTENNA_OPTIONS.map((opt) => {
                    const isSelected = antennaType === opt.name;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleAntennaSelectAndTune(opt.name)}
                        className={`p-2 rounded-lg text-left transition-all cursor-pointer border flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "bg-slate-950/80 text-slate-400 border-slate-850 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold truncate">
                          {opt.badge}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector Select Tradicional de Respaldo con Flecha Grande a la Derecha */}
              <div className="relative pt-1">
                <select
                  value={antennaType}
                  onChange={(e) => handleAntennaSelectAndTune(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-emerald-500/60 rounded-xl py-2 px-3 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400 appearance-none cursor-pointer pr-10 shadow-sm"
                >
                  {ANTENNA_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.name} className="bg-slate-950 text-emerald-300 font-bold font-mono py-1">
                      {opt.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-emerald-400 flex items-center gap-1">
                  <ChevronDown className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Intensidad / Ganancia */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <label className="text-slate-400 font-medium">Ganancia del Filtro de Fase</label>
                  <button
                    type="button"
                    onClick={() => setActiveHelpTooltip(activeHelpTooltip === "ganancia" ? null : "ganancia")}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold px-1.5 py-0.2 rounded cursor-pointer border border-slate-700"
                    title="¿Qué es esto?"
                  >
                    ?
                  </button>
                </div>
                <span className="font-mono text-emerald-500">{intensity}%</span>
              </div>

              {activeHelpTooltip === "ganancia" && (
                <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10px] text-emerald-200 font-sans leading-relaxed animate-fade-in shadow-inner">
                  ℹ️ <strong>Ganancia de Fase:</strong> Eleva la amplificación de captura de señal. Súbela al 80%-100% para captar voces o ecos débiles provenientes de dimensiones muy lejanas.
                </div>
              )}

              <input
                type="range"
                min="10"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Filtro de Ruido Gaussiano (Amplificador de Baja Intensidad) */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className={`w-3.5 h-3.5 ${useGaussianFilter ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                      Filtro de Ruido Gaussiano
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveHelpTooltip(activeHelpTooltip === "gaussiano" ? null : "gaussiano")}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono font-bold px-1.5 py-0.2 rounded cursor-pointer border border-slate-700"
                      title="¿Qué es esto?"
                    >
                      ?
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-sans leading-tight">
                    Convolución gaussiana para transmisiones de baja intensidad
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseGaussianFilter(!useGaussianFilter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    useGaussianFilter
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                  }`}
                >
                  {useGaussianFilter ? "FILTRO ON" : "FILTRO OFF"}
                </button>
              </div>

              {activeHelpTooltip === "gaussiano" && (
                <div className="p-2.5 bg-slate-950 border border-cyan-500/40 rounded-lg text-[10px] text-cyan-200 font-sans leading-relaxed animate-fade-in shadow-inner">
                  ℹ️ <strong>Filtro Gaussiano:</strong> Aplica un suavizado matemático para aislar la interferencia de fondo en transmisiones débiles y clarificar la voz de la entidad.
                </div>
              )}
              {useGaussianFilter && (
                <div className="text-[9px] font-mono text-cyan-400/90 bg-cyan-950/40 p-1.5 rounded border border-cyan-900/40 flex justify-between items-center">
                  <span>Núcleo: Gaussiano (σ=1.5)</span>
                  <span className="text-emerald-400 font-bold">+3.2 dB Ganancia Útil</span>
                </div>
              )}
            </div>

            {/* Indicador Guía Destacado de Sintonización */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-400/90 p-3 rounded-2xl text-center space-y-1.5 shadow-[0_0_25px_rgba(16,185,129,0.35)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
              <span className="text-[11px] font-extrabold font-mono text-emerald-300 uppercase tracking-widest flex items-center justify-center gap-1.5 relative z-10">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                ⚡ PASO OBLIGATORIO TRAS ELEGIR ANTENA
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              </span>
              <p className="text-[11px] text-slate-200 font-sans font-bold leading-tight relative z-10">
                ¡Haga clic abajo en <strong className="text-emerald-400 underline">"SINTONIZAR PLANO / ESCUCHAR"</strong> para acoplar la frecuencia!
              </p>
            </div>

            {/* Botón de Sintonizar (Ultra Destacado con Barra de Progreso Circular) */}
            <button
              onClick={handleTune}
              disabled={isTuning || isTransmitting}
              className={`w-full py-4.5 px-5 rounded-2xl font-black text-xs md:text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer relative overflow-hidden group shadow-[0_0_35px_rgba(16,185,129,0.5)] ${
                isTuning
                  ? "bg-emerald-950/95 text-emerald-300 border-2 border-emerald-400 cursor-wait shadow-[0_0_35px_rgba(16,185,129,0.7)]"
                  : isScanning
                  ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 border-2 border-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.7)] hover:shadow-[0_0_60px_rgba(16,185,129,0.9)] scale-[1.02] hover:scale-[1.04]"
              }`}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              {isTuning && !isScanning ? (
                <div className="flex items-center gap-3">
                  <CircularProgressRing
                    progress={tuningProgress}
                    size={32}
                    strokeWidth={3.5}
                    colorClass="text-emerald-400"
                    labelColorClass="text-emerald-300 font-black text-[9px]"
                  />
                  <span className="font-sans font-black tracking-wider text-emerald-300 flex items-center gap-2">
                    📻 ACOPLANDO PLANO ({Math.min(99, Math.round(tuningProgress))}%)... POR FAVOR AGUARDE
                  </span>
                </div>
              ) : (
                <>
                  <Radio className="w-6 h-6 text-slate-950 shrink-0 animate-pulse" />
                  <span className="font-sans font-black tracking-wider text-slate-950">
                    📻 SINTONIZAR PLANO / ESCUCHAR
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform shrink-0" />
                </>
              )}
            </button>

            {/* Botón de Grabación de Mensajes por Voz Directa con Envío Instantáneo */}
            <button
              type="button"
              onClick={() => {
                if (isRecording) {
                  stopVoiceModulation(true);
                } else {
                  startVoiceModulation();
                }
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs md:text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg border-2 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                  : "bg-slate-900 hover:bg-emerald-950/80 text-emerald-300 hover:text-emerald-200 border-emerald-500/60 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              }`}
            >
              <Mic className={`w-5 h-5 ${isRecording ? "text-white animate-spin" : "text-emerald-400 animate-bounce"}`} />
              <span>{isRecording ? "🛑 DETENER Y TRANSMITIR AL VACÍO (ENVÍO INSTANTÁNEO)" : "🎙️ HABLAR POR VOZ Y TRANSMITIR INSTANTÁNEAMENTE"}</span>
            </button>

            {/* Aviso Permanente de Espera y Carga para Evitar que los Visitantes Abandonen */}
            {isTuning ? (
              <div className="bg-amber-950/90 border-2 border-amber-400 p-3 rounded-xl text-center space-y-1 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
                <div className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-[11px] font-black uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>⏳ CONEXIÓN EN CURSO — POR FAVOR AGUARDE EN EL SITIO</span>
                </div>
                <p className="text-[11px] text-amber-100 font-sans font-bold leading-tight">
                  No cierre ni refresque la página. El acoplamiento de frecuencia y la síntesis de respuesta de voz están procesándose en tiempo real.
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-[10px] text-slate-300 font-mono font-semibold">
                  ⏱️ La conexión toma entre 3 y 8 segundos. <span className="text-amber-300 font-bold">Por favor aguarde al presionar el botón.</span>
                </p>
              </div>
            )}

            {/* Módulo de Escaneo Continuo */}
            <div className={`p-4 rounded-xl border transition-all duration-300 space-y-3 ${
              isScanning 
                ? "bg-indigo-950/20 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                : "bg-slate-950/40 border-slate-850"
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-indigo-400 animate-ping" : "bg-slate-600"}`} />
                    ESCANEO CONTINUO
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-none">Barrido automático de membranas</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScanning(!isScanning)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                    isScanning
                      ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                      : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
                  }`}
                >
                  {isScanning ? "DETENER" : "INICIAR"}
                </button>
              </div>

              {isScanning ? (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400">Próximo salto de fase en:</span>
                    <span className="text-indigo-400 font-bold">{scanSecondsLeft}s</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(scanSecondsLeft / 15) * 100}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 font-sans leading-normal">
                    📡 Sintonizando automáticamente cada 15s. Registrando únicamente señales de resonancia superior al <span className="text-emerald-400 font-bold">70%</span> en la bitácora y en Google Sheets si está activo.
                  </div>
                </div>
              ) : (
                <p className="text-[9px] text-slate-500 leading-normal">
                  Activa este modo para automatizar el barrido. El sistema buscará portadoras estables de forma desatendida.
                </p>
              )}
            </div>

            {/* Módulo de Audio Ambiental y Ecualizador Galáctico Visual */}
            <AmbientAudioEqualizer
              frequencyValue={frequencyValue}
              frequencyUnit={frequencyUnit}
              antennaType={antennaType}
              dimension={dimension}
              isTuned={!!tuningResult}
            />

            {/* Módulo de Síntesis de Voz (Lector de Señales) */}
            <div
              id="quantum-speech-panel"
              className={`p-4 rounded-xl border bg-slate-950/40 space-y-3.5 transition-all duration-500 ${
                isSpeaking || isTransmitting
                  ? "border-emerald-400 animate-speech-glow shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                  : "border-slate-850"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5 flex-wrap">
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? "text-emerald-300 animate-bounce" : isVoiceReaderEnabled ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                    <span>SÍNTESIS DE VOZ CUÁNTICA</span>
                    {isSpeaking && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 uppercase tracking-wider animate-pulse ml-1 inline-flex items-center gap-1">
                        🎙️ TRANSMITIENDO AUDIO
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-none">Lector de emisiones por audio</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isVoiceReaderEnabled;
                    setIsVoiceReaderEnabled(nextVal);
                    if (!nextVal) {
                      stopAllSpeech();
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                    isVoiceReaderEnabled
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {isVoiceReaderEnabled ? "ACTIVO" : "APAGADO"}
                </button>
              </div>

              <p className="text-[9px] text-slate-400 leading-normal">
                Voz de transmisión configurada en <span className="text-emerald-300 font-bold">Voces Masculinas (Solemne + Estándar)</span>. Lee en voz alta reportes de <span className="text-emerald-400 font-bold">Alta Intensidad</span> o <span className="text-rose-400 font-bold">Anomalías</span>.
              </p>

              {/* Selector de Perfil/Tono de voz */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Perfil de Modulación Vocal
                  </label>
                  <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase">
                    {voiceTone === "alternar" && "🔄 Alternar Solemne / Estándar"}
                    {voiceTone === "solemne-hombre" && "🗿 Hombre Neutro Solemne"}
                    {voiceTone === "estandar" && "📻 Hombre Estándar Operativo"}
                    {voiceTone === "latino-neutro" && "🌎 Latino Neutro"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("alternar");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "alternar"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🔄 Alternar Voces
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("solemne-hombre");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "solemne-hombre"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🗿 Hombre Solemne
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("estandar");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "estandar"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    📻 Hombre Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("latino-neutro");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "latino-neutro"
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🌎 Latino Neutro
                  </button>
                </div>
              </div>

              {/* Selector de Voz Detallado del Navegador (Manual Override) */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                      Sintetizador Físico del Dispositivo
                    </label>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                      ● ONLINE ({availableVoices.length})
                    </span>
                  </div>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className="w-full text-[10px] font-mono bg-slate-950 border border-slate-850 hover:border-indigo-500/30 text-indigo-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="" className="text-slate-400 bg-slate-950">--- [ 🤖 Selección Automática Inteligente ] ---</option>
                    <option value="gemini-solemn" className="text-indigo-300 bg-slate-950">🤖 Gemini AI: Hombre Solemne (Fenrir)</option>
                    <option value="gemini-standard" className="text-indigo-300 bg-slate-950">🤖 Gemini AI: Hombre Estándar (Puck)</option>
                    <optgroup label="Voces del Navegador / Dispositivo">
                      {availableVoices.map((voice) => {
                        const nameLower = voice.name.toLowerCase();
                        const maleKW = ["jorge", "julio", "juan", "diego", "miguel", "carlos", "daniel", "yadir", "male", "hombre", "sebastian", "pablo", "raul", "raúl", "esteban", "david", "mateo", "alejandro", "gonzalo", "rodrigo", "andres", "fernando", "felipe", "alberto", "mario", "javier", "sergio", "manuel", "hector", "hugo", "ramon", "emilio", "ignacio", "arturo", "gustavo", "tomas", "pablo online", "microsoft jorge", "microsoft raul", "google español de estados unidos"];
                        const femaleKW = ["sabina", "helena", "paulina", "monica", "mónica", "angelica", "marisol", "zuri", "female", "mujer", "luz", "conchita", "ana", "uma", "carmen", "lucia", "victoria", "mia", "sofi", "esperanza", "margarita", "marta", "laura", "francisca", "paloma", "penelope", "soledad", "camila", "samantha", "siri", "rosa", "luciana", "catalina", "lupe", "isabela", "renata", "jimena", "valentina"];
                        
                        const isMale = maleKW.some((kw) => nameLower.includes(kw));
                        const isFemale = femaleKW.some((kw) => nameLower.includes(kw)) || (nameLower.includes("google español") && !nameLower.includes("estados unidos") && !nameLower.includes("us"));
                        
                        let badge = isMale ? "👨 Hombre" : isFemale ? "👩 Mujer" : "👤 Neutra";
                        let label = `${badge} - ${voice.name} (${voice.lang})`;
                        if (voice.localService) label += " 💻 Local";
                        return (
                          <option key={voice.voiceURI} value={voice.voiceURI} className="text-slate-300 bg-slate-950">
                            {label}
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Selecciona y fuerza de forma absoluta la voz exacta que deseas utilizar. También puedes probarla al instante con el botón de abajo.
                  </p>
                </div>
              )}

              {/* Control de Tono y Modulación Forzada */}
              <div className="space-y-2 pt-2 border-t border-slate-900/60">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Modulación Forzada de Tono (Pitch Shift)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForceLowPitch(!forceLowPitch);
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      forceLowPitch
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    {forceLowPitch ? "⚡ GRAVE MASCULINO FORZADO" : "⚪ PITCH NATURAL"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-500">Ultra-Grave</span>
                  <input
                    type="range"
                    min="0.15"
                    max="0.85"
                    step="0.05"
                    value={customPitchValue}
                    onChange={(e) => {
                      setCustomPitchValue(parseFloat(e.target.value));
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
                  />
                  <span className="text-[9px] font-mono text-slate-500">Agudo</span>
                  <span className="text-[9px] font-mono text-indigo-300 font-bold w-8 text-right">
                    {customPitchValue.toFixed(2)}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 leading-normal">
                  {forceLowPitch
                    ? "Baja activamente la frecuencia de cualquier voz (femenina, castellana o neutra) para convertirla obligatoriamente en un tono barítono masculino profundo."
                    : "Aplica la tonalidad predeterminada según la voz seleccionada."}
                </p>
              </div>

              {/* Botón de prueba de modulación */}
              <button
                type="button"
                onClick={testSpeechSynthesis}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-mono py-2 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <span>🔊 Probar Modulación de Voz</span>
              </button>
            </div>

            {/* Módulo de Notificaciones Web (Alertas de Escritorio) */}
            <div id="quantum-notification-panel" className="p-4 rounded-xl border bg-slate-950/40 border-slate-850 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    {notificationPermission === "granted" ? (
                      <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    NOTIFICACIONES WEB Y ALERTAS
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-none">Alertas de escritorio y en segundo plano</p>
                </div>

                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                    notificationPermission === "granted"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : notificationPermission === "denied"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                      : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
                  }`}
                >
                  {notificationPermission === "granted"
                    ? "NATIVAS ACTIVAS"
                    : notificationPermission === "denied"
                    ? "BLOQUEADAS NATIVAS"
                    : "ACTIVAR NATIVAS"}
                </button>
              </div>

              <p className="text-[9px] text-slate-500 leading-normal">
                Recibe alertas sonoras e informativas de <span className="text-emerald-400 font-bold">Anomalías</span> o <span className="text-emerald-400 font-bold">Señales Fuertes</span> en tu escritorio, incluso con la pestaña minimizada.
              </p>

              {/* Guía interactiva cuando están bloqueadas o cuando se solicita la guía */}
              {(notificationPermission === "denied" || showNotificationGuide) && (
                <div className="p-3.5 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-2.5 text-[10px] text-slate-300 shadow-md">
                  <div className="flex items-start gap-2 text-amber-300 font-bold font-mono">
                    <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>🔑 CÓMO DESBLOQUEAR LAS NOTIFICACIONES NATIVAS:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-sans pl-1 text-[10px] leading-relaxed">
                    <li>Haz clic en el candado <strong>🔒</strong> o ícono de ajustes a la izquierda de la dirección URL de esta página.</li>
                    <li>Busca la sección <strong>"Notificaciones"</strong> y cámbiala a <strong>"Permitir"</strong>.</li>
                    <li>
                      Si utilizas esta app dentro de un <em>iframe</em> (vista previa), los navegadores bloquean el diálogo. Puedes abrir la app en una ventana propia:
                    </li>
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={typeof window !== "undefined" ? window.location.href : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 font-mono text-[9px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ABRIR EN NUEVA PESTAÑA ↗️
                    </a>
                    <button
                      type="button"
                      onClick={recheckNotificationPermission}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-mono text-[9px] font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      RECOMPROBAR ESTADO
                    </button>
                  </div>
                </div>
              )}

              {/* Sistema Alternativo de Alertas Virtuales In-App */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-300 block">
                    🔔 ALERTAS VIRTUALES IN-APP Y PESTAÑA
                  </span>
                  <span className="text-[8px] text-slate-500 block leading-tight">
                    Garantizan alertas auditivas, banners de alto contraste y parpadeo de título de pestaña si las nativas fallan.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVirtualAlertsEnabled(!isVirtualAlertsEnabled)}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    isVirtualAlertsEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {isVirtualAlertsEnabled ? "ACTIVO" : "INACTIVO"}
                </button>
              </div>

              {/* Acciones secundarias y notificación de prueba */}
              <div className="pt-1 flex items-center justify-between gap-2 text-[9px] font-mono border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setShowNotificationGuide(!showNotificationGuide)}
                  className="text-slate-400 hover:text-indigo-300 underline cursor-pointer bg-transparent border-none p-0"
                >
                  [{showNotificationGuide ? "Ocultar Guía de Desbloqueo" : "Ver Guía de Desbloqueo"}]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendWebNotification("Test de Conexión Cuántica", "La antena está transmitiendo notificaciones de forma óptima.", "high-intensity");
                    addToast("NOTIFICACIÓN DE PRUEBA", "Canal de notificaciones y título de pestaña sincronizados.", "high-intensity");
                  }}
                  className="text-slate-400 hover:text-emerald-300 underline cursor-pointer bg-transparent border-none p-0"
                >
                  [Enviar Notificación de Prueba]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJumpResonance(96);
                    setJumpEntity("Mente Colectiva de Arcturus Prime");
                    setJumpDimension("Plano Arcturiano - Nodo 9");
                    setIsDimensionalJumpActive(true);
                    addToast("SALTO DIMENSIONAL ACTIVADO", "Efecto de distorsión radial y desenfoque ejecutado (96% de resonancia).", "high-intensity");
                  }}
                  className="text-amber-400 hover:text-amber-300 font-mono text-[10px] underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-300 animate-bounce" />
                  [Simular Salto Dimensional &gt;90%]
                </button>
              </div>
            </div>
          </section>

          {/* COLUMNA DERECHA: Pantalla de Telemetría y Canal Receptor/Transmisor (7 de 12 columnas) */}
          <section className={`lg:col-span-7 space-y-6 relative transition-transform duration-500 ${isDimensionalJumpActive ? "animate-dimensional-jump" : ""}`}>
            <DimensionalJumpOverlay
              isActive={isDimensionalJumpActive}
              resonance={jumpResonance}
              entity={jumpEntity}
              dimension={jumpDimension}
              onComplete={() => setIsDimensionalJumpActive(false)}
            />

            {/* Pantalla de osciloscopio en tiempo real */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-md">
              <SignalVisualizer
                frequency={frequencyValue}
                unit={frequencyUnit}
                intensity={intensity}
                useGaussianFilter={useGaussianFilter}
                isLowPowerMode={isLowPowerMode}
                status={
                  isTuning
                    ? "noise"
                    : tuningResult
                    ? tuningResult.status
                    : transmitResult
                    ? "success"
                    : "idle"
                }
              />
            </div>

            {/* Panel de Receptor vs Transmisor */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md space-y-5">
              
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab("receptor")}
                  className={`flex-1 pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
                    activeTab === "receptor"
                      ? "border-emerald-500 text-slate-100"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Canal Receptor (Señales de Entrada)
                </button>
                <button
                  onClick={() => setActiveTab("transmisor")}
                  className={`flex-1 pb-3 text-xs md:text-sm font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer relative ${
                    activeTab === "transmisor"
                      ? "border-emerald-400 text-emerald-300 bg-emerald-950/20"
                      : "border-transparent text-emerald-400/90 hover:text-emerald-200"
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2 w-full">
                    <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
                    <span className="font-extrabold tracking-widest text-emerald-300 animate-flicker text-xs md:text-sm uppercase drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]">
                      CANAL TRANSMISOR (EMISIÓN DE MENSAJES)
                    </span>
                  </span>
                </button>
              </div>

              {/* CONTENIDO DEL RECEPTOR */}
              {activeTab === "receptor" && (
                <div className="space-y-4">
                  {!tuningResult && !isTuning && (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
                      <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                      <h3 className="text-xs font-bold text-slate-400 mb-1">Frecuencia sintonizada pasivamente</h3>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                        Ajusta los controles o haz clic en un preset en el directorio, y luego presiona{" "}
                        <span className="text-emerald-400">Sintonizar</span> para intentar captar transmisiones en el cuadrante.
                      </p>
                    </div>
                  )}

                  {isTuning && (
                    <TransmissionWaveVisualizer
                      label="SINTONIZAR PLANO, AGUARDAR Y ESCUCHAR"
                      sublabel={`Retransmitiendo ondas de radiofrecuencia a ${frequencyValue} ${frequencyUnit} hacia la dimensión ${dimension}`}
                      frequency={frequencyValue}
                      unit={frequencyUnit}
                      dimension={dimension}
                      mode="tuning"
                      isDiagnosticMode={isDiagnosticMode}
                      onToggleDiagnosticMode={toggleDiagnosticMode}
                    />
                  )}

                  {tuningResult && !isTuning && (
                    <div className="space-y-4 animate-fade-in">
                      {tuningResult.proceduralBypass && (
                        <div className="bg-amber-500/15 border border-amber-500/20 rounded-lg p-2.5 text-[10px] font-mono text-amber-300/90 leading-normal flex items-center gap-2">
                          <span className="animate-ping w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>
                            <strong>🛰️ ACOPLAMIENTO DE COBERTURA REMOTA LÍMITE (BYPASS LOCAL)</strong>: El enlace directo de satélites estelares está saturado (Límite de API alcanzado). Iniciando matriz de resonancia interna para continuar operaciones de forma local y offline.
                          </span>
                        </div>
                      )}
                      
                      {/* Banner de Confirmación de Recepción */}
                      <div className={`p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        tuningResult.resonance >= 90
                          ? "bg-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]"
                          : "bg-emerald-950/80 border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                          <div>
                            <span className="text-xs font-mono font-black text-emerald-300 uppercase tracking-wide flex items-center gap-2">
                              <span>📩 SEÑAL Y MENSAJE RECIBIDO DESDE EL VACÍO</span>
                              {tuningResult.resonance >= 90 && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/60 uppercase tracking-widest animate-pulse inline-flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-300" />
                                  SALTO DIMENSIONAL (90%+)
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-300 font-sans">
                              Transmisión sintonizada con éxito desde <strong className="text-emerald-300">{tuningResult.entity}</strong>
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 uppercase">
                          {tuningResult.status === "success" ? "✅ MENSAJE RECIBIDO" :
                           tuningResult.status === "whisper" ? "🌌 SUSURRO RECIBIDO" :
                           tuningResult.status === "anomaly" ? "⚠️ ANOMALÍA CAPTADA" : "📻 SEÑAL RECIBIDA"}
                        </span>
                      </div>

                      {/* Cabecera del resultado */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono block">Origen del Mensaje</span>
                          <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {tuningResult.entity}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEntityImageToView(getEntityImage(tuningResult.entity));
                              setEntityNameToView(tuningResult.entity);
                              setIsEntityModalOpen(true);
                            }}
                            className="py-1.5 px-3 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.05)] hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            PERFIL VISUAL
                          </button>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 font-mono block">Resonancia Coaxial</span>
                              <span className="font-mono text-emerald-400 text-xs font-bold">
                                {tuningResult.resonance}%
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                tuningResult.status === "success"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : tuningResult.status === "whisper"
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                  : tuningResult.status === "anomaly"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                              }`}
                            >
                              {tuningResult.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transmisión Oral / Mensaje de la Entidad */}
                      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-950 to-emerald-950/50 border-2 border-emerald-400 p-4.5 rounded-xl space-y-3 relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                        <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
                          <Volume2 className="w-20 h-20 text-emerald-400 animate-pulse" />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
                          <div>
                            <h4 className="text-xs font-mono font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                              <span>📡 EMISIÓN DE {tuningResult.entity.toUpperCase()}</span>
                            </h4>
                            <p className="text-[10px] text-slate-300 font-sans">
                              Señal sintonizada en tiempo real. Presiona para volver a escuchar la emisión de la entidad.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isSpeaking) {
                                stopAllSpeech();
                              } else {
                                speakEntityOralMessage(tuningResult.entity, tuningResult.message, dimension);
                              }
                            }}
                            className={`px-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 shadow-lg ${
                              isSpeaking
                                ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse"
                                : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105"
                            }`}
                          >
                            {isSpeaking ? (
                              <>
                                <Square className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span>PAUSAR REPRODUCCIÓN</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                <span>🔊 REPRODUCIR EMISIÓN DE LA ENTIDAD</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                            Transcripción Escrita de la Emisión:
                          </span>
                          <p className="text-slate-100 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-900/90 p-3.5 rounded-lg border border-emerald-500/30 text-emerald-100/90 shadow-inner">
                            "{tuningResult.message}"
                          </p>
                        </div>

                        {/* Elementos Dinámicos del Vacío: Coordenadas, Cántico y Glifos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {/* Coordenadas Estelares Erráticas */}
                          {tuningResult.erraticCoordinates && (
                            <div className="bg-slate-950/90 p-3 rounded-xl border border-cyan-500/40 space-y-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 font-extrabold uppercase tracking-wider">
                                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                                <span>📍 COORDENADAS ESTELARES ERRÁTICAS:</span>
                              </div>
                              <div className="bg-slate-900/90 p-2 rounded border border-cyan-900/60 font-mono text-xs text-cyan-200 select-all font-semibold flex items-center justify-between gap-2">
                                <span className="truncate">{tuningResult.erraticCoordinates}</span>
                                <span className="text-[9px] text-cyan-400/80 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800 shrink-0">VECTOR</span>
                              </div>
                            </div>
                          )}

                          {/* Fragmento de Canción / Cántico Ancestral */}
                          {tuningResult.ancientSongFragment && (
                            <div className="bg-slate-950/90 p-3 rounded-xl border border-amber-500/40 space-y-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-extrabold uppercase tracking-wider">
                                <Music className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                                <span>🎼 CÁNTICO ANCESTRAL DEL VACÍO:</span>
                              </div>
                              <p className="bg-slate-900/90 p-2 rounded border border-amber-900/60 font-sans text-xs italic text-amber-100/90 font-medium leading-relaxed">
                                {tuningResult.ancientSongFragment}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Glifos Dimensionales y Firma del Vacío */}
                        {((tuningResult.dimensionalGlyphs && tuningResult.dimensionalGlyphs.length > 0) || (tuningResult.astralGlyphs && tuningResult.astralGlyphs.length > 0)) && (
                          <div className="bg-gradient-to-r from-purple-950/90 via-slate-950 to-indigo-950/90 p-3 rounded-xl border-2 border-purple-400/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            <span className="text-[10px] font-mono text-purple-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                              <span>🔣 GLIFOS Y SÍMBOLOS DIMENSIONALES:</span>
                            </span>
                            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-purple-500/40 text-base sm:text-lg">
                              {(tuningResult.dimensionalGlyphs || tuningResult.astralGlyphs || []).map((glyph, i) => (
                                <span key={i} className="hover:scale-130 transition-transform cursor-pointer animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" title="Glifo dimensional">
                                  {glyph}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Análisis espectral */}
                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 text-[11px] font-mono text-emerald-400/80">
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-1">
                          Diagnóstico Técnico del Espectro
                        </span>
                        {tuningResult.spectralAnalysis}
                      </div>

                      {/* Botón Destacado para Responder a la Entidad Directamente */}
                      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 p-4 rounded-xl border-2 border-emerald-400/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-bounce-short">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                            <Send className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span>¿DESEAS RESPONDER O ENVIAR UN MENSAJE A {tuningResult.entity.toUpperCase()}?</span>
                          </span>
                          <p className="text-[11px] text-slate-300 font-sans">
                            Haz clic aquí para abrir el Canal Transmisor y emitir tu respuesta en esta frecuencia.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("transmisor");
                            setTransmissionMessage(`Saludos ${tuningResult.entity}, he recibido tu señal en ${frequencyValue} ${frequencyUnit}. Mi mensaje para ti es: `);
                            setTimeout(() => {
                              document.getElementById("quantum-transmitter-panel")?.scrollIntoView({ behavior: "smooth" });
                            }, 50);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider font-mono cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-200 shrink-0"
                        >
                          <Send className="w-4 h-4 text-slate-950" />
                          <span>💬 RESPONDER AHORA</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO DEL TRANSMISOR */}
              {activeTab === "transmisor" && (
                <div id="quantum-transmitter-panel" className="space-y-4 animate-fade-in scroll-mt-24">

                  {/* Encabezado Destacado y Titilante de Canal Transmisor */}
                  <div className="bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 border-2 border-emerald-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        <Radio className="w-5 h-5 text-emerald-300 animate-ping" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black tracking-widest text-emerald-300 uppercase drop-shadow-[0_0_14px_rgba(16,185,129,1)] flex items-center gap-2">
                          💬 CANAL TRANSMISOR DE MENSAJES
                        </h3>
                        <p className="text-[11px] text-slate-300 font-sans">
                          Emisión activa de señales de audio por voz o texto hacia la frecuencia sintonizada.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-950 bg-emerald-400 font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse shrink-0">
                      📡 EMISIÓN DIRECTA LISTA
                    </span>
                  </div>

                  {/* Banner Destacado de Mensaje Grabado por Voz Listo para Transmitir */}
                  {!isRecording && transmissionMessage.trim() && (
                    <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-2 border-emerald-400 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                          <Mic className="w-5 h-5 text-emerald-300 animate-bounce" />
                        </div>
                        <div>
                          <span className="text-xs font-black font-mono text-emerald-300 uppercase tracking-wider block">
                            ✨ MENSAJE GRABADO POR VOZ LISTO PARA ENVIAR
                          </span>
                          <p className="text-xs text-slate-200 font-sans italic line-clamp-2">
                            "{transmissionMessage}"
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTransmit}
                        disabled={isTransmitting || isTuning}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.7)] cursor-pointer flex items-center justify-center gap-2 border border-emerald-100 shrink-0"
                      >
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>🚀 TRANSMITIR AHORA</span>
                      </button>
                    </div>
                  )}

                  {/* Panel Destacado de Transmisión por Voz Directa */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                          TRANSMISIÓN DIRECTA POR VOZ (MICRÓFONO)
                        </span>
                        <p className="text-[11px] text-slate-300 font-sans font-medium">
                          Habla por tu micrófono para dictar y emitir tu voz al vacío cuántico.
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                        isRecording 
                          ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {isRecording ? "🔴 GRABANDO VOZ" : "🎙️ LISTO PARA HABLAR"}
                      </span>
                    </div>

                    {/* Botón Principal Prominente para Hablar por Voz y Transmitir Instantáneamente */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isRecording) {
                            stopVoiceModulation(true);
                          } else {
                            startVoiceModulation();
                          }
                        }}
                        className={`py-3.5 px-4 rounded-xl font-black text-xs md:text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-lg ${
                          isRecording
                            ? "bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse"
                            : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 border-2 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-5 h-5 text-white animate-spin" />
                            <span>🛑 DETENER Y TRANSMITIR AHORA</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5 text-slate-950 animate-bounce" />
                            <span>🎙️ HABLAR POR VOZ Y ENVIAR</span>
                          </>
                        )}
                      </button>

                      {/* Botón para Transmitir la Voz Dictada Directamente */}
                      <button
                        type="button"
                        onClick={handleTransmit}
                        disabled={isTransmitting}
                        className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-500 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs md:text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className={`w-4 h-4 text-slate-950 ${isTransmitting ? "animate-bounce" : ""}`} />
                        <span>{isRecording ? "⚡ TRANSMITIR INSTANTÁNEAMENTE" : "🚀 ENVIAR MENSAJE AL VACÍO"}</span>
                      </button>
                    </div>

                    {/* Estado y Espectrómetro Vocal Activo */}
                    {isRecording && (
                      <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-2.5 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                            CAPTURANDO Y TRANSCRIBIENDO TU VOZ...
                          </span>
                          <span className="text-amber-400 font-bold">{Math.round(voiceVolume)} dBm | {vocalFrequency} Hz</span>
                        </div>

                        {/* Visualizador de Onda Vocal */}
                        <div className="flex items-end justify-between gap-1 h-10 bg-slate-900 rounded-lg border border-slate-800 p-2">
                          {[...Array(16)].map((_, idx) => {
                            const dynamicHeight = Math.max(
                              12,
                              Math.min(
                                100,
                                voiceVolume * (1.2 + Math.sin((Date.now() + idx * 200) / 150)) * 1.8
                              )
                            );
                            return (
                              <div
                                key={idx}
                                style={{ height: `${dynamicHeight}%` }}
                                className={`w-2 rounded-t transition-all duration-75 ${
                                  voiceVolume > 8 
                                    ? "bg-gradient-to-t from-emerald-600 to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                    : "bg-slate-800"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Consultas Sugeridas Rápidas en 1-Clic */}
                    <div className="space-y-2 p-3 bg-slate-950/90 rounded-xl border border-indigo-500/40 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          ⚡ MENSAJES PREDEFINIDOS RÁPIDOS (HAZ CLIC PARA CARGAR):
                        </span>
                        <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700 font-bold">
                          1-Clic
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTransmissionMessage(`¿Cómo es vuestra existencia en la dimensión ${dimension}? ¿Cómo vivís, qué coméis o cómo es vuestra sociedad?`);
                            addToast("PLANTILLA CARGADA", "Presiona ENTER o el botón verde para transmitir.", "high-intensity");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 text-[11px] text-slate-200 hover:text-indigo-200 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>✨ ¿Cómo vivís en vuestra dimensión?</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTransmissionMessage("¿Cómo nos veis a los seres humanos desde vuestra perspectiva interdimensional?");
                            addToast("PLANTILLA CARGADA", "Presiona ENTER o el botón verde para transmitir.", "high-intensity");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 text-[11px] text-slate-200 hover:text-indigo-200 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>👁️ ¿Cómo nos veis a los humanos?</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTransmissionMessage("¿Cuándo y cómo será nuestro encuentro o contacto directo cara a cara con vuestra especie?");
                            addToast("PLANTILLA CARGADA", "Presiona ENTER o el botón verde para transmitir.", "high-intensity");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/80 border border-indigo-500/40 hover:border-indigo-400 text-[11px] text-slate-200 hover:text-indigo-200 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>🛸 ¿Cuándo nos encontraremos?</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTransmissionMessage("¿Qué nos sugerís a los humanos para evolucionar nuestra conciencia y cuidar nuestro planeta?");
                            addToast("PLANTILLA CARGADA", "Presiona ENTER o el botón verde para transmitir.", "high-intensity");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-[11px] text-slate-200 hover:text-emerald-200 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>💡 ¿Qué nos sugerís?</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTransmissionMessage(`¿Poseéis cuerpo físico o alimentos en el plano ${dimension}, o cómo existís en luz y energía pura?`);
                            addToast("PLANTILLA CARGADA", "Presiona ENTER o el botón verde para transmitir.", "high-intensity");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-[11px] text-slate-200 hover:text-emerald-200 font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>🪐 ¿Tienen cuerpo o materia?</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Edición manual de texto transcrito / Caja de Mensaje Principal */}
                  <div className="space-y-2 pt-1 p-4 rounded-2xl bg-slate-950/90 border-2 border-emerald-500/40 shadow-xl">
                    <div className="flex justify-between items-center">
                      <label htmlFor="transmission-textarea" className="text-xs text-emerald-300 font-bold block flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>INGRESAR Y ESCRIBIR TU MENSAJE PARA EMITIR:</span>
                      </label>
                      {transmissionMessage.trim() && (
                        <button
                          type="button"
                          onClick={() => setTransmissionMessage("")}
                          className="text-[10px] text-slate-400 hover:text-red-400 underline font-mono"
                        >
                          Limpiar mensaje
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <textarea
                        id="transmission-textarea"
                        value={transmissionMessage}
                        onChange={(e) => setTransmissionMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isTransmitting) {
                              handleTransmit();
                            }
                          }
                        }}
                        placeholder="Escribe o ingresa tu mensaje aquí... (Presiona ENTER para enviar directamente)"
                        rows={4}
                        className="w-full bg-slate-900/90 border-2 border-slate-700 focus:border-emerald-400 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-mono shadow-inner leading-relaxed"
                      />

                      <div className="absolute right-3 bottom-3 flex items-center gap-2 pointer-events-none">
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {transmissionMessage.length} caracteres
                        </span>
                      </div>
                    </div>
                    
                    {/* Indicación de tecla ENTER y Botón de envío gigante */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="text-[10px] font-mono text-emerald-300/80 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">⌨️ ENTER ↵</span>
                        <span>Presiona Enter para ingresar y transmitir</span>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleResetApp}
                          className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-bold text-xs uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
                          title="Reiniciar transmisión y desbloquear canal"
                        >
                          <RefreshCw className="w-4 h-4 text-rose-400" />
                          <span>REINICIAR</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleTransmit}
                          disabled={isTransmitting}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(16,185,129,0.8)] border border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          <Send className={`w-4 h-4 text-slate-950 ${isTransmitting ? "animate-bounce" : ""}`} />
                          <span>{isRecording ? "🚀 ENVIAR MENSAJE DE VOZ" : "🚀 INGRESAR Y TRANSMITIR (ENTER ↵)"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isTransmitting && (
                    <TransmissionWaveVisualizer
                      label="SINTONIZAR PLANO, AGUARDAR Y ESCUCHAR"
                      sublabel={`Retransmitiendo ondas de radiofrecuencia a ${frequencyValue} ${frequencyUnit} hacia la dimensión ${dimension}`}
                      frequency={frequencyValue}
                      unit={frequencyUnit}
                      dimension={dimension}
                      mode="transmitting"
                      isDiagnosticMode={isDiagnosticMode}
                      onToggleDiagnosticMode={toggleDiagnosticMode}
                    />
                  )}

                  {transmitResult && !isTransmitting && (
                    <div className="space-y-4 animate-fade-in border-t-2 border-emerald-500/50 pt-4">
                      {transmitResult.proceduralBypass && (
                        <div className="bg-amber-500/15 border border-amber-500/20 rounded-lg p-2.5 text-[10px] font-mono text-amber-300/90 leading-normal flex items-center gap-2">
                          <span className="animate-ping w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>
                            <strong>🛰️ ACOPLAMIENTO DE COBERTURA REMOTA LÍMITE (BYPASS LOCAL)</strong>: El enlace directo de satélites estelares está saturado (Límite de API alcanzado). Iniciando matriz de retorno procedimental para continuar transmisiones de forma local y offline.
                          </span>
                        </div>
                      )}

                      {/* Banner de Confirmación de Envío y Recepción */}
                      <div className="bg-emerald-950/90 border-2 border-emerald-400 p-4 rounded-2xl space-y-3 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                            <div>
                              <span className="text-xs font-mono font-black text-emerald-200 uppercase tracking-wider block">
                                🚀 ESTADO: MENSAJE ENVIADO Y PROPAGADO
                              </span>
                              <span className="text-[10px] text-emerald-300 font-sans">
                                Transmitido al plano <strong className="underline">{dimension}</strong> ({frequencyValue} {frequencyUnit})
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 uppercase shadow-sm">
                            {transmitResult.sentStatus === "transmitted" ? "✅ ENVIADO Y ENTREGADO" :
                             transmitResult.sentStatus === "intercepted" ? "⚠️ ENVIADO (INTERCEPTADO)" :
                             transmitResult.sentStatus === "refracted" ? "🔄 ENVIADO (REFRACTADO)" :
                             "✅ ENVIADO"}
                          </span>
                        </div>

                        {/* Tu mensaje transmitido */}
                        {lastTransmittedMessage && (
                          <div className="bg-slate-950/90 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                            <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Send className="w-3.5 h-3.5 text-emerald-400" />
                              📤 MENSAJE ENVIADO POR TI (VOZ / TEXTO):
                            </span>
                            <p className="text-slate-100 font-mono text-xs italic bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                              "{lastTransmittedMessage}"
                            </p>
                          </div>
                        )}

                        {/* Respuesta o eco recibido de la dimensión en forma oral */}
                        <div className="bg-gradient-to-br from-slate-950 via-emerald-950/80 to-slate-950 p-5 rounded-xl border-2 border-emerald-400 space-y-4 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-emerald-500/40 pb-3">
                            <div>
                              <span className="text-sm font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                💬 RESPUESTA Y REVELACIÓN DE LA DIMENSIÓN {dimension}:
                              </span>
                              <span className="text-xs text-emerald-300 font-sans block mt-0.5">
                                Mensaje decodificado en lenguaje claro para ti
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (isSpeaking) {
                                  stopAllSpeech();
                                } else {
                                  const targetEntityName = activePresetId
                                    ? DIMENSION_PRESETS.find((p) => p.id === activePresetId)?.name
                                    : "Entidad";
                                  speakEntityOralMessage(targetEntityName || "Entidad", transmitResult.reaction, dimension);
                                }
                              }}
                              className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 shadow-lg ${
                                isSpeaking
                                  ? "bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse"
                                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105"
                              }`}
                            >
                              {isSpeaking ? (
                                <>
                                  <Square className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  <span>PAUSAR VOZ</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                  <span>🔊 ESCUCHAR MENSAJE EN VOZ ALTA</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* REVELACIÓN PRINCIPAL CONCRETA EN TEXTO DESTACADO */}
                          <div className="bg-slate-900/95 p-4 sm:p-5 rounded-xl border border-emerald-500/40 text-slate-100 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-inner">
                            {transmitResult.reaction}
                          </div>

                          {/* TARJETA DE CONSEJO Y REVELACIÓN DIRECTA */}
                          {transmitResult.guidance && (
                            <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-emerald-950/90 border-2 border-amber-400/80 p-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-start gap-3">
                              <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                              <div className="space-y-1">
                                <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-widest block">
                                  💡 REVELACIÓN / CONSEJO CLAVE PARA TU CONSULTA:
                                </span>
                                <p className="text-amber-100 font-sans text-sm font-semibold leading-normal">
                                  "{transmitResult.guidance}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Arquetipo Cósmico si está disponible */}
                          {transmitResult.oracleCard && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-3.5 py-1.5 rounded-lg border border-emerald-400/50 shadow-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                ARQUETIPO: {transmitResult.oracleCard}
                              </span>
                            </div>
                          )}

                          {/* SECCIÓN DESPLEGABLE DE DATOS TÉCNICOS Y COORDENADAS (OPCIONAL PARA NO SATURAR) */}
                          <details className="group border border-slate-800 rounded-xl bg-slate-950/60 transition-all">
                            <summary className="px-4 py-2.5 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-between font-bold select-none">
                              <span>🔍 MÁSTRAR DATOS TÉCNICOS Y COORDENADAS DE FRECUENCIA</span>
                              <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="p-4 space-y-3 border-t border-slate-800/80">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {/* Coordenadas Estelares Erráticas */}
                                {transmitResult.erraticCoordinates && (
                                  <div className="bg-slate-950/90 p-3 rounded-xl border border-cyan-500/40 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 font-extrabold uppercase tracking-wider">
                                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>📍 VECTOR DE SINTONÍA:</span>
                                    </div>
                                    <div className="bg-slate-900/90 p-2 rounded border border-cyan-900/60 font-mono text-xs text-cyan-200 select-all font-semibold">
                                      {transmitResult.erraticCoordinates}
                                    </div>
                                  </div>
                                )}

                                {/* Fragmento de Cántico */}
                                {transmitResult.ancientSongFragment && (
                                  <div className="bg-slate-950/90 p-3 rounded-xl border border-amber-500/40 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-extrabold uppercase tracking-wider">
                                      <Music className="w-3.5 h-3.5 text-amber-400" />
                                      <span>🎼 RESONANCIA DE FRECUENCIA:</span>
                                    </div>
                                    <p className="bg-slate-900/90 p-2 rounded border border-amber-900/60 font-sans text-xs italic text-amber-100/90 font-medium">
                                      {transmitResult.ancientSongFragment}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Glifos Dimensionales */}
                              {((transmitResult.dimensionalGlyphs && transmitResult.dimensionalGlyphs.length > 0) || (transmitResult.astralGlyphs && transmitResult.astralGlyphs.length > 0)) && (
                                <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/40 flex items-center justify-between gap-2.5">
                                  <span className="text-[10px] font-mono text-purple-300 font-black uppercase">
                                    🔣 FIRMA DE SIMBOLOS:
                                  </span>
                                  <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded-lg border border-purple-500/40 text-base">
                                    {(transmitResult.dimensionalGlyphs || transmitResult.astralGlyphs || []).map((glyph, i) => (
                                      <span key={i}>{glyph}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-400">
                          <span>Acoplamiento Transmisor: <strong className="text-emerald-400">{transmitResult.resonance}%</strong></span>
                          <span>Estado de Propagación: <strong className="text-emerald-400 uppercase">{transmitResult.sentStatus}</strong></span>
                        </div>
                      </div>

                      {transmitResult.spectralAnalysis && (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-[11px] font-mono text-emerald-400/80">
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-1">
                            Análisis del Frente de Onda Emitido
                          </span>
                          {transmitResult.spectralAnalysis}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    )}

    {/* PESTAÑA 2: MAPA ESTELAR Y TELEMETRÍA */}
    {(activeMainTab === "station" || activeMainTab === "telemetry" || activeMainTab === "all") && (
      <div className="space-y-6 animate-fade-in">
        {(activeMainTab === "all" || activeMainTab === "station") && (
          <div className="flex items-center gap-2 border-b border-indigo-500/30 pb-2 pt-4">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-indigo-300 font-mono uppercase tracking-wider">
              SECCIÓN 2: Mapa Estelar Interactivo y Telemetría Multidimensional
            </h2>
          </div>
        )}

        <div className="space-y-6">
          {/* Panel de Estado de la Membrana Quantum */}
          <MembraneStatusPanel
            logs={logs}
            currentDimension={dimension}
            onSelectDimension={handleSelectPreset}
          />

          {/* Mapa Estelar Interactivo de Dimensiones (Canvas & D3) */}
          <StarMapVisualizer
            logs={logs}
            currentDimension={dimension}
            tuningResult={tuningResult}
            onSelectDimension={handleSelectPreset}
            frequencyValue={frequencyValue}
            frequencyUnit={frequencyUnit}
            isLowPowerMode={isLowPowerMode}
          />

          {/* Historial de Resonancia Temporal */}
          <TelemetryChart logs={logs} />
        </div>
      </div>
    )}

    {/* PESTAÑA 3: DIRECTORIO Y BITÁCORA */}
    {(activeMainTab === "directory" || activeMainTab === "all") && (
      <div className="space-y-6 animate-fade-in">
        {activeMainTab === "all" && (
          <div className="flex items-center gap-2 border-b border-amber-500/30 pb-2 pt-4">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-300 font-mono uppercase tracking-wider">
              SECCIÓN 3: Directorio de Señales Conocidas y Bitácora de Registro
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Directorio de señales conocidas (5 de 12) */}
          <div className="lg:col-span-5">
            <DirectoryList
              onSelectPreset={handleSelectPreset}
              activePresetId={activePresetId}
            />
          </div>

          {/* Registro local de sintonizaciones (7 de 12) */}
          <div className="lg:col-span-7">
            <LogTable logs={logs} onClearLogs={handleClearLogs} onUpdateLogs={handleUpdateLogs} />
          </div>
        </div>
      </div>
    )}

    {/* PESTAÑA 4: AJUSTES Y HERRAMIENTAS */}
    {(activeMainTab === "settings" || activeMainTab === "all") && (
      <div className="space-y-6 animate-fade-in">
        {activeMainTab === "all" && (
          <div className="flex items-center gap-2 border-b border-cyan-500/30 pb-2 pt-4">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider">
              SECCIÓN 4: Ajustes de Sistema, Alertas Nativas y Herramientas
            </h2>
          </div>
        )}

        <div className="space-y-6">
          {/* Tarjetas de Optimización: Modo de Bajo Consumo, Modo Inmersión, Modo Glitch & Modo Diagnóstico */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tarjeta 1: Modo de Bajo Consumo */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isLowPowerMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-slate-800 text-slate-400"}`}>
                    <Battery className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Modo Ahorro de Batería
                    </h3>
                    <p className="text-[10px] text-slate-400">Haz clic aquí si quieres ahorrar batería</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleLowPowerMode}
                  title="Haz clic aquí si quieres ahorrar batería"
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    isLowPowerMode
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {isLowPowerMode ? "ACTIVADO (10 FPS)" : "DESACTIVADO"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Reduce la tasa de refresco del osciloscopio y del mapa estelar de 24/30 FPS a <strong className="text-amber-300 font-mono">10 FPS</strong>. Desactiva animaciones secundarias para prolongar significativamente la autonomía de la batería en ordenadores portátiles y móviles.
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span>ESTADO: <strong className={isLowPowerMode ? "text-amber-400" : "text-emerald-400"}>{isLowPowerMode ? "AHORRO ENERGÉTICO ACTIVO" : "RENDIMIENTO COMPLETO"}</strong></span>
                <span>FPS LÍMITE: {isLowPowerMode ? "10 FPS" : "30 FPS"}</span>
              </div>
            </div>

            {/* Tarjeta 2: Modo de Inmersión Visual */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/40">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Modo de Inmersión Visual
                    </h3>
                    <p className="text-[10px] text-slate-400">HUD Expandido a Pantalla Completa</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImmersionMode(true)}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ACTIVAR</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Oculta la cabecera principal, las pestañas de navegación y los paneles secundarios para maximizar el área de trabajo. Muestra el Osciloscopio Cuántico y el Mapa Estelar en un lienzo HUD de alta visibilidad.
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span>TECLA DE SALIDA RÁPIDA: <strong className="text-violet-300">[Esc]</strong></span>
                <span>HUD EXPANDIDO: LISTO</span>
              </div>
            </div>

            {/* Tarjeta 3: Modo Glitch / Sintonización Inestable (Aberración Cromática) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isGlitchMode ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-slate-800 text-slate-400"}`}>
                    <Zap className={`w-5 h-5 ${isGlitchMode ? "animate-bounce" : ""}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Modo Glitch & Aberración
                    </h3>
                    <p className="text-[10px] text-slate-400">Filtro de Sintonización Inestable</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleGlitchMode}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    isGlitchMode
                      ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {isGlitchMode ? "ACTIVADO ⚡" : "DESACTIVADO"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Aplica un filtro CSS dinámico de <strong className="text-cyan-300 font-mono">aberración cromática aleatoria</strong>, desfase de canales RGB y micro-micro-interferencias estelares sobre toda la aplicación, simulando una sintonización transdimensional inestable.
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span>FILTRO: <strong className={isGlitchMode ? "text-cyan-400" : "text-slate-400"}>{isGlitchMode ? "ABERRACIÓN RGB + SCANLINES" : "NOMINAL"}</strong></span>
                <span>ESTADO: <strong className={isGlitchMode ? "text-fuchsia-400 animate-pulse" : "text-emerald-400"}>{isGlitchMode ? "SINTONIZACIÓN INESTABLE" : "ESTABLE"}</strong></span>
              </div>
            </div>

            {/* Tarjeta 4: Modo Diagnóstico FFT (Analizador de Audio & Buffer Data) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isDiagnosticMode ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-slate-800 text-slate-400"}`}>
                    <Cpu className={`w-5 h-5 ${isDiagnosticMode ? "animate-spin" : ""}`} />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      Modo Diagnóstico FFT
                    </h3>
                    <p className="text-[10px] text-slate-400">Analizador y Buffer Data</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleDiagnosticMode}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                    isDiagnosticMode
                      ? "bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {isDiagnosticMode ? "ACTIVADO 🔬" : "DESACTIVADO"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Superpone en tiempo real el <strong className="text-cyan-300 font-mono">buffer de datos del analizador de audio (fftSize)</strong>, espectro de barras de frecuencia y telemetría de bytes sobre el visualizador de señal actual.
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span>ANALIZADOR: <strong className={isDiagnosticMode ? "text-cyan-400" : "text-slate-400"}>{isDiagnosticMode ? "SUPERPOSICIÓN EN TIEMPO REAL" : "ESTÁNDAR"}</strong></span>
                <span>ESTADO: <strong className={isDiagnosticMode ? "text-cyan-300 animate-pulse" : "text-emerald-400"}>{isDiagnosticMode ? "TELEMETRÍA FFT" : "ACTIVO"}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
      </main>

      {/* Footer global con el Panel de Colaboración y Aporte constante */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-[10px] text-slate-500 font-mono mt-12 space-y-6">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {/* Panel de Aporte o Colaboración al Sitio (Siempre visible en el Pie de Página) */}
          <FundingWidget visitsCount={visits} />

          <div className="border-t border-slate-900/80 pt-4 space-y-1 text-slate-500">
            <p>MODULADOR CUÁNTICO ANTENA INTERDIMENSIONAL — CLOUD COMPILING ACTIVATED</p>
            <p>BITÁCORA LOCAL TRANSDIMENSIONAL — ALMACENAMIENTO SEGURO Y OPERATIVIDAD 100% INDEPENDIENTE</p>
          </div>
        </div>
      </footer>

      {/* VISTA EN MODO DE INMERSIÓN TOTAL (PANTALLA COMPLETA HUD) */}
      {isImmersionMode && (
        <div className="fixed inset-0 z-[9990] bg-slate-950 text-slate-100 flex flex-col overflow-y-auto p-3 md:p-6 space-y-6 animate-fade-in font-sans">
          {/* BARRA SUPERIOR HUD FLOTANTE */}
          <div className="bg-slate-900/95 border border-violet-500/50 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/40 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-950 px-2 py-0.5 rounded border border-violet-800 uppercase tracking-widest">
                    MODO INMERSIÓN TOTAL
                  </span>
                  {isLowPowerMode && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      10 FPS (BAJO CONSUMO)
                    </span>
                  )}
                </div>
                <h2 className="text-xs sm:text-sm font-bold font-mono text-slate-100 uppercase tracking-wider mt-0.5">
                  CONSOLA CUÁNTICA EXPANDIDA
                </h2>
              </div>
            </div>

            {/* CONTROLES RÁPIDOS CENTRALES */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px]">VECTOR:</span>
                <span className="text-cyan-300 font-bold truncate max-w-[140px]">{dimension}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px]">FREQ:</span>
                <span className="text-emerald-400 font-bold">{frequencyValue} {frequencyUnit}</span>
              </div>

              <button
                type="button"
                onClick={handleTune}
                disabled={isTuning || isTransmitting}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  isTuning
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-400"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                }`}
              >
                {isTuning ? (
                  <>
                    <CircularProgressRing
                      progress={tuningProgress}
                      size={20}
                      strokeWidth={2.5}
                      colorClass="text-emerald-400"
                      labelColorClass="text-emerald-300 font-bold text-[7px]"
                    />
                    <span>SINTONIZANDO ({Math.min(99, Math.round(tuningProgress))}%)</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                    <span>📻 SINTONIZAR</span>
                  </>
                )}
              </button>
            </div>

            {/* BOTONES DE CONTROL DERECHA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleGlitchMode}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isGlitchMode
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
                title="Activa el Modo Glitch con aberración cromática dinámicos"
              >
                <Zap className={`w-4 h-4 ${isGlitchMode ? "text-cyan-300 animate-bounce" : "text-slate-400"}`} />
                <span className="hidden sm:inline">{isGlitchMode ? "Glitch: ON ⚡" : "Glitch: OFF"}</span>
              </button>

              <button
                type="button"
                onClick={toggleLowPowerMode}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isLowPowerMode
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
                title="Haz clic aquí si quieres ahorrar batería"
              >
                <Battery className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">{isLowPowerMode ? "Ahorro: ON" : "Ahorro: OFF"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImmersionMode(false)}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                title="Presiona Esc para salir de inmersión"
              >
                <Minimize2 className="w-4 h-4" />
                <span>SALIR (Esc)</span>
              </button>
            </div>
          </div>

          {/* GRID INMERSIVO: OSCILOSCOPIO + MAPA ESTELAR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* IZQUIERDA: OSCILOSCOPIO EN TIEMPO REAL */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                      OSCILOSCOPIO CUÁNTICO
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    SINTONIZACIÓN CONTINUA
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 shadow-inner">
                  <SignalVisualizer
                    frequency={frequencyValue}
                    unit={frequencyUnit}
                    intensity={intensity}
                    useGaussianFilter={useGaussianFilter}
                    isLowPowerMode={isLowPowerMode}
                    status={
                      isTuning
                        ? "noise"
                        : tuningResult
                        ? tuningResult.status
                        : transmitResult
                        ? "success"
                        : "idle"
                    }
                  />
                </div>
              </div>
            </div>

            {/* DERECHA: MAPA ESTELAR INTERACTIVO */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                      MAPA ESTELAR CELESTE 2D
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    CANVAS D3 & NODOS
                  </span>
                </div>

                <StarMapVisualizer
                  logs={logs}
                  currentDimension={dimension}
                  tuningResult={tuningResult}
                  onSelectDimension={handleSelectPreset}
                  frequencyValue={frequencyValue}
                  frequencyUnit={frequencyUnit}
                  isLowPowerMode={isLowPowerMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sistema de Notificaciones Flotantes (Toasts) */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full p-4 md:p-0 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-4 rounded-xl border backdrop-blur-lg shadow-2xl flex gap-3.5 items-start transition-all duration-300 animate-fade-in ${
              toast.type === "anomaly"
                ? "bg-slate-950/95 border-red-500/40 text-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.15)]"
                : "bg-slate-950/95 border-amber-500/40 text-amber-100 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              toast.type === "anomaly" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
            }`}>
              {toast.type === "anomaly" ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <Flame className="w-5 h-5" />
              )}
            </div>
            
            <div className="flex-grow space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold font-sans uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${toast.type === "anomaly" ? "bg-red-500 animate-ping" : "bg-amber-500 animate-pulse"}`} />
                  {toast.title}
                </span>
                <span className="text-[8px] font-mono text-slate-500">
                  {toast.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
              title="Descartar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal del Perfil Visual de la Entidad */}
      {isEntityModalOpen && entityImageToView && (
        <div 
          id="entity-visualizer-modal"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-200"
          onClick={() => setIsEntityModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] relative animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/60">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  PERFIL VISUAL CAPTADO
                </span>
                <h3 className="text-xs font-bold text-slate-100 font-sans tracking-wide uppercase truncate max-w-[200px]">
                  {entityNameToView || "Entidad Desconocida"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEntityModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-850 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contenido / Imagen de la Entidad */}
            <div className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-800/60 bg-slate-950 aspect-square group shadow-inner">
                {/* Scanlines effect overlay */}
                <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none z-10" />
                <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_40%,rgba(2,6,23,0.8)_100%] pointer-events-none z-10" />
                
                <img
                  src={entityImageToView}
                  alt={entityNameToView}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Ficha Técnica / Metadatos */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Coordenadas:</span>
                  <span className="text-slate-300 font-semibold">{dimension}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Frecuencia:</span>
                  <span className="text-emerald-400 font-bold">{frequencyValue} {frequencyUnit}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-900/60">
                  <span className="text-slate-500">Nivel de Resonancia:</span>
                  <span className="text-indigo-400 font-bold">{tuningResult?.resonance}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tipo de Onda:</span>
                  <span className="text-slate-400">Coaxial Armónica</span>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-950/30 border-t border-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEntityModalOpen(false)}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer"
              >
                AUTORIZAR Y ARCHIVAR
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pestaña Flotante de Alta Visibilidad a la Derecha para Elegir Antenas */}
      <div className="fixed right-0 top-1/3 z-50 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsAntennaModalOpen(true)}
          className="group bg-gradient-to-l from-emerald-600 via-slate-900 to-slate-950 text-emerald-300 hover:text-emerald-100 border-l-2 border-y border-emerald-400/80 rounded-l-2xl p-3 pr-4 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] transition-all duration-300 flex items-center gap-2.5 cursor-pointer font-mono text-xs font-bold backdrop-blur-md"
          title="Haz clic para abrir la pestaña de selección de Antenas"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/60 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>

          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              ELEGIR ANTENA
            </span>
            <span className="text-[10px] text-amber-300 font-bold max-w-[120px] truncate leading-tight">
              {antennaType.split(" ")[0]} {antennaType.split(" ")[1]}
            </span>
          </div>

          <ChevronLeft className="w-4 h-4 text-emerald-300 group-hover:-translate-x-1 transition-transform ml-1" />
        </button>
      </div>

      {/* Modal / Selector Completo de Antenas */}
      <AntennaSelectorModal
        isOpen={isAntennaModalOpen}
        onClose={() => setIsAntennaModalOpen(false)}
        selectedAntenna={antennaType}
        onSelectAntenna={(newAntenna) => {
          handleAntennaSelectAndTune(newAntenna);
        }}
        onTuneNow={handleTune}
      />

      {/* Modal de Acceso e Identificación de Operador Local */}
      {isOperatorModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-200"
          onClick={() => setIsOperatorModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] relative animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Acceso de Operador Local
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-mono">
                    🟢 Sesión 100% Independiente y Activa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOperatorModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SISTEMA LOCAL OPERATIVO Y DESBLOQUEADO</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  No se requiere cuenta ni sincronización con Google. Tienes acceso completo e ilimitado a la antena, sintonizador, transmisor y bitácora local.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="operator-callsign" className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                    Nombre o Indicativo de Operador:
                  </label>
                  <input
                    id="operator-callsign"
                    type="text"
                    value={tempOperatorName}
                    onChange={(e) => setTempOperatorName(e.target.value)}
                    placeholder="Ej. Operador Tarotista, Comandante-01..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="operator-rank-select" className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                    Nivel de Despacho / Rango:
                  </label>
                  <select
                    id="operator-rank-select"
                    value={tempOperatorRank}
                    onChange={(e) => setTempOperatorRank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Operador Transdimensional">Operador Transdimensional</option>
                    <option value="Sintonizador Maestro">Sintonizador Maestro Cuántico</option>
                    <option value="Comandante de Frontera">Comandante de Frontera Nube</option>
                    <option value="Investigador de Frecuencias">Investigador de Frecuencias</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[9px] font-mono text-slate-500">
                Guardado instantáneo en navegador
              </span>
              <button
                type="button"
                onClick={() => {
                  const finalName = tempOperatorName.trim() || "Operador Local";
                  setOperatorName(finalName);
                  setOperatorRank(tempOperatorRank);
                  localStorage.setItem("antena_operator_name", finalName);
                  localStorage.setItem("antena_operator_rank", tempOperatorRank);
                  setIsOperatorModalOpen(false);
                  addToast(
                    "IDENTIFICACIÓN ACTUALIZADA",
                    `Sesión confirmada para ${finalName} (${tempOperatorRank}). Modo Local 100% Activo.`,
                    "high-intensity"
                  );
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono rounded-lg transition-all cursor-pointer shadow-md"
              >
                GUARDAR Y ACTIVAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visitas Reales & Configuración de Mixpanel */}
      {isMixpanelModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-200"
          onClick={() => setIsMixpanelModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] relative animate-scale-up text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
                  <BarChart3 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                    Telemetría de Visitas Reales & Mixpanel
                  </h3>
                  <p className="text-[10px] text-indigo-400 font-mono">
                    Seguimiento de tráfico y analítica en tiempo real
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMixpanelModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 space-y-5 text-xs">
              
              {/* Tarjeta de Contador de Visitas Reales Cloud */}
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      CONTADOR CLOUD GLOBAL (100% AUTOMÁTICO):
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block">
                      ⚡ Activo en Netlify y Servidor — Sin configuración ni cuentas requeridas
                    </span>
                  </div>
                  <span className="text-lg font-mono font-black text-emerald-300 bg-emerald-950 px-3 py-0.5 rounded border border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {visits.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  Cada vez que un visitante real entra a la aplicación (en Netlify o en tu dominio), el contador suma +1 automáticamente en la nube global. Deduplica recargas de pestaña para mantener estadísticas veraces y precisas.
                </p>

                {/* Sincronización / Ajuste de Visitas Acumuladas */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-2">
                  <label className="text-[10px] font-mono text-slate-300 font-bold block">
                    ⚙️ Sincronizar / Ajustar cifra inicial de visitas acumuladas:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customVisitsInput}
                      onChange={(e) => setCustomVisitsInput(e.target.value)}
                      placeholder={`Ej: ${visits || 152}`}
                      className="w-32 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseInt(customVisitsInput, 10);
                        if (isNaN(num) || num < 0) {
                          addToast("NÚMERO INVÁLIDO", "Ingresa una cifra válida mayor o igual a 0.", "anomaly");
                          return;
                        }
                        setCloudManualCount(num)
                          .then((saved) => {
                            setVisitsExplicit(saved);
                            addToast("VISITAS SINCRONIZADAS", `Contador global actualizado: ${saved}`, "high-intensity");
                            setCustomVisitsInput("");
                          })
                          .catch(() => {
                            setVisitsExplicit(num);
                            addToast("VISITAS ACTUALIZADAS", `Contador establecido: ${num}`, "high-intensity");
                          });
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded transition-colors cursor-pointer shadow"
                    >
                      Establecer Total
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      registerCloudVisit(true)
                        .then((cnt) => {
                          updateVisitsState(cnt);
                          addToast("VISITA DE PRUEBA REGISTRADA", `Nuevo total global: ${cnt}`, "high-intensity");
                        })
                        .catch(() => {
                          const fallback = visits + 1;
                          updateVisitsState(fallback);
                          addToast("VISITA REGISTRADA", `Nuevo total: ${fallback}`, "high-intensity");
                        });
                    }}
                    className="text-[10px] font-mono bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-2.5 py-1 rounded border border-emerald-700/60 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>➕ Registrar Visita de Prueba (+1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      getCloudVisits()
                        .then((cnt) => {
                          updateVisitsState(cnt);
                          addToast("SINCRONIZACIÓN EXITOSA", `Total global verificado: ${cnt}`, "high-intensity");
                        })
                        .catch(() => {
                          addToast("TELEMETRÍA LOCAL", `Visitas actuales: ${visits}`, "high-intensity");
                        });
                    }}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sincronizar con la Nube</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta de Exclusión de Mis Propias Visitas (Filtro de Desarrollador / Operador) */}
              <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                    EXCLUIR MIS PROPIAS VISITAS (MODO ADMINISTRADOR):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isExcludedOperator;
                      setOperatorExcluded(nextState);
                      setIsExcludedOperator(nextState);
                      addToast(
                        nextState ? "EXCLUSIÓN ACTIVADA" : "EXCLUSIÓN DESACTIVADA",
                        nextState
                          ? "Tus accesos ya NO incrementarán las visitas ni enviarán métricas a Mixpanel."
                          : "Tus accesos volverán a registrarse como visitas reales.",
                        "high-intensity"
                      );
                    }}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border flex items-center gap-1.5 self-start sm:self-auto ${
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
                      ✨ <strong>Filtro de Exclusión Activo en este navegador:</strong> Cuando abres o recargas la Antena, tus accesos son detectados como administrador y <strong>NO suman</strong> al contador de visitas reales ni envían eventos de navegación a tu Mixpanel.
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Tus aperturas de página se están contando como visitas reales. Haz clic en el botón superior para activar la exclusión y evitar distorsionar tus estadísticas mientras desarrollas o pruebas la aplicación.
                    </span>
                  )}
                </p>
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                  💡 <strong>Truco de Creador:</strong> Para activar la exclusión automáticamente en cualquier dispositivo o ventana de incógnito, puedes abrir la app añadiendo <code className="text-amber-300 font-bold bg-slate-950 px-1 py-0.5 rounded">?owner=true</code> al final de la URL.
                </div>
              </div>

              {/* Configuración del Token de Mixpanel & Prueba de Conectividad */}
              <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    TOKEN DEL PROYECTO DE MIXPANEL:
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isMixpanelConnected
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-amber-950 text-amber-300 border-amber-700"
                  }`}>
                    {isMixpanelConnected ? "🟢 CONECTADO" : "⚠️ PENDIENTE DE CONFIGURACIÓN"}
                  </span>
                </div>

                {/* ID de Usuario Único de Transmisión */}
                <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-indigo-950 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">DISTINCT ID DE SESIÓN:</span>
                  <span className="text-indigo-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-indigo-900">
                    {getDistinctId()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-mono block">
                    Ingresa o actualiza tu Mixpanel Project Token:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mixpanelTokenInput}
                      onChange={(e) => setMixpanelTokenInput(e.target.value)}
                      placeholder="Ej: a1b2c3d4e5f67890..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={isSavingMixpanelToken}
                      onClick={async () => {
                        setIsSavingMixpanelToken(true);
                        try {
                          const saved = await saveMixpanelToken(mixpanelTokenInput);
                          setIsMixpanelConnected(saved);
                          const logs = await fetchMixpanelLogs();
                          setMixpanelLogsList(logs);
                          if (saved) {
                            addToast("MIXPANEL CONECTADO", "Token guardado persistentemente en servidor y cliente.", "high-intensity");
                          } else {
                            addToast("TOKEN DESCONECTADO", "Se eliminó el token de Mixpanel.", "anomaly");
                          }
                        } catch (e) {
                          addToast("ERROR AL GUARDAR", "No se pudo sincronizar el token con el servidor.", "anomaly");
                        } finally {
                          setIsSavingMixpanelToken(false);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer font-mono shrink-0 shadow-md flex items-center gap-1.5"
                    >
                      {isSavingMixpanelToken ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>Guardar Token</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botón de Prueba Inmediata de Conectividad Mixpanel */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      PRUEBA DE TRANSMISIÓN EN TIEMPO REAL:
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Modo Proxy Anti-AdBlocker
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    Presiona el botón para emitir un evento instantáneo hacia Mixpanel (fuerza el envío incluso si la exclusión está activa):
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const tok = mixpanelTokenInput.trim() || getMixpanelToken();
                      if (!tok) {
                        addToast("TOKEN REQUERIDO", "Por favor ingresa primero un Token de Mixpanel válido.", "anomaly");
                        return;
                      }
                      await saveMixpanelToken(tok);
                      setIsMixpanelConnected(true);
                      await trackEvent(
                        "Prueba Manual de Conectividad",
                        {
                          timestamp: new Date().toISOString(),
                          source: "Boton de Prueba UI",
                          operador: operatorName,
                        },
                        true // Forza el envío ignorando filtro de exclusión para prueba
                      );
                      const logs = await fetchMixpanelLogs();
                      setMixpanelLogsList(logs);
                      addToast("🚀 EVENTO ENTREGADO A MIXPANEL", "Revisa la tabla de transmisiones en vivo abajo y tu panel en Mixpanel.com", "high-intensity");
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 animate-bounce" />
                    <span>🚀 EMITIR EVENTO DE PRUEBA A MIXPANEL AHORA</span>
                  </button>
                </div>

                {/* Feed de Transmisiones Servidor -> Mixpanel en Vivo */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-indigo-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      LOG DE TRANSMISIONES SERVER-TO-MIXPANEL (EN VIVO):
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchMixpanelLogs().then((l) => setMixpanelLogsList(l))}
                      className="text-[9px] font-mono text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                    >
                      🔄 Actualizar
                    </button>
                  </div>

                  {mixpanelLogsList.length === 0 ? (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center space-y-1">
                      <p className="text-[10px] font-mono text-slate-400">
                        No hay transmisiones registradas aún en esta sesión de servidor.
                      </p>
                      <p className="text-[9px] font-mono text-slate-500">
                        Presiona el botón superior o navega por la Antena para ver el flujo en vivo.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {mixpanelLogsList.map((log) => (
                        <div
                          key={log.id}
                          className="bg-slate-950 p-2 rounded border border-slate-800 text-[10px] font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-300 font-bold">{log.event}</span>
                              <span className="text-slate-500 text-[9px]">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center gap-2">
                              <span>Distinct ID: <strong className="text-slate-300">{log.distinct_id}</strong></span>
                              <span>Token: <strong className="text-slate-300">{log.token_masked}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                            {log.success ? (
                              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[8px] font-bold">
                                🟢 200 OK (Status 1)
                              </span>
                            ) : (
                              <span className="bg-red-950/80 text-red-300 border border-red-700/60 px-2 py-0.5 rounded text-[8px] font-bold">
                                🔴 Error de Entrega
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagnóstico y Guía Explicativa para ver métricas en Mixpanel.com */}
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-2 text-[11px] font-sans text-slate-300">
                  <span className="font-mono text-indigo-400 font-bold block text-[10px] uppercase tracking-wider">
                    🛠️ ¿POR QUÉ PODRÍA PARECER ESTÁTICO Y CÓMO RESOLVERLO?
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-300 leading-relaxed font-mono">
                    <li>
                      <strong className="text-amber-300">Bloqueadores de Anuncios (AdBlockers):</strong> Extensiones como uBlock o Brave suelen bloquear llamadas del cliente a <code className="text-indigo-300">mixpanel.com</code>. <em className="text-emerald-400 font-normal">Ahora nuestro servidor retransmite automáticamente los eventos por el proxy backend para evitar bloqueos.</em>
                    </li>
                    <li>
                      <strong className="text-amber-300">Servidores EU vs US:</strong> El servidor proxy retransmite a las APIs de EE.UU. y Europa simultáneamente para asegurar recepción sin importar la región de tu cuenta.
                    </li>
                    <li>
                      <strong className="text-amber-300">Ver Muestras en Vivo:</strong> En <a href="https://mixpanel.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">Mixpanel.com</a>, navega a <strong className="text-slate-100">Events / Live View</strong> para ver los eventos en vivo a medida que ocurren.
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[9px] font-mono text-slate-500">
                Guardado directo en navegador
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMixpanelModalOpen(false)}
                  className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingMixpanelToken}
                  onClick={async () => {
                    setIsSavingMixpanelToken(true);
                    try {
                      const saved = await saveMixpanelToken(mixpanelTokenInput);
                      setIsMixpanelConnected(saved);
                      if (saved) {
                        addToast("CONFIGURACIÓN GUARDADA", "Token de Mixpanel guardado y activo.", "high-intensity");
                      } else {
                        addToast("TOKEN DESCONECTADO", "Se eliminó el token de Mixpanel.", "anomaly");
                      }
                      setIsMixpanelModalOpen(false);
                    } catch (e) {
                      addToast("ERROR AL GUARDAR", "No se pudo guardar la configuración.", "anomaly");
                    } finally {
                      setIsSavingMixpanelToken(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-mono font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
                >
                  {isSavingMixpanelToken ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar y Volver al Sitio</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL BLOG DE SUGERENCIAS & IDEAS MULTIDIMENSIONALES */}
      <SuggestionsBlogModal
        isOpen={isSuggestionsModalOpen}
        onClose={() => setIsSuggestionsModalOpen(false)}
        operatorName={operatorName}
        addToast={addToast}
      />
    </div>
  );
}
