import React, { useState } from "react";
import {
  X,
  Lightbulb,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { SuggestionsBlogView } from "./SuggestionsBlogView";

export interface SuggestionsBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorName: string;
  addToast: (title: string, message: string, type?: "anomaly" | "high-intensity") => void;
  onOpenAsTab?: () => void;
}

export const SuggestionsBlogModal: React.FC<SuggestionsBlogModalProps> = ({
  isOpen,
  onClose,
  operatorName,
  addToast,
  onOpenAsTab,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in ${
        isMaximized ? "p-0" : ""
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-slate-950 border border-amber-500/50 flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.2)] transition-all duration-200 overflow-hidden ${
          isMaximized
            ? "w-full h-full rounded-none border-none"
            : "w-full max-w-5xl h-[94vh] sm:h-auto sm:max-h-[92vh] rounded-2xl"
        }`}
      >
        {/* Header del Modal */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div className="truncate">
              <h2 className="text-xs sm:text-sm md:text-base font-mono font-bold text-amber-300 uppercase tracking-wider truncate flex items-center gap-2">
                <span>📜 BLOG & IDEAS MULTIDIMENSIONALES</span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-sans truncate">
                Foro abierto para proponer y votar frecuencias, entidades ET y funciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Abrir como pestaña completa */}
            {onOpenAsTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAsTab();
                }}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Abrir como Pestaña Completa en la Antena"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Pestaña Completa</span>
              </button>
            )}

            {/* Maximizar / Restaurar */}
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isMaximized ? "Restaurar tamaño normal" : "Maximizar a Pantalla Completa"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 text-amber-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Scroll Completo Seguro */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          <SuggestionsBlogView
            operatorName={operatorName}
            addToast={addToast}
            isInsideModal={true}
            onOpenAsTab={() => {
              onClose();
              if (onOpenAsTab) onOpenAsTab();
            }}
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
          />
        </div>

        {/* Footer del Modal */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono shrink-0">
          <span className="text-slate-500 text-[10px] truncate pr-2">
            Red de Feedback Multidimensional • Sintonizador Antena
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsBlogModal;
