import React, { useState } from "react";
import { Heart, Users, Coffee, Cpu, HelpCircle, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { trackEvent } from "../mixpanel";

interface FundingWidgetProps {
  visitsCount: number;
}

export default function FundingWidget({ visitsCount }: FundingWidgetProps) {
  const [operatorName, setOperatorName] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);
  const [showDirectLinks, setShowDirectLinks] = useState(false);

  const finalAmount = selectedAmount === -1 ? Number(customAmount) || 0 : selectedAmount;

  const handleSimulateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;

    setIsSimulating(true);
    
    // Track initiation in telemetry
    trackEvent("Inició Simulación de Colaboración", {
      operador: operatorName || "Anónimo",
      monto: finalAmount,
      mensaje: supportMessage,
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedSuccess(true);
      
      // Track success in telemetry
      trackEvent("Colaboración Completada", {
        operador: operatorName || "Anónimo",
        monto: finalAmount,
        mensaje: supportMessage,
      });

      // Reset form after a few seconds
      setTimeout(() => {
        setSimulatedSuccess(false);
        setOperatorName("");
        setSupportMessage("");
      }, 7000);
    }, 2500);
  };

  const handleExternalClick = (platform: string) => {
    trackEvent("Clic Enlace Donación Real", { plataforma: platform });
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-5 backdrop-blur-md space-y-6">
      {/* Encabezado Coaxial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
              Estabilización del Núcleo & Soporte Voluntario
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-sans mt-1">
            Mantén la Antena Dimensional libre de estática cuántica aportando al mantenimiento de la señal.
          </p>
        </div>

        {/* CONTADOR DE VISITAS RETRO */}
        <div className="bg-slate-950 border border-slate-800 rounded px-3.5 py-2 flex items-center gap-3 self-start md:self-auto min-w-[170px] shadow-inner">
          <div className="p-1.5 bg-emerald-500/10 rounded">
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
              Operadores Totales
            </div>
            <div className="text-md font-mono text-emerald-400 font-bold tracking-widest flex items-center gap-1.5">
              <span>{visitsCount.toLocaleString()}</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Contribuciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sección Izquierda: Explicación y Enlaces */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
              ¿Por qué colaborar?
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Cada modulación dimensional y consulta con inteligencias cuánticas consume ciclos de procesamiento neuronal en la nube (Servidores Node.js y API de Gemini). Tu colaboración voluntaria nos ayuda a pagar las cuotas de red y mantener la transmisión 100% abierta y sin límites para todos los operadores de la Tierra.
            </p>
          </div>

          <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-md">
            <span className="text-[9px] font-mono text-slate-400 block uppercase tracking-wider">
              OPCIONES DE SUMINISTRO REAL
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://ko-fi.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalClick("Ko-fi")}
                className="flex items-center gap-2.5 px-3 py-2 bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/30 text-amber-300 rounded text-[10px] font-mono transition-colors group cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span className="flex-1 truncate">Invitar Cafecito (Ko-fi)</span>
                <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href="https://paypal.me"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleExternalClick("PayPal")}
                className="flex items-center gap-2.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-300 rounded text-[10px] font-mono transition-colors group cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="flex-1 truncate">Recargar Núcleo (PayPal)</span>
                <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <button
              onClick={() => setShowDirectLinks(!showDirectLinks)}
              className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 underline cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              {showDirectLinks ? "Ocultar información de cuentas" : "Ver opciones alternativas de transferencia"}
            </button>

            {showDirectLinks && (
              <div className="mt-2.5 p-2.5 bg-slate-950 border border-slate-900 rounded text-[9px] font-mono text-slate-400 space-y-1.5 leading-relaxed">
                <p>💡 <span className="text-slate-300 font-bold">MercadoPago / Alias:</span> <code className="text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">antena.dimensional.mp</code></p>
                <p>🌐 <span className="text-slate-300 font-bold">Criptomonedas (USDT - Tron TRC20):</span> <code className="text-indigo-400 bg-indigo-950/40 px-1 py-0.5 rounded block truncate select-all">TX5pXzD9X...[Haga clic para copiar]</code></p>
                <p className="text-[8px] text-slate-500 italic mt-1">
                  *Las donaciones voluntarias son 100% no reembolsables y apoyan directamente la infraestructura física de esta antena.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sección Derecha: Simulador de Contribución Interactiva */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <h5 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Simulador Coaxial de Estabilidad
            </h5>
            <span className="text-[8px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-900 px-1.5 py-0.5 rounded uppercase">
              Red Piloto
            </span>
          </div>

          {simulatedSuccess ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h6 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  ¡Transmisión Estabilizada!
                </h6>
                <p className="text-[10px] text-slate-300 max-w-sm mx-auto leading-relaxed">
                  El operador <span className="text-indigo-300 font-mono font-bold">{operatorName || "Anónimo"}</span> ha inyectado <span className="text-emerald-300 font-mono font-bold">${finalAmount} USD</span> de energía cuántica. El núcleo coaxial se reporta estable al <span className="text-teal-400 font-mono">100%</span>.
                </p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono text-slate-400 italic max-w-xs mx-auto">
                "{supportMessage || "¡Excelente transmisión! Mantengan la antena calibrada."}"
              </div>
              <p className="text-[8px] text-slate-500">
                La oscilación regresará a su frecuencia basal en unos segundos...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSimulateDonation} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Indicativo / Nombre
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Operador_Alpha"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Suministro Cuántico
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[2, 5, 10, -1].map((amt) => {
                      const isCustom = amt === -1;
                      const isSelected = selectedAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(amt);
                            if (!isCustom) setCustomAmount("");
                          }}
                          className={`text-[9px] font-mono border rounded py-1 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-400 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {isCustom ? "Otro" : `$${amt}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedAmount === -1 && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                    Monto Personalizado ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Monto en dólares"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
                  Mensaje para el Espectro
                </label>
                <textarea
                  placeholder="Escribe un susurro de aliento o coordenadas cuánticas para los logs..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  maxLength={150}
                  rows={2}
                  className="w-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border border-indigo-500/30 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSimulating ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Calibrando Oscilador Coaxial...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-pulse" />
                    Transmitir Aporte e Inyectar Estabilidad
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
