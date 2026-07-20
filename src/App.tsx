import { useState, useEffect } from "react";
import {
  Radio,
  Send,
  Sliders,
  Sparkles,
  Info,
  AlertTriangle,
  RefreshCw,
  LogOut,
  FileSpreadsheet,
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
} from "lucide-react";
import { initAuth, googleSignIn, logout } from "./firebase";
import { findOrCreateSpreadsheet } from "./sheets";
import { appendLogToSheet } from "./sheets";
import { DimensionPreset, LogEntry, SignalResponse, TransmitResponse } from "./types";
import { DIMENSION_PRESETS } from "./presets";
import { initMixpanel, trackEvent } from "./mixpanel";
import SignalVisualizer from "./components/SignalVisualizer";
import DirectoryList from "./components/DirectoryList";
import LogTable from "./components/LogTable";
import TelemetryChart from "./components/TelemetryChart";
import FundingWidget from "./components/FundingWidget";
import { User } from "firebase/auth";

interface QuantumToast {
  id: string;
  title: string;
  message: string;
  type: "anomaly" | "high-intensity";
  timestamp: Date;
}

export default function App() {
  // Auth and Google Sheets States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isSyncingSpreadsheet, setIsSyncingSpreadsheet] = useState(false);

  // Microphone and Voice Modulation States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [vocalFrequency, setVocalFrequency] = useState<number>(0);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // Antenna Tuning States
  const [frequencyValue, setFrequencyValue] = useState<number>(432);
  const [frequencyUnit, setFrequencyUnit] = useState<"Hz" | "kHz" | "MHz" | "GHz" | "THz" | "QHz">("Hz");
  const [dimension, setDimension] = useState<string>("D-11 // VECTOR-NULL");
  const [intensity, setIntensity] = useState<number>(80);
  const [antennaType, setAntennaType] = useState<string>("Lazo Escalar (Escudo Magnético)");
  const [activePresetId, setActivePresetId] = useState<string | null>("whisper-void");

  // Flow and API States
  const [activeTab, setActiveTab] = useState<"receptor" | "transmisor">("receptor");
  const [isTuning, setIsTuning] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [tuningResult, setTuningResult] = useState<SignalResponse | null>(null);
  const [transmitResult, setTransmitResult] = useState<TransmitResponse | null>(null);
  const [transmissionMessage, setTransmissionMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Escaneo Continuo States
  const [isScanning, setIsScanning] = useState(false);
  const [scanSecondsLeft, setScanSecondsLeft] = useState(15);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Voice Reader state (Speech Synthesis)
  const [isVoiceReaderEnabled, setIsVoiceReaderEnabled] = useState(true);
  const [voiceTone, setVoiceTone] = useState<"solemne-hombre" | "latino-neutro" | "estandar">("solemne-hombre");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  // Visitas State
  const [visits, setVisits] = useState<number>(0);

  // Web Notifications Permission state
  const [notificationPermission, setNotificationPermission] = useState<"default" | "granted" | "denied">("default");

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
        "Su navegador o el contenedor de iframe no admite la API de Notificaciones Web.",
        "anomaly"
      );
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        new Notification("Sintonizador Cuántico", {
          body: "¡Notificaciones de escritorio del sistema activadas correctamente!",
          icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📡</text></svg>",
        });
      }
    } catch (err) {
      console.warn("Error al solicitar permisos de notificación:", err);
    }
  };

  // Enviar una notificación web nativa
  const sendWebNotification = (title: string, body: string, type: "anomaly" | "high-intensity") => {
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

  // Speech Synthesis helper to speak summary of findings
  const speakSignalSummary = (data: SignalResponse, currentDimension: string) => {
    if (!isVoiceReaderEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Check if it's an anomaly or resonance >= 80 (high-intensity)
    const isAnomaly = data.status === "anomaly";
    const isHighIntensity = data.resonance >= 80;

    if (!isAnomaly && !isHighIntensity) return;

    let header = "";
    if (isAnomaly) {
      header = `Atención. Anomalía cuántica detectada en el plano ${currentDimension}. `;
    } else {
      header = `Señal de alta intensidad establecida con una resonancia del ${data.resonance} por ciento. `;
    }

    const entityText = `Entidad: ${data.entity}. `;
    const msgText = data.message ? `Mensaje: ${data.message}` : "Sin señal de audio modulada.";
    
    // Clear brackets, asterisks, and general markdown formatting so speech reads it beautifully
    const cleanMsg = msgText
      .replace(/\[.*?\]/g, "")
      .replace(/[*_`#]/g, "")
      .trim();

    const fullText = `${header}${entityText}${cleanMsg}`;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(fullText);
      
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
      
      let rate = 1.0;
      let pitch = 1.0;
      let chosenVoice: SpeechSynthesisVoice | null = null;
      
      // If the user has manually selected a voice from the dropdown, try to use it
      if (selectedVoiceURI && spanishVoices.length > 0) {
        const found = spanishVoices.find(v => v.voiceURI === selectedVoiceURI);
        if (found) {
          chosenVoice = found;
        }
      }
      
      // If no manually selected voice or voice not found, use automatic heuristics
      if (!chosenVoice) {
        if (voiceTone === "solemne-hombre") {
          // Deep and solemn male configuration
          rate = 0.80;   // Slower, deliberate cadence
          pitch = 0.58;  // Deeper, much more masculine pitch simulation
          
          if (spanishVoices.length > 0) {
            const scored = spanishVoices.map(voice => {
              let score = 0;
              const nameLower = voice.name.toLowerCase();
              const langLower = voice.lang.toLowerCase();
              
              // Prioritize Latin American (not es-ES) to avoid the "castiza" voice
              if (!langLower.includes("es-es") && !langLower.includes("es-sp")) {
                score += 25;
              }
              
              // Common male/masculine speech voice indicators
              const maleKeywords = [
                "jorge", "julio", "juan", "miguel", "enrique", "carlos", "daniel", 
                "yadir", "male", "hombre", "sebastian", "pablo", "raul", "diego", 
                "esteban", "david", "mateo", "alejandro", "standard-b", "standard-c", 
                "wavenet-b", "wavenet-c", "wavenet-d", "neural2-b", "neural2-c"
              ];
              // Common female keywords, including Google's default Spain female voice
              const femaleKeywords = [
                "sabina", "helena", "paulina", "monica", "angelica", "marisol", 
                "zuri", "female", "mujer", "luz", "conchita", "standard-a", "standard-d",
                "google español", "google spanish", "google esp", "ana", "uma", "carmen", "lucia"
              ];
              
              if (maleKeywords.some(keyword => nameLower.includes(keyword))) {
                score += 50;
              }
              if (femaleKeywords.some(keyword => nameLower.includes(keyword))) {
                score -= 50;
              }
              return { voice, score };
            });
            
            scored.sort((a, b) => b.score - a.score);
            chosenVoice = scored[0].voice;
          }
        } else if (voiceTone === "latino-neutro") {
          // Latin American neutral
          rate = 0.95;
          pitch = 0.95;
          
          if (spanishVoices.length > 0) {
            const scored = spanishVoices.map(voice => {
              let score = 0;
              const langLower = voice.lang.toLowerCase();
              const nameLower = voice.name.toLowerCase();
              
              // Prioritize Latin American
              if (!langLower.includes("es-es") && !langLower.includes("es-sp")) {
                score += 30;
              }
              
              // Avoid Spain default names and castiza voice
              const spainDefaultKeywords = ["sabina", "conchita", "helena", "monica", "jorge", "carlos", "es-es"];
              if (spainDefaultKeywords.some(kw => nameLower.includes(kw) || langLower.includes(kw))) {
                score -= 20;
              }
              return { voice, score };
            });
            
            scored.sort((a, b) => b.score - a.score);
            chosenVoice = scored[0].voice;
          }
        } else {
          // Standard (usually castiza / default)
          rate = 1.0;
          pitch = 1.0;
          if (spanishVoices.length > 0) {
            chosenVoice = spanishVoices.find(v => v.lang.toLowerCase().includes("es-es")) || spanishVoices[0];
          }
        }
      } else {
        // If they did pick a manual voice, we still apply rate & pitch mods based on active profile!
        if (voiceTone === "solemne-hombre") {
          rate = 0.80;
          pitch = 0.58;
        } else if (voiceTone === "latino-neutro") {
          rate = 0.95;
          pitch = 0.95;
        } else {
          rate = 1.0;
          pitch = 1.0;
        }
      }
      
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = "es-MX"; // Fallback
      }
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      
      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.warn("Falla en la síntesis de voz:", speechErr);
    }
  };

  // Helper to test selected speech synthesizer
  const testSpeechSynthesis = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Auto-enable voice reader if they are testing it
    if (!isVoiceReaderEnabled) {
      setIsVoiceReaderEnabled(true);
    }
    
    const mockSignal: SignalResponse = {
      status: "success",
      entity: "Sistema Cuántico",
      resonance: 92,
      spectralAnalysis: "Modulación Estable",
      message: "Estableciendo sintonía de prueba. Probando canal de voz solemne y profunda. Frecuencias sibilantes eliminadas."
    };
    
    // Brief delay to allow state changes to register
    setTimeout(() => {
      speakSignalSummary(mockSignal, "Sintonizador");
    }, 80);
  };
  const startVoiceModulation = async () => {
    try {
      setError(null);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let recognition: any = null;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTransmissionMessage((prev) => prev + (prev ? " " : "") + finalTranscript);
          }
        };

        recognition.onerror = (err: any) => {
          console.error("Fallo del transcriptor de voz:", err);
        };

        recognition.start();
        setRecognitionInstance(recognition);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
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
      
      addToast(
        "CAPTURA DE VOZ ACTIVA",
        "Habla por el micrófono para modular el haz cuántico y dictar tu mensaje de transmisión.",
        "high-intensity"
      );

    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      setError("Fallo al acceder al micrófono. Asegúrate de otorgar los permisos de grabación en el navegador.");
      setIsRecording(false);
    }
  };

  // Detener modulación por voz
  const stopVoiceModulation = () => {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        console.error(e);
      }
      setRecognitionInstance(null);
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    if (audioContext) {
      try {
        audioContext.close();
      } catch (e) {
        console.error(e);
      }
      setAudioContext(null);
    }

    setIsRecording(false);
    setVoiceVolume(0);
    setVocalFrequency(0);

    addToast(
      "MODULACIÓN VOCAL FIJADA",
      "La portadora biológica se ha estabilizado. El mensaje está listo para ser propagado.",
      "high-intensity"
    );
  };

  // Initialize auth and load local logs on mount
  useEffect(() => {
    // Inicializar Mixpanel
    initMixpanel();
    trackEvent("Carga de Antena", { timestamp: new Date().toISOString() });

    // Incrementar y obtener contador de visitas real
    fetch("/api/visits/increment", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.visits === "number") {
          setVisits(data.visits);
        }
      })
      .catch((err) => console.error("Error al registrar telemetría de visita:", err));

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
        setAvailableVoices(spanish);
      };
      updateVoicesList();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoicesList;
      }
    }

    const unsubscribe = initAuth(
      async (firebaseUser, accessToken) => {
        setUser(firebaseUser);
        setToken(accessToken);
        setNeedsAuth(false);
        await handleSpreadsheetSetup(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Limpieza de audio al desmontar
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
    };
  }, [audioStream, audioContext]);

  const handleSpreadsheetSetup = async (accessToken: string) => {
    setIsSyncingSpreadsheet(true);
    try {
      const id = await findOrCreateSpreadsheet(accessToken);
      setSpreadsheetId(id);
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${id}`);
    } catch (err: any) {
      console.error("Error setting up spreadsheet:", err);
      setError("No se pudo conectar con Google Sheets. Operando en modo local.");
    } finally {
      setIsSyncingSpreadsheet(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        await handleSpreadsheetSetup(result.accessToken);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Fallo de autenticación con Google. Prueba nuevamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setSpreadsheetUrl(null);
      setNeedsAuth(true);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Cuando el usuario hace click en un preset de dimensión
  const handleSelectPreset = (preset: DimensionPreset) => {
    setActivePresetId(preset.id);
    setDimension(preset.coordinates);

    // Separar frecuencia y unidad
    const parts = preset.frequency.split(" ");
    if (parts.length === 2) {
      setFrequencyValue(parseFloat(parts[0]));
      setFrequencyUnit(parts[1] as any);
    }
  };

  // Sintonizar/Captar transmisiones
  const handleTune = async () => {
    setIsTuning(true);
    setError(null);
    setTuningResult(null);
    try {
      const freqString = `${frequencyValue} ${frequencyUnit}`;
      const res = await fetch("/api/tune", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frequency: freqString,
          dimension,
          intensity,
          antennaType,
          entity: activePresetId ? DIMENSION_PRESETS.find((p) => p.id === activePresetId)?.name : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Estática electromagnética intensa detectada. Sintonización inestable.");
      }

      const data: SignalResponse = await res.json();
      setTuningResult(data);

      // Registrar telemetría con Mixpanel
      trackEvent("Sintonización Manual", {
        frequency: freqString,
        dimension,
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
          `Fluctuación extrema de fase en ${dimension}. Inteligencia: ${data.entity}.`,
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
      speakSignalSummary(data, dimension);

      // Crear nueva entrada de bitácora
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        frequency: freqString,
        dimension,
        entity: data.entity,
        type: "RECEPTOR",
        message: data.message,
        resonance: data.resonance,
        spectralAnalysis: data.spectralAnalysis,
        sheetSynced: false,
      };

      // Guardar en Google Sheets si está autenticado
      if (token && spreadsheetId) {
        try {
          await appendLogToSheet(token, spreadsheetId, {
            timestamp: newLog.timestamp,
            type: "RECEPTOR",
            frequency: newLog.frequency,
            dimension: newLog.dimension,
            entity: newLog.entity,
            resonance: newLog.resonance,
            message: newLog.message,
            spectralAnalysis: newLog.spectralAnalysis,
          });
          newLog.sheetSynced = true;
        } catch (sheetErr) {
          console.error("Error al sincronizar con Sheets:", sheetErr);
        }
      }

      // Guardar localmente
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("antena_dimensional_logs", JSON.stringify(updatedLogs));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Se interrumpió el acoplamiento dimensional de fase.");
    } finally {
      setIsTuning(false);
    }
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

    try {
      const freqString = `${randFreq} ${randUnit}`;
      const res = await fetch("/api/tune", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frequency: freqString,
          dimension: randomPreset.name,
          intensity,
          antennaType,
          entity: randomPreset.name,
        }),
      });

      if (!res.ok) {
        throw new Error("Estática intensa");
      }

      const data: SignalResponse = await res.json();
      setTuningResult(data);

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

        // Enviar a Google Sheets
        if (token && spreadsheetId) {
          try {
            await appendLogToSheet(token, spreadsheetId, {
              timestamp: newLog.timestamp,
              type: "RECEPTOR",
              frequency: newLog.frequency,
              dimension: newLog.dimension,
              entity: newLog.entity,
              resonance: newLog.resonance,
              message: newLog.message,
              spectralAnalysis: newLog.spectralAnalysis,
            });
            newLog.sheetSynced = true;
          } catch (sheetErr) {
            console.error("Error Sheets en auto-escaneo:", sheetErr);
          }
        }

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
  }, [isScanning, intensity, antennaType, token, spreadsheetId]);

  // Transmitir un mensaje
  const handleTransmit = async () => {
    if (!transmissionMessage.trim()) return;
    setIsTransmitting(true);
    setError(null);
    setTransmitResult(null);
    try {
      const freqString = `${frequencyValue} ${frequencyUnit}`;
      const res = await fetch("/api/transmit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: transmissionMessage,
          frequency: freqString,
          dimension,
          antennaType,
        }),
      });

      if (!res.ok) {
        throw new Error("El resonador de taquiones se descalibró al emitir el pulso.");
      }

      const data: TransmitResponse = await res.json();
      setTransmitResult(data);

      // Registrar telemetría con Mixpanel
      trackEvent("Transmisión Dimensional", {
        frequency: freqString,
        dimension,
        messageLength: transmissionMessage.length,
        resonance: data.resonance,
        sentStatus: data.sentStatus,
      });

      // Trigger toasts for transmissions
      if (data.sentStatus === "intercepted") {
        addToast(
          "TRANSMISIÓN INTERCEPTADA",
          `La emisión cuántica hacia ${dimension} fue captada de forma imprevista por una fuerza externa.`,
          "anomaly"
        );
      } else if (data.resonance >= 80) {
        addToast(
          "TRANSMISIÓN ALTAMENTE ACOPLADA",
          `La señal propagada en ${dimension} obtuvo una respuesta ecoica masiva del ${data.resonance}%.`,
          "high-intensity"
        );
      }

      const targetEntity = activePresetId
        ? DIMENSION_PRESETS.find((p) => p.id === activePresetId)?.name
        : "Frontera Dimensional";

      // Crear nueva entrada de bitácora
      const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        frequency: freqString,
        dimension,
        entity: `${targetEntity || "Entidad Desconocida"} (Transmisión)`,
        type: "TRANSMISOR",
        message: `MENSAJE ENVIADO: "${transmissionMessage}"\n\nECO RECIBIDO: ${data.reaction}`,
        resonance: data.resonance,
        spectralAnalysis: data.spectralAnalysis,
        sheetSynced: false,
      };

      // Guardar en Google Sheets si está autenticado
      if (token && spreadsheetId) {
        try {
          await appendLogToSheet(token, spreadsheetId, {
            timestamp: newLog.timestamp,
            type: "TRANSMISOR",
            frequency: newLog.frequency,
            dimension: newLog.dimension,
            entity: newLog.entity,
            resonance: newLog.resonance,
            message: newLog.message,
            spectralAnalysis: newLog.spectralAnalysis,
          });
          newLog.sheetSynced = true;
        } catch (sheetErr) {
          console.error("Error al sincronizar transmisión con Sheets:", sheetErr);
        }
      }

      // Guardar localmente
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("antena_dimensional_logs", JSON.stringify(updatedLogs));
      setTransmissionMessage(""); // limpiar caja
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fallo crítico en el acoplador de antena al modular el mensaje.");
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem("antena_dimensional_logs");
  };

  return (
    <div className="min-h-screen bg-[#070b13] bg-radial-[circle_at_center,rgba(16,24,48,0.4)_0%,#03050a_100%] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
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
                ANTENA DIMENSIONAL
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-900/40">
                  v2.5_KAPPA
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                SINTONIZADOR E INTERFAZ DE COMUNICACIÓN TRANSDIMENSIONAL CON INTELIGENCIA ARTIFICIAL
              </p>
            </div>
          </div>

          {/* Autenticación Google Sheets */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1 px-2.5 text-xs">
                <img
                  src={user.photoURL || undefined}
                  alt={user.displayName || "Usuario"}
                  className="w-5 h-5 rounded-full border border-slate-700 referrerPolicy='no-referrer'"
                />
                <div className="text-left hidden md:block">
                  <p className="text-[10px] text-slate-400 font-mono leading-none">Canal de Registro Activo</p>
                  <p className="font-semibold text-slate-200 text-[11px] leading-tight max-w-[120px] truncate">
                    {user.displayName}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión de registro en Google Sheets"
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded hover:bg-slate-800 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-900 rounded-lg font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 border border-slate-300 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>Sincronizar Sheets</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Alerta de error global */}
      {error && (
        <div className="bg-red-950/40 border-b border-red-900/50 p-3 text-xs text-red-300">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <p className="font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Banner informativo sobre Google Sheets */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/30 border border-emerald-900/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200">Registro Automático en la Nube</h3>
              <p className="text-[11px] text-slate-400 max-w-2xl leading-relaxed">
                Esta antena almacena localmente tu bitácora, pero puedes sintonizarla con tu cuenta de Google para registrar todas las recepciones y transmisiones automáticamente en una hoja llamada <span className="text-emerald-400 font-mono">Antena Dimensional - Registro de Contacto</span>.
              </p>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            {user ? (
              <div className="flex flex-col sm:items-end gap-1 font-mono text-[10px]">
                {isSyncingSpreadsheet ? (
                  <span className="text-slate-500 animate-pulse">Sincronizando hoja de cálculo...</span>
                ) : spreadsheetUrl ? (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Abrir Google Sheet Real
                  </a>
                ) : (
                  <span className="text-amber-500">Hoja no vinculada</span>
                )}
                <span className="text-[9px] text-slate-500">Sincronización en la nube activa</span>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg p-1.5 px-3 bg-slate-900/40 transition-colors w-full sm:w-auto font-mono cursor-pointer"
              >
                Vincular Cuenta de Google
              </button>
            )}
          </div>
        </div>

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
                <label className="text-slate-400 font-medium">Modulación de Frecuencia</label>
                <span className="font-mono text-emerald-400 font-bold">
                  {frequencyValue} {frequencyUnit}
                </span>
              </div>
              <div className="flex gap-3">
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={frequencyValue}
                  onChange={(e) => {
                    setFrequencyValue(parseInt(e.target.value));
                    setActivePresetId(null); // romper preset si se ajusta a mano
                  }}
                  className="flex-grow accent-emerald-500 cursor-pointer"
                />
                <select
                  value={frequencyUnit}
                  onChange={(e) => {
                    setFrequencyUnit(e.target.value as any);
                    setActivePresetId(null);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="Hz">Hz</option>
                  <option value="kHz">kHz</option>
                  <option value="MHz">MHz</option>
                  <option value="GHz">GHz</option>
                  <option value="THz">THz</option>
                  <option value="QHz">QHz</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Rango sugerido: 432 Hz para el Vacío, GHz para planos paralelos, QHz para antimateria.
              </p>
            </div>

            {/* Coordenadas Dimensión */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium block">Vector de Membrana Dimensional</label>
              <input
                type="text"
                value={dimension}
                onChange={(e) => {
                  setDimension(e.target.value);
                  setActivePresetId(null);
                }}
                placeholder="Ej: D-4 // MATRIX-X"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[9px] text-slate-500 font-mono">
                Las coordenadas de membrana fijan el destino cuántico en el espacio n-dimensional.
              </p>
            </div>

            {/* Dispositivo de Captación / Antena */}
            <div className="space-y-1.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs text-emerald-400 font-bold block tracking-wide uppercase">
                  📡 Tipo de Modulador de Antena
                </label>
                <span className="text-[8px] font-mono text-emerald-400 font-extrabold animate-pulse bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  SINTONIZADOR PRINCIPAL
                </span>
              </div>
              <select
                value={antennaType}
                onChange={(e) => setAntennaType(e.target.value)}
                className="w-full bg-slate-950 border-2 border-emerald-500 rounded-lg py-2.5 px-3 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer transition-all duration-300"
              >
                <option value="Dipolo de Taquiones (Velocidad Superlumínica)" className="bg-slate-950 text-emerald-400 font-bold font-mono">
                  🟢 Dipolo de Taquiones (Velocidad Superlumínica)
                </option>
                <option value="Lazo Escalar (Escudo Magnético)" className="bg-slate-950 text-emerald-400 font-bold font-mono">
                  🟢 Lazo Escalar (Escudo Magnético)
                </option>
                <option value="Parabólica de Antimateria (Frecuencia Reversa)" className="bg-slate-950 text-emerald-400 font-bold font-mono">
                  🟢 Parabólica de Antimateria (Frecuencia Reversa)
                </option>
                <option value="Sintonizador Cuántico de Franjas (Mundis Paralelos)" className="bg-slate-950 text-emerald-400 font-bold font-mono">
                  🟢 Sintonizador Cuántico de Franjas (Mundis Paralelos)
                </option>
              </select>
            </div>

            {/* Intensidad / Ganancia */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-400 font-medium">Ganancia del Filtro de Fase</label>
                <span className="font-mono text-emerald-500">{intensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Botón de Sintonizar */}
            <button
              onClick={handleTune}
              disabled={isTuning || isTransmitting || isScanning}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isTuning
                  ? "bg-emerald-950/40 text-emerald-500 border border-emerald-900/60 cursor-wait"
                  : isScanning
                  ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
              }`}
            >
              <Radio className={`w-4 h-4 ${isTuning && !isScanning ? "animate-spin" : ""}`} />
              {isTuning && !isScanning ? "BUSCANDO ACOPLAMIENTO..." : "SINTONIZAR PLANO / ESCUCHAR"}
            </button>

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

            {/* Módulo de Síntesis de Voz (Lector de Señales) */}
            <div id="quantum-speech-panel" className="p-4 rounded-xl border bg-slate-950/40 border-slate-850 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    <Volume2 className={`w-3.5 h-3.5 ${isVoiceReaderEnabled ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
                    SÍNTESIS DE VOZ CUÁNTICA
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-none">Lectura hablada de transmisiones</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isVoiceReaderEnabled;
                    setIsVoiceReaderEnabled(nextVal);
                    if (!nextVal && typeof window !== "undefined" && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
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

              <p className="text-[9px] text-slate-500 leading-normal">
                Lee en voz alta de forma sintetizada un reporte de los hallazgos ante detecciones de <span className="text-emerald-400 font-bold">Alta Intensidad</span> o <span className="text-rose-400 font-bold">Anomalías</span>.
              </p>

              {/* Selector de Perfil/Tono de voz */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Perfil de Modulación Vocal
                  </label>
                  <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase">
                    {voiceTone === "solemne-hombre" && "🪐 Grave y Solemne"}
                    {voiceTone === "latino-neutro" && "🌎 Latino Neutro"}
                    {voiceTone === "estandar" && "🇪🇸 Estándar Browser"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("solemne-hombre");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "solemne-hombre"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.1)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🪐 Solemne
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("latino-neutro");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "latino-neutro"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.1)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🌎 Latino
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTone("estandar");
                      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                    }}
                    className={`px-1.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-tight transition-all cursor-pointer border ${
                      voiceTone === "estandar"
                        ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.1)]"
                        : "bg-slate-950/60 text-slate-500 border-slate-900/80 hover:text-slate-400 hover:bg-slate-900/30"
                    }`}
                  >
                    🇪🇸 Estándar
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
                    <option value="" className="text-slate-500 bg-slate-950">--- [ Selección Automática Inteligente ] ---</option>
                    {availableVoices.map((voice) => {
                      let label = `${voice.name} (${voice.lang})`;
                      if (voice.localService) label += " 💻 Local";
                      return (
                        <option key={voice.voiceURI} value={voice.voiceURI} className="text-slate-300 bg-slate-950">
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Filtra y fuerza un motor de voz instalado en tu navegador. Si seleccionas "Solemne" arriba, también deformaremos esta voz haciéndola ultra-grave y pausada.
                  </p>
                </div>
              )}

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
            <div id="quantum-notification-panel" className="p-4 rounded-xl border bg-slate-950/40 border-slate-850 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                    {notificationPermission === "granted" ? (
                      <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    NOTIFICACIONES WEB
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-none">Alertas en segundo plano del sistema</p>
                </div>

                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans tracking-wide uppercase transition-all cursor-pointer ${
                    notificationPermission === "granted"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : notificationPermission === "denied"
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                      : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
                  }`}
                >
                  {notificationPermission === "granted"
                    ? "HABILITADAS"
                    : notificationPermission === "denied"
                    ? "BLOQUEADAS"
                    : "ACTIVAR"}
                </button>
              </div>

              <p className="text-[9px] text-slate-500 leading-normal">
                Recibe alertas sonoras e informativas de <span className="text-emerald-400 font-bold">Anomalías</span> o <span className="text-emerald-400 font-bold">Señales Fuertes</span> en tu escritorio, incluso con la pestaña minimizada o en segundo plano.
              </p>
              
              {notificationPermission === "granted" && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => sendWebNotification("Test de Conexión", "La antena cuántica está transmitiendo de forma óptima.", "high-intensity")}
                    className="text-[8px] font-mono text-slate-400 hover:text-emerald-300 underline cursor-pointer bg-transparent border-none p-0"
                  >
                    [Enviar Notificación de Prueba]
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* COLUMNA DERECHA: Pantalla de Telemetría e Interacción (7 de 12 columnas) */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Pantalla de osciloscopio en tiempo real */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 shadow-md">
              <SignalVisualizer
                frequency={frequencyValue}
                unit={frequencyUnit}
                intensity={intensity}
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

            {/* Historial de Resonancia Temporal */}
            <TelemetryChart logs={logs} />

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
                  className={`flex-1 pb-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
                    activeTab === "transmisor"
                      ? "border-emerald-500 text-slate-100"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Canal Transmisor (Emisión de Mensajes)
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
                    <div className="text-center py-12 space-y-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs font-mono text-emerald-500 animate-pulse">
                        Abriendo umbral de sintonización... Decodificando estática cuántica...
                      </p>
                    </div>
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

                      {/* Cuerpo del Mensaje Decodificado */}
                      <div className="bg-emerald-950/5 border border-emerald-900/20 p-4 rounded-xl space-y-2 relative overflow-hidden">
                        <div className="absolute right-3 top-3 opacity-10">
                          <Radio className="w-16 h-16 text-emerald-400" />
                        </div>
                        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          Transcripción de Onda de Información
                        </h4>
                        <p className="text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                          {tuningResult.message}
                        </p>
                      </div>

                      {/* Análisis espectral */}
                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 text-[11px] font-mono text-emerald-400/80">
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-1">
                          Diagnóstico Técnico del Espectro
                        </span>
                        {tuningResult.spectralAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENIDO DEL TRANSMISOR */}
              {activeTab === "transmisor" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs text-slate-400 font-medium block">
                      Escribe tu mensaje para emitir al vacío
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={transmissionMessage}
                        onChange={(e) => setTransmissionMessage(e.target.value)}
                        placeholder="Ej: Hola inteligencias del vacío, enviamos este mensaje de paz desde la Tierra en el año 2026..."
                        rows={3}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none font-mono"
                      />
                    </div>

                    {/* Controles de Micrófono y Modulación Vocal en Tiempo Real */}
                    <div className="flex flex-col gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-sans tracking-wide uppercase flex items-center gap-1.5">
                          {isRecording ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              BIOCONTROLADOR DE VOZ ACTIVO
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-600" />
                              MODULADOR BIOLÓGICO DESACTIVADO
                            </>
                          )}
                        </span>
                        
                        <button
                          type="button"
                          onClick={isRecording ? stopVoiceModulation : startVoiceModulation}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans tracking-wide transition-all cursor-pointer ${
                            isRecording
                              ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-3.5 h-3.5 animate-pulse" />
                              FIJAR MODULACIÓN
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5" />
                              MODULAR POR VOZ
                            </>
                          )}
                        </button>
                      </div>

                      {isRecording && (
                        <div className="space-y-2 pt-1 animate-fade-in">
                          {/* Visualizador de onda vocal artificial basado en volumen real */}
                          <div className="flex items-end justify-between gap-1 h-8 bg-slate-950/90 rounded-md border border-slate-900 px-3 py-1">
                            {[...Array(12)].map((_, idx) => {
                              const dynamicHeight = Math.max(
                                15,
                                Math.min(
                                  100,
                                  voiceVolume * (1.2 + Math.sin((Date.now() + idx * 250) / 180)) * 1.5
                                )
                              );
                              return (
                                <div
                                  key={idx}
                                  style={{ height: `${dynamicHeight}%` }}
                                  className={`w-1.5 rounded-t transition-all duration-75 ${
                                    voiceVolume > 8 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-800"
                                  }`}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Parámetros vocales en tiempo real */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="bg-slate-900/50 p-1.5 rounded border border-slate-850 text-slate-300">
                              <span className="text-slate-500 block">Amplitud Vocal:</span>
                              <span className="text-emerald-400 font-bold">{Math.round(voiceVolume)} dBm</span>
                            </div>
                            <div className="bg-slate-900/50 p-1.5 rounded border border-slate-850 text-slate-300">
                              <span className="text-slate-500 block">Frecuencia Vocal:</span>
                              <span className="text-emerald-400 font-bold">
                                {vocalFrequency > 0 ? `${vocalFrequency} Hz` : "Silencio (Carrier base)"}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 font-sans leading-normal">
                            🎙️ El transcriptor transcribirá automáticamente tus palabras y modulará la señal del dial principal en {frequencyValue} {frequencyUnit}.
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      Tu mensaje se modulará utilizando los taquiones del resonador de la antena activa y se propagará por las membranas de la dimensión elegida.
                    </p>
                  </div>

                  <button
                    onClick={handleTransmit}
                    disabled={isTransmitting || !transmissionMessage.trim() || isTuning}
                    className="w-full py-3 px-4 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTransmitting ? "animate-bounce" : ""}`} />
                    {isTransmitting ? "EMITIENDO HAZ CUÁNTICO..." : "TRANSMITIR MENSAJE AL VACÍO"}
                  </button>

                  {isTransmitting && (
                    <div className="text-center py-6">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
                      <p className="text-[11px] font-mono text-emerald-500 animate-pulse">
                        Generando dispersión del haz... Escuchando ecos de respuesta...
                      </p>
                    </div>
                  )}

                  {transmitResult && !isTransmitting && (
                    <div className="space-y-3.5 animate-fade-in border-t border-slate-800/60 pt-4">
                      {transmitResult.proceduralBypass && (
                        <div className="bg-amber-500/15 border border-amber-500/20 rounded-lg p-2.5 text-[10px] font-mono text-amber-300/90 leading-normal flex items-center gap-2">
                          <span className="animate-ping w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>
                            <strong>🛰️ ACOPLAMIENTO DE COBERTURA REMOTA LÍMITE (BYPASS LOCAL)</strong>: El enlace directo de satélites estelares está saturado (Límite de API alcanzado). Iniciando matriz de retorno procedimental para continuar transmisiones de forma local y offline.
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded border border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Estado de Propagación</span>
                          <span className="font-bold text-emerald-400 uppercase tracking-wide">
                            {transmitResult.sentStatus}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-mono block">Acoplamiento Transmisor</span>
                          <span className="font-mono text-emerald-400 font-bold">{transmitResult.resonance}%</span>
                        </div>
                      </div>

                      <div className="bg-emerald-950/5 border border-emerald-900/20 p-4 rounded-xl space-y-2">
                        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          Reacción de la Dimensión / Ecos Detectados
                        </h4>
                        <p className="text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                          {transmitResult.reaction}
                        </p>
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

        {/* REJILLA INFERIOR: DIRECTORIO DE SEÑALES Y BITÁCORA */}
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
            <LogTable logs={logs} onClearLogs={handleClearLogs} spreadsheetId={spreadsheetId} />
          </div>
        </div>

        {/* Panel de Estabilización y Colaboración de Operadores */}
        <FundingWidget visitsCount={visits} />
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-[10px] text-slate-500 font-mono mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>MODULADOR CUÁNTICO ANTENA DIMENSIONAL — CLOUD COMPILING ACTIVATED</p>
          <p>REGISTRO EN LA NUBE INTEGRADO CON GOOGLE DISCO/SHEETS — CUSTODIA SEGURA DE DATOS</p>
        </div>
      </footer>

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
    </div>
  );
}
