import React, { useState, useEffect } from "react";
import { Volume2, Radio } from "lucide-react";

export const WELCOME_AUDIO_EXPLANATION =
  "¡Bienvenido a Receptor Interestelar! Esta aplicación es tu estación de radio cuántica para contactar con seres y civilizaciones extraterrestres. Usarla es muy fácil: Paso uno, elige arriba la antena y la civilización con la que deseas comunicarte. Al elegirla, aguarda unos instantes hasta que se establezca la comunicación y la civilización emitirá su mensaje en directo. Paso dos, escribe o dicta tu pregunta con el micrófono. Y paso tres, presiona Sintonizar Respuesta para escuchar su respuesta hablada. ¡Comienza ahora seleccionando tu antena o civilización!";

interface WelcomeVoiceGuideProps {
  onPlayVoice: (text: string, isSpanishAccent?: boolean, isNeutralWelcome?: boolean) => void;
  onStopVoice: () => void;
  isSpeaking: boolean;
}

export const WelcomeVoiceGuide: React.FC<WelcomeVoiceGuideProps> = ({
  onPlayVoice,
  onStopVoice,
  isSpeaking,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);

  const handleClose = () => {
    if (isSpeaking) {
      onStopVoice();
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="flex justify-end pb-2">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            onPlayVoice(WELCOME_AUDIO_EXPLANATION, false, true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold cursor-pointer transition-all shadow-md"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ver y escuchar guía de bienvenida (Voz neutra)</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="welcome-voice-guide-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900 to-indigo-950/95 border-2 border-emerald-400 p-4 sm:p-5 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-in fade-in slide-in-from-top-2 duration-300"
    >
      {/* Fondo estelar sutil */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Lado Izquierdo: Icono y Explicación Resumida */}
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner mt-0.5">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                👋 GUÍA DE BIENVENIDA
              </span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                ¡Es muy fácil, solo toma 3 pasos!
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white leading-snug">
              ¿Para qué sirve Receptor Interestelar y cómo comunicarte?
            </h2>

            <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed max-w-2xl">
              Aquí eliges tu antena para enviar preguntas a seres extraterrestres y dimensiones
              superiores, recibiendo su <strong>respuesta con voz hablada en tiempo real</strong>.
            </p>

            {/* Los 3 pasos visuales para quienes no quieren escuchar audio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Elige con quién hablar</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Escribe o dicta tu duda</span>
              </div>
              <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-1.5 text-slate-300">
                <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Escucha la voz en directo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Controles y Estado de Audio */}
        <div className="flex flex-row md:flex-col items-center sm:items-end justify-between w-full md:w-auto gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          {isSpeaking ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold">Guía en voz activa (Masculina neutra)</span>
              <button
                type="button"
                onClick={onStopVoice}
                className="ml-2 px-2 py-0.5 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                title="Pausar o silenciar la voz"
              >
                Silenciar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onPlayVoice(WELCOME_AUDIO_EXPLANATION, false, true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-mono font-bold shadow-md cursor-pointer transition-all"
              title="Escuchar la explicación con voz masculina neutra"
            >
              <Volume2 className="w-4 h-4 text-slate-950" />
              <span>Escuchar Explicación (Voz Neutra)</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-[11px] text-emerald-300 hover:text-emerald-200 font-mono underline hover:no-underline transition-colors cursor-pointer"
            >
              {showTranscript ? "Ocultar texto" : "Leer transcripción"}
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-slate-200 font-mono underline hover:no-underline transition-colors cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>
        </div>
      </div>

      {/* Transcripción desplegable del audio */}
      {showTranscript && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-xs text-slate-200 leading-relaxed font-sans animate-fade-in shadow-inner">
          <span className="font-mono text-[10px] text-emerald-400 font-bold block mb-1">
            📜 TRANSCRIPCIÓN DEL AUDIO:
          </span>
          <p>{WELCOME_AUDIO_EXPLANATION}</p>
        </div>
      )}
    </div>
  );
};
