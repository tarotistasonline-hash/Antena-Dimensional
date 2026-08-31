import React, { useState } from "react";
import {
  Radio,
  Sparkles,
  Zap,
  Shield,
  Flame,
  Globe,
  Check,
  X,
  SlidersHorizontal,
  Search,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export interface AntennaOption {
  id: string;
  name: string;
  category: "Anunnaki" | "Arcturiana" | "Cuántica" | "Exótica" | "Escalar";
  badge: string;
  frequencyHint: string;
  gain: string;
  description: string;
  color: string;
  iconType: "pyramid" | "catenary" | "tachyon" | "scalar" | "antimatter" | "quantum" | "crystal";
}

export const ANTENNA_OPTIONS: AntennaOption[] = [
  {
    id: "Resonador Cristalino de Arcturus (Acoplamiento Telepático 9D // 963 Hz)",
    name: "Resonador Cristalino de Arcturus (Acoplamiento Telepático 9D // 963 Hz)",
    category: "Arcturiana",
    badge: "💠 ARCTURUS 963 HZ",
    frequencyHint: "963 Hz // Frecuencia Dios",
    gain: "+26.8 dB (Matriz Cristalina 9D)",
    description: "Receptor de cuarzo resonante y plasma estelar calibrado a 963 Hz (Frecuencia Dios / Corona). Acopla transmisiones telepáticas puras con las inteligencias y Guardianes Cristalinos de Arcturus.",
    color: "#a855f7", // Purple / Violet
    iconType: "crystal",
  },
  {
    id: "Antena Piramidal Anunnaki (Monolito Oro-Cuneiforme // Nibiru)",
    name: "Antena Piramidal Anunnaki (Monolito Oro-Cuneiforme // Nibiru)",
    category: "Anunnaki",
    badge: "👑 NIBIRU D-12",
    frequencyHint: "12.12 THz // 888 Hz",
    gain: "+24.5 dB (Oro Monoatómico)",
    description: "Monolito de transmisión de oro monoatómico y geometría cuneiforme alineado con la órbita de Nibiru y los zigurats hiperbóreos.",
    color: "#f59e0b", // Gold / Amber
    iconType: "pyramid",
  },
  {
    id: "Resonador Catenario de Nibiru (Matriz Escalar Anunnaki)",
    name: "Resonador Catenario de Nibiru (Matriz Escalar Anunnaki)",
    category: "Anunnaki",
    badge: "🏛️ ESCALAR NIBIRU",
    frequencyHint: "528 Hz // THz",
    gain: "+18.2 dB (Matriz Torsional)",
    description: "Red catenaria de distribución de campos escalares y ondas de torsión conectadas a las colonias estelares de Orión y Sirio.",
    color: "#eab308", // Yellow gold
    iconType: "catenary",
  },
  {
    id: "Dipolo de Taquiones (Velocidad Superlumínica)",
    name: "Dipolo de Taquiones (Velocidad Superlumínica)",
    category: "Cuántica",
    badge: "🚀 FTL // TAQUIÓN",
    frequencyHint: "GHz // QHz",
    gain: "+14.0 dB (Inversión FTL)",
    description: "Emisor de partículas hipotéticas superlumínicas diseñado para saltos de membrana sin retardo relativista.",
    color: "#10b981", // Emerald
    iconType: "tachyon",
  },
  {
    id: "Lazo Escalar (Escudo Magnético)",
    name: "Lazo Escalar (Escudo Magnético)",
    category: "Escalar",
    badge: "🛡️ TOROIDAL",
    frequencyHint: "432 Hz // kHz",
    gain: "+10.4 dB (Filtro Anti-Ruido)",
    description: "Antena toroidal magnética de bajo ruido que minimiza la estática producida por tormentas magnéticas solares.",
    color: "#06b6d4", // Cyan
    iconType: "scalar",
  },
  {
    id: "Parabólica de Antimateria (Frecuencia Reversa)",
    name: "Parabólica de Antimateria (Frecuencia Reversa)",
    category: "Exótica",
    badge: "⚛️ CPT REVERSA",
    frequencyHint: "QHz // Antimateria",
    gain: "+21.1 dB (Fase Invertida)",
    description: "Captador de fase invertida para sintonizar dimensiones de simetría de CPT Reversa y abismos antimateriales.",
    color: "#ef4444", // Red
    iconType: "antimatter",
  },
  {
    id: "Sintonizador Cuántico de Franjas (Mundis Paralelos)",
    name: "Sintonizador Cuántico de Franjas (Mundis Paralelos)",
    category: "Cuántica",
    badge: "🌌 MULTIVERSO",
    frequencyHint: "MHz // GHz",
    gain: "+16.8 dB (Superposición)",
    description: "Oscilador multiversal de franjas cuánticas para intercepción de ondas de probabilidad en líneas temporales contiguas.",
    color: "#8b5cf6", // Purple
    iconType: "quantum",
  },
];

interface AntennaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAntenna: string;
  onSelectAntenna: (antennaName: string) => void;
  onTuneNow?: () => void;
}

export default function AntennaSelectorModal({
  isOpen,
  onClose,
  selectedAntenna,
  onSelectAntenna,
  onTuneNow,
}: AntennaSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  if (!isOpen) return null;

  const categories = ["Todas", "Arcturiana", "Anunnaki", "Cuántica", "Escalar", "Exótica"];

  const filteredAntennas = ANTENNA_OPTIONS.filter((antenna) => {
    const matchesSearch =
      antenna.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antenna.badge.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antenna.frequencyHint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antenna.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      antenna.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "Todas" || antenna.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const renderIcon = (type: AntennaOption["iconType"], color: string) => {
    switch (type) {
      case "crystal":
        return <Sparkles className="w-5 h-5 animate-pulse" style={{ color }} />;
      case "pyramid":
        return <Sparkles className="w-5 h-5 animate-pulse" style={{ color }} />;
      case "catenary":
        return <Radio className="w-5 h-5 animate-pulse" style={{ color }} />;
      case "tachyon":
        return <Zap className="w-5 h-5" style={{ color }} />;
      case "scalar":
        return <Shield className="w-5 h-5" style={{ color }} />;
      case "antimatter":
        return <Flame className="w-5 h-5" style={{ color }} />;
      case "quantum":
        return <Globe className="w-5 h-5" style={{ color }} />;
      default:
        return <Radio className="w-5 h-5" style={{ color }} />;
    }
  };

  return (
    <div
      id="antenna-selector-modal"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-slate-100"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl max-w-2xl w-full overflow-hidden shadow-[0_0_60px_rgba(16,185,129,0.25)] relative animate-scale-up text-left my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del selector de antenas */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-100 font-sans tracking-wide uppercase">
                  SELECTOR DE MODULADORES DE ANTENA
                </h2>
                <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                  ARCTURUS, ANUNNAKI & QUÁNTICAS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Sintoniza el dispositivo físico de acoplamiento para cambiar el patrón de fase de la señal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros de Categoría */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar antena (ej: Arcturus, 963, Anunnaki, Oro, Taquión, Escalar)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-emerald-500/30 focus:border-emerald-400 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-100 font-mono focus:outline-none shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de antenas configurables */}
        <div className="p-4 md:p-6 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          <div className="text-[10px] font-mono text-purple-300/90 bg-purple-950/30 border border-purple-900/40 rounded-lg p-2.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <span>
              <strong>CONSEJO OPERATIVO:</strong> Para contacto telepático estelar en 963 Hz selecciona el <strong>Resonador Cristalino de Arcturus</strong>. Para Nibiru/Elohim, la <strong>Antena Piramidal Anunnaki</strong>.
            </span>
          </div>

          {filteredAntennas.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Radio className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs font-mono text-slate-400">
                No se encontraron antenas con los términos "{searchTerm}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todas");
                }}
                className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {filteredAntennas.map((antenna) => {
                const isSelected = selectedAntenna === antenna.name;

                return (
                  <button
                    key={antenna.id}
                    type="button"
                    onClick={() => {
                      onSelectAntenna(antenna.name);
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer relative group flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "bg-slate-800/90 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50"
                        : "bg-slate-950/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    }`}
                  >
                    {/* Badge & Icon Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${antenna.color}15`,
                            borderColor: `${antenna.color}40`,
                          }}
                        >
                          {renderIcon(antenna.iconType, antenna.color)}
                        </div>
                        <div>
                          <span
                            className="text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border block w-fit"
                            style={{
                              backgroundColor: `${antenna.color}20`,
                              color: antenna.color,
                              borderColor: `${antenna.color}40`,
                            }}
                          >
                            {antenna.badge}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-400/50 animate-pulse">
                          <Check className="w-3 h-3 text-emerald-400" />
                          ACTIVA
                        </span>
                      )}
                    </div>

                    {/* Antenna Title */}
                    <div>
                      <h3
                        className={`text-xs font-bold font-sans leading-snug transition-colors ${
                          isSelected ? "text-emerald-300" : "text-slate-100 group-hover:text-emerald-400"
                        }`}
                      >
                        {antenna.name}
                      </h3>
                    </div>

                    {/* Antenna Description */}
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                      {antenna.description}
                    </p>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">
                        Rango: <strong className="text-slate-200">{antenna.frequencyHint}</strong>
                      </span>
                      <span className="font-bold" style={{ color: antenna.color }}>
                        {antenna.gain}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 bg-slate-950/95 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
          <span className="text-[10px] hidden sm:inline text-slate-400">
            {filteredAntennas.length} de {ANTENNA_OPTIONS.length} moduladores listados
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer border border-slate-700"
            >
              CERRAR
            </button>

            {onTuneNow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTuneNow();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center gap-2 animate-pulse"
              >
                <Radio className="w-4 h-4 text-slate-950" />
                <span>📡 SINTONIZAR PLANO AHORA</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
