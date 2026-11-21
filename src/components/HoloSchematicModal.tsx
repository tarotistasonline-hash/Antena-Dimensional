import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Film,
  Image as ImageIcon,
  Radio,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Smartphone,
} from "lucide-react";

export const SCHEMATIC_IMAGE_SRC = "/assets/aistudio/731814793_1795274689308385_cb612faf.jpg";
export const DEMO_VIDEO_SRC = "/assets/aistudio/999572706_1795274618083370_dcd9dd3a.mp4";

interface HoloSchematicModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "image" | "video";
}

export const HoloSchematicModal: React.FC<HoloSchematicModalProps> = ({
  isOpen,
  onClose,
  initialTab = "image",
}) => {
  const [activeTab, setActiveTab] = useState<"image" | "video">(initialTab);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setZoomLevel(1);
    }
  }, [isOpen, initialTab]);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Manejo de video al cambiar de pestaña
  useEffect(() => {
    if (activeTab === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    } else if (activeTab === "image" && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Holo-Esquema y Registro Visual de Antena Dimensional"
      className="fixed inset-0 z-[10060] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${
          isFullWidth ? "max-w-7xl" : "max-w-5xl"
        } bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-4 transition-all duration-300 flex flex-col max-h-[94vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del visor */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  CREADO CON FLOW
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Holo-Archivo de la Estación
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
                Esquema Técnico &amp; Demostración de Enlace
              </h2>
            </div>
          </div>

          {/* Selector de pestañas: Infografía / Video */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "image"
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Infografía HD</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "video"
                  ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video en Móvil</span>
            </button>
          </div>

          {/* Controles de ventana */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer hidden md:flex"
              title={isFullWidth ? "Reducir ventana" : "Expandir ventana a tamaño máximo"}
            >
              {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-200 border border-slate-700 hover:border-rose-500/60 cursor-pointer transition-colors"
              aria-label="Cerrar visor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido principal según pestaña */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === "image" ? (
            <div className="space-y-3">
              {/* Barra de herramientas para la infografía */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-cyan-400 font-bold">UNDERSTANDING &apos;ANTENA DIMENSIONAL&apos;</span>
                  <span className="hidden sm:inline text-slate-500">|</span>
                  <span className="hidden sm:inline text-slate-400">Sci-Fi Waveform Tracker &amp; Signal Analyzer</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.75}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                    title="Alejar (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2.5}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                    title="Acercar (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
                    title="Restablecer tamaño (100%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={SCHEMATIC_IMAGE_SRC}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/60 text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Abrir imagen original completa en una nueva pestaña"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>HD Original</span>
                  </a>
                </div>
              </div>

              {/* Contenedor con scroll para zoom */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner max-h-[58vh] flex items-center justify-center p-1 sm:p-2">
                <div
                  className="transition-transform duration-200 ease-out origin-center overflow-auto max-w-full max-h-full"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={SCHEMATIC_IMAGE_SRC}
                    alt="Esquema conceptual Sci-Fi de Antena Dimensional creado con Flow"
                    className="rounded-lg object-contain w-full max-h-[54vh] select-none shadow-2xl"
                    loading="eager"
                  />
                </div>
              </div>

              {/* Ficha explicativa del esquema */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono font-bold text-[11px]">
                    <Radio className="w-3.5 h-3.5" />
                    <span>FRECUENCIA &amp; TELEMETRÍA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Monitor crono-frecuencial (01:10.04) con detección automática de movimiento y modulación de armónicos cósmicos.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-fuchsia-300 font-mono font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>RADAR &amp; VÓRTICE CENTRAL</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Núcleo cuántico concéntrico que estabiliza el canal transdimensional hacia coordenadas extraterrestres.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-[11px]">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>SINTONIZADOR &amp; ESPECTRO</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Barras de análisis FFT en vivo (Live Frequency) y oscilograma de onda que validan la recepción de la señal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Barra de herramientas para el video */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Smartphone className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-fuchsia-300 font-bold">DEMOSTRACIÓN EN SMARTPHONE</span>
                  <span className="hidden sm:inline text-slate-500">|</span>
                  <span className="hidden sm:inline text-slate-400">Activación del Transceptor y Apertura del Vórtice</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {isVideoPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                    <span>{isVideoPlaying ? "Pausar" : "Reproducir"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] flex items-center gap-1 cursor-pointer"
                    title={isVideoMuted ? "Activar audio" : "Silenciar video"}
                  >
                    {isVideoMuted ? <VolumeX className="w-3 h-3 text-slate-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
                    <span>{isVideoMuted ? "Activar Audio" : "Silenciado"}</span>
                  </button>
                </div>
              </div>

              {/* Reproductor de video estilizado */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl max-h-[58vh] flex items-center justify-center p-2">
                <video
                  ref={videoRef}
                  src={DEMO_VIDEO_SRC}
                  playsInline
                  autoPlay
                  loop
                  muted={isVideoMuted}
                  className="rounded-lg object-contain w-full max-h-[54vh] shadow-2xl cursor-pointer"
                  onClick={toggleVideoPlayback}
                />
              </div>

              {/* Explicación de la simulación */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-fuchsia-300 font-mono font-bold">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>REGISTRO EN VIVO CON FLOW (GOOGLE)</span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                  Este clip de 7 segundos ilustra la experiencia de un operador utilizando la <strong className="text-white">Antena Dimensional</strong> en su smartphone: tras interactuar con la interfaz en pantalla, activa el transceptor y el vórtice cósmico se expande a pantalla completa con sintonización cuántica inmersiva.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer del visor */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arte y Registro Visual Generado por el Operador con Flow</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold transition-all cursor-pointer"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoloSchematicModal;
