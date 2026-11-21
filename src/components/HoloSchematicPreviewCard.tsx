import React, { useState } from "react";
import {
  Sparkles,
  Maximize2,
  Film,
  Image as ImageIcon,
  Play,
  ExternalLink,
  ChevronRight,
  Radio,
} from "lucide-react";
import { SCHEMATIC_IMAGE_SRC, DEMO_VIDEO_SRC } from "./HoloSchematicModal";

interface HoloSchematicPreviewCardProps {
  onOpenModal: (tab: "image" | "video") => void;
  compact?: boolean;
}

export const HoloSchematicPreviewCard: React.FC<HoloSchematicPreviewCardProps> = ({
  onOpenModal,
  compact = false,
}) => {
  const [activeMedia, setActiveMedia] = useState<"image" | "video">("image");

  return (
    <div
      aria-label="Ficha Holo-Esquema Técnico Flow"
      className="bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md transition-all duration-300 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-700/60">
                ARTE &amp; ESQUEMA FLOW
              </span>
              <span className="text-[10px] font-mono text-emerald-400 hidden sm:inline">
                ● 1920x1080 HD
              </span>
            </div>
            <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
              Esquema Técnico &amp; Demostración de Enlace
            </h4>
          </div>
        </div>

        {/* Botones de selección rápida entre Infografía y Video */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setActiveMedia("image")}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeMedia === "image"
                ? "bg-cyan-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Infografía</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMedia("video")}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeMedia === "video"
                ? "bg-fuchsia-600 text-white font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Video Móvil</span>
          </button>
        </div>
      </div>

      {/* Vista previa en formato 16:9 estilizado */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Contenedor de la miniatura interactiva */}
        <div className="md:col-span-7 relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center cursor-pointer shadow-lg"
          onClick={() => onOpenModal(activeMedia)}
        >
          {activeMedia === "image" ? (
            <img
              src={SCHEMATIC_IMAGE_SRC}
              alt="Miniatura del Esquema Sci-Fi de Antena Dimensional"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
              <video
                src={DEMO_VIDEO_SRC}
                playsInline
                autoPlay
                loop
                muted
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-fuchsia-600/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.7)] group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                </div>
              </div>
            </div>
          )}

          {/* Overlay de hover para abrir en grande */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity flex items-end p-2.5">
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-cyan-200">
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-cyan-400" />
                <span>Haz clic para ampliar en HD</span>
              </span>
              <span className="text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {activeMedia === "image" ? "Diagrama Sci-Fi" : "Clip 7 seg"}
              </span>
            </div>
          </div>
        </div>

        {/* Ficha explicativa y acciones rápidas */}
        <div className="md:col-span-5 space-y-2.5 text-left">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeMedia === "image" ? "Diagrama: Understanding Antena" : "Demostración: Portal Móvil"}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {activeMedia === "image"
                ? "Infografía técnica de estilo cyberpunk que ilustra los componentes de la estación: monitor de frecuencia, deslizadores de resonancia y radar del vórtice."
                : "Demostración de sintonización del transceptor en un smartphone en mano, con la apertura y giro del portal a pantalla completa."}
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenModal("image")}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>Ver Infografía HD</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenModal("video")}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/50 text-fuchsia-200 font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Film className="w-3 h-3 text-fuchsia-400" />
              <span>Ver Video Demostración</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoloSchematicPreviewCard;
