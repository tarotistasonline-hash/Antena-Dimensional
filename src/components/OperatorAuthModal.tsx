import React, { useState } from "react";
import { safeStorage } from "../utils/storage";
import { Lock, ShieldCheck, KeyRound, X, Eye, EyeOff, Sparkles } from "lucide-react";

interface OperatorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  masterPinInput: string;
  setMasterPinInput: (val: string) => void;
  masterPinError: string | null;
}

export const OperatorAuthModal: React.FC<OperatorAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  masterPinInput,
  setMasterPinInput,
  masterPinError,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveCustomPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 3) {
      safeStorage.setItem("antena_custom_pin", newPin.trim());
      setPinChangeSuccess(true);
      setTimeout(() => {
        setIsChangingPin(false);
        setPinChangeSuccess(false);
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-slate-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-md w-full overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] relative animate-scale-up text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Consola de Mando & Control Técnico
              </h3>
              <p className="text-[10px] text-indigo-300 font-mono">
                Exclusivo para el creador / administrador de la estación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-bold font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>EXPERIENCIA 100% REALISTA PROTEGIDA</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Los visitantes y amigos que accedan al sitio <strong>no ven los hilos técnicos</strong> ni los paneles de modulación de voz o selectores avanzados. Solo el operador que ingrese este PIN puede calibrar esos parámetros.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUnlock();
            }}
            className="space-y-3.5"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="master-pin-input"
                className="text-[11px] font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center justify-between"
              >
                <span>PIN Maestro de Operador:</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Por defecto: <strong className="text-emerald-400 font-mono">144</strong> ó <strong className="text-emerald-400 font-mono">7777</strong>)
                </span>
              </label>
              <div className="relative">
                <input
                  id="master-pin-input"
                  type={showPin ? "text" : "password"}
                  value={masterPinInput}
                  onChange={(e) => setMasterPinInput(e.target.value)}
                  placeholder="Ingresa 144 o tu clave..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-3 pr-10 text-sm text-slate-100 font-mono focus:outline-none shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  title={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {masterPinError && (
                <p className="text-rose-400 font-mono text-[11px] mt-1">{masterPinError}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>DESBLOQUEAR MANDO TÉCNICO</span>
              </button>
            </div>
          </form>

          {/* Opción para cambiar el PIN personalizado */}
          <div className="border-t border-slate-800 pt-3">
            {!isChangingPin ? (
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                ⚙️ ¿Deseas definir un PIN secreto propio?
              </button>
            ) : (
              <form onSubmit={handleSaveCustomPin} className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-[10px] font-mono text-slate-400 block uppercase">
                  Nuevo PIN Secreto:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Ej. 9876..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[11px] rounded-lg cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
                {pinChangeSuccess && (
                  <p className="text-emerald-400 font-mono text-[10px]">✓ ¡PIN actualizado con éxito!</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Acceso rápido URL: <code className="text-indigo-300">?admin=1</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-slate-200 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
