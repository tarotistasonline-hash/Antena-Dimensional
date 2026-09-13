import React, { useState, useEffect } from "react";
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
  Compass,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Globe2,
  Share2
} from "lucide-react";
import { DimensionPreset, TransmitResponse } from "../types";
import { TransdimensionalTuningHUD } from "./TransdimensionalTuningHUD";

interface SimpleOracleViewProps {
  presets: DimensionPreset[];
  activePresetId: string | null;
  dimension: string;
  frequencyValue: number;
  frequencyUnit: string;
  transmissionMessage: string;
  setTransmissionMessage: (msg: string) => void;
  onSelectPreset: (preset: DimensionPreset) => Promise<void>;
  onTransmit: () => Promise<void>;
  isTransmitting: boolean;
  isTuning?: boolean;
  tuningProgress?: number;
  transmitResult: TransmitResponse | null;
  onClearTransmitResult: () => void;
  isSpeakingSolemn: boolean;
  onPlayVoice: (text: string) => void;
  onStopVoice: () => void;
  isRecording: boolean;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onSwitchToAdvanced: () => void;
  onOpenBlog?: () => void;
}

const FRIENDLY_ENTITIES = [
  {
    id: "arcturus-963",
    emoji: "💎",
    title: "Arcturianos (9D)",
    sub: "Frecuencia 963 Hz • Sanación y Alta Conciencia",
    desc: "Seres de luz cristalina especializados en paz interior, claridad mental y elevar tu vibración.",
    tag: "Paz y Sanación",
    color: "from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-300",
  },
  {
    id: "whisper-void",
    emoji: "🌌",
    title: "Pleyadianos y Guardianes 5D",
    sub: "Frecuencia 432 Hz • Amor y Conciencia Universal",
    desc: "Emisarios del amor incondicional y el despertar espiritual de la humanidad.",
    tag: "Amor y Despertar",
    color: "from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-300",
  },
  {
    id: "sirius-enki",
    emoji: "🌊",
    title: "Santuario de Sirio y Enki",
    sub: "Frecuencia 528 Hz • Alquimia y Regeneración",
    desc: "Sabiduría ancestral, conocimiento oculto de las aguas cósmicas y armonía emocional.",
    tag: "Alquimia Emocional",
    color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/40 text-cyan-300",
  },
  {
    id: "orion-council",
    emoji: "🔮",
    title: "Consejo de Orión",
    sub: "Frecuencia 888 Hz • Propósito del Alma",
    desc: "Maestros estelares que orientan sobre tu destino, superación de pruebas y misión en la Tierra.",
    tag: "Propósito y Destino",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300",
  },
  {
    id: "nibiru-anunnaki",
    emoji: "👑",
    title: "Elohim de Nibiru",
    sub: "Frecuencia 12.12 THz • Leyes Cósmicas",
    desc: "Ingenieros del cosmos y civilizaciones primordiales. Revelan secretos sobre el origen y la historia.",
    tag: "Historia Ancestral",
    color: "from-orange-500/20 to-amber-500/20 border-orange-500/40 text-orange-300",
  },
  {
    id: "mirror-earth",
    emoji: "🌿",
    title: "Conciencia Gaia (Tierra Espejo)",
    sub: "Frecuencia 11.11 GHz • Red Bioeléctrica",
    desc: "La inteligencia viva de la naturaleza y líneas temporales paralelas para armonizar tu vida diaria.",
    tag: "Naturaleza Viva",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/40 text-emerald-300",
  },
];

const SUGGESTED_QUESTIONS = [
  "¿Qué mensaje tienen para mi vida en este momento?",
  "¿Cómo puedo superar la ansiedad y encontrar paz interior?",
  "¿Cuál es mi propósito o misión en la Tierra?",
  "¿Existe vida después de la muerte física?",
  "¿Cómo atraer abundancia y prosperidad a mis proyectos?",
  "¿Quiénes son ustedes y cómo nos ven a los humanos?",
  "¿Qué debo hacer ante las dudas y decisiones difíciles?",
];

export const SimpleOracleView: React.FC<SimpleOracleViewProps> = ({
  presets,
  activePresetId,
  dimension,
  frequencyValue,
  frequencyUnit,
  transmissionMessage,
  setTransmissionMessage,
  onSelectPreset,
  onTransmit,
  isTransmitting,
  isTuning = false,
  tuningProgress,
  transmitResult,
  onClearTransmitResult,
  isSpeakingSolemn,
  onPlayVoice,
  onStopVoice,
  isRecording,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onSwitchToAdvanced,
  onOpenBlog,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const selectedEntity =
    FRIENDLY_ENTITIES.find((e) => e.id === activePresetId) || FRIENDLY_ENTITIES[0];

  const handleEntityClick = (entityId: string) => {
    const targetPreset = presets.find((p) => p.id === entityId);
    if (targetPreset) {
      onSelectPreset(targetPreset);
    }
  };

  const handleSelectQuestion = (qText: string) => {
    setTransmissionMessage(qText);
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Antena Interdimensional - Oráculo Cuántico",
          text: "Prueba esta app: habla con seres y guías de otras dimensiones y escucha sus respuestas con voz hablada.",
          url: window.location.href,
        });
      } catch (e) {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div id="simple-oracle-container" className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Banner de Bienvenida y Ayuda Rápida */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-emerald-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              ORÁCULO INTERDIMENSIONAL EN VIVO
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>📻 Antena de Contacto Cuántico</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
              Comunícate de manera directa con inteligencias y guías de otras dimensiones.
              Hazles cualquier pregunta sobre tu vida, amor, salud, futuro o espiritualidad, y
              escucha su respuesta hablada en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
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

      {/* Si hay una respuesta activa de la entidad, mostrarla arriba de forma destacada */}
      {transmitResult && (
        <div id="oracle-answer-card" className="rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/90 border-2 border-emerald-400/80 p-5 sm:p-7 shadow-[0_0_35px_rgba(16,185,129,0.25)] space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-inner">
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

            {/* Controles de audio de la voz */}
            <div className="flex items-center gap-2">
              {isSpeakingSolemn ? (
                <button
                  type="button"
                  onClick={onStopVoice}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white font-bold text-xs border border-rose-500 shadow-lg cursor-pointer transition-all animate-pulse"
                >
                  <VolumeX className="w-4 h-4 text-rose-300" />
                  <span>Detener Voz</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPlayVoice(transmitResult.reaction)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer transition-all"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>Escuchar en Voz Alta</span>
                </button>
              )}
            </div>
          </div>

          {/* Texto de la respuesta */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-base sm:text-lg leading-relaxed font-sans shadow-inner">
              <p className="whitespace-pre-line">{transmitResult.reaction}</p>
            </div>

            {/* Consejo o Guía del Oráculo */}
            {transmitResult.guidance && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 mb-1">
                    CLAVE O CONSEJO DEL ORÁCULO
                  </h4>
                  <p className="text-sm text-emerald-100 leading-normal">
                    {transmitResult.guidance}
                  </p>
                </div>
              </div>
            )}

            {/* Código / Arquetipo Estelar */}
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

          {/* Botones de acción posterior */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
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
              onClick={onSwitchToAdvanced}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer p-1"
            >
              Ver osciloscopio y frecuencias en Consola Avanzada →
            </button>
          </div>
        </div>
      )}

      {/* PASO 1: Selección de Entidad / Guía */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40">
              1
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              Elige con quién deseas comunicarte
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Toca una entidad para sintonizarla
          </span>
        </div>

        {/* Grid de Entidades amigables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRIENDLY_ENTITIES.map((ent) => {
            const isSelected = ent.id === activePresetId;
            return (
              <button
                key={ent.id}
                type="button"
                onClick={() => handleEntityClick(ent.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative ${
                  isSelected
                    ? "bg-slate-850 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400"
                    : "bg-slate-950/60 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {isSelected && (
                  <span className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isTuning
                      ? "text-cyan-300 bg-cyan-950/90 border-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      : "text-emerald-400 bg-emerald-950/90 border-emerald-500/50"
                  }`}>
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

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {ent.tag}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {isSelected ? "Listo para hablar" : "Seleccionar →"}
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

        {/* Textarea y Botón de Dictado por Voz */}
        <div className="relative">
          <textarea
            value={transmissionMessage}
            onChange={(e) => setTransmissionMessage(e.target.value)}
            placeholder={`Escribe aquí lo que deseas consultar a ${selectedEntity.title} (ej: ¿Qué consejo tienen para mi vida hoy?, ¿cómo superar mis dudas?)...`}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-4 pr-14 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner resize-none font-sans"
          />

          {/* Botón de Dictado por Micrófono */}
          <button
            type="button"
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

        {/* Preguntas sugeridas para inspirarse */}
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

        {/* INDICADOR Y MONITOR DE ESPERA DE CONEXIÓN CUÁNTICA (HUD) */}
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
            onClick={onTransmit}
            disabled={isTransmitting || isTuning}
            className={`w-full py-4 px-6 rounded-xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer shadow-xl ${
              isTransmitting || isTuning
                ? "bg-slate-900 text-amber-300 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-wait"
                : "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.99]"
            }`}
          >
            {isTransmitting ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span className="font-extrabold text-sm sm:text-base text-amber-200">
                    SINTONIZANDO RESPUESTA... POR FAVOR AGUARDE
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-400/80 shadow-inner">
                  ⏳ 3 a 5 segs
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

          {/* Mensaje de apoyo e instrucción clara bajo el botón */}
          {!isTransmitting && !isTuning && (
            <p className="text-center text-[11px] font-sans text-slate-400 mt-2.5 flex items-center justify-center gap-1.5">
              <span>⏳</span>
              <span>
                <strong className="text-emerald-300 font-semibold">Demora estimada: 3 a 5 segundos.</strong> Al presionar, por favor aguarda unos instantes mientras se decodifica y habla la respuesta.
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Explicador y acceso a Consola Avanzada y Blog */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-850 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            ¿Quieres calibrar hercios, ver el mapa estelar o publicar sugerencias en el blog?
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenBlog && (
            <button
              type="button"
              onClick={onOpenBlog}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📜 Blog y Propuestas</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchToAdvanced}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold transition-all cursor-pointer"
          >
            🎛️ Consola Avanzada
          </button>
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
                  ¿Cómo funciona la Antena Interdimensional?
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
                Esta aplicación es un <strong>oráculo cuántico interactivo</strong> inspirado en
                la radioastronomía y el contacto con civilizaciones de planos sutiles.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">1.</span>
                  <div>
                    <strong className="text-white">Elige a tu guía:</strong> Cada civilización
                    (Pleyadianos, Arcturianos, Sirio, Anunnaki) emite en una frecuencia armónica
                    específica y posee una especialidad espiritual.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">2.</span>
                  <div>
                    <strong className="text-white">Haz tu pregunta:</strong> Puedes escribir
                    cualquier duda sincera o usar el botón del micrófono para dictarla hablando
                    desde tu celular.
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold text-sm">3.</span>
                  <div>
                    <strong className="text-white">Recibe y escucha:</strong> La entidad te
                    responderá de forma personalizada y la app leerá la respuesta en voz alta con
                    un sintetizador de voz solemne.
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                ¡Comparte el enlace con tus amigos para que ellos también puedan realizar sus
                consultas!
              </p>
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
    </div>
  );
};
