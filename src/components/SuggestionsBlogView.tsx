import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Send,
  Clock,
  Radio,
  Flame,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  BookOpen,
  PenTool,
  X,
  ExternalLink,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { logTelemetryEvent } from "../cloudCounter";

export interface SuggestionComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Suggestion {
  id: string;
  title: string;
  author: string;
  category: string;
  content: string;
  votes: number;
  votedBy: string[];
  status: "En Evaluación" | "En Desarrollo" | "Implementado" | "Completado";
  comments: SuggestionComment[];
  createdAt: string;
}

export interface SuggestionsBlogViewProps {
  operatorName: string;
  addToast: (title: string, message: string, type?: "anomaly" | "high-intensity") => void;
  isInsideModal?: boolean;
  onOpenAsTab?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const CATEGORIES = [
  "Todas",
  "Frecuencias",
  "Entidades ET",
  "Hardware",
  "Interfaz",
  "General",
];

export const SuggestionsBlogView: React.FC<SuggestionsBlogViewProps> = ({
  operatorName,
  addToast,
  isInsideModal = false,
  onOpenAsTab,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");

  // Tab mode in mobile/compact view: 'feed' or 'publish'
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "publish">("feed");

  // New Suggestion Form state
  const [isInlineFormOpen, setIsInlineFormOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>(operatorName || "Operador Local");
  const [newCategory, setNewCategory] = useState<string>("Frecuencias");
  const [newContent, setNewContent] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active expanded comment section per suggestion
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingLoading, setCommentingLoading] = useState<Record<string, boolean>>({});

  // Expanded full text per suggestion
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});

  const getLocalDistinctId = () => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("antena_local_distinct_id");
      if (!id) {
        id = "op_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("antena_local_distinct_id", id);
      }
      return id;
    }
    return "op_local";
  };

  const distinctId = getLocalDistinctId();

  // Load suggestions from API with fallback to initial seed
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.warn("Error al cargar sugerencias desde el servidor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  // Sync author if operatorName changes
  useEffect(() => {
    if (operatorName && !newAuthor) {
      setNewAuthor(operatorName);
    }
  }, [operatorName]);

  // Handle upvote
  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: distinctId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions((prev) =>
          prev.map((item) => {
            if (item.id === id) {
              const votedBy = item.votedBy || [];
              const hasVoted = votedBy.includes(distinctId);
              const nextVotedBy = hasVoted
                ? votedBy.filter((v) => v !== distinctId)
                : [...votedBy, distinctId];
              return {
                ...item,
                votes: data.votes,
                votedBy: nextVotedBy,
              };
            }
            return item;
          })
        );
        logTelemetryEvent("sintonizacion", `Voto en sugerencia ${id}`);
      }
    } catch (err) {
      console.warn("Error voting:", err);
    }
  };

  // Handle Submit New Suggestion
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      addToast("CAMPOS INCOMPLETOS", "Por favor ingresa un título y el detalle de tu propuesta.", "anomaly");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          author: newAuthor.trim() || operatorName || "Operador Anónimo",
          category: newCategory,
          content: newContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          setSuggestions((prev) => [data.suggestion, ...prev]);
        }
        setNewTitle("");
        setNewContent("");
        setIsInlineFormOpen(false);
        setActiveSubTab("feed");
        addToast("SUGERENCIA PUBLICADA", "Tu propuesta ha sido compartida en la Red Multidimensional.", "high-intensity");
        logTelemetryEvent("sintonizacion", `Nueva sugerencia: ${newTitle}`);
      } else {
        addToast("AVISO", "El servidor no pudo procesar la sugerencia.", "anomaly");
      }
    } catch (err) {
      addToast("ERROR DE RED", "No se pudo transmitir la sugerencia al servidor.", "anomaly");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (suggestionId: string) => {
    const text = commentInputs[suggestionId]?.trim();
    if (!text) return;

    try {
      setCommentingLoading((prev) => ({ ...prev, [suggestionId]: true }));
      const res = await fetch(`/api/suggestions/${suggestionId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: operatorName || newAuthor || "Operador Local",
          content: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions((prev) =>
          prev.map((item) => {
            if (item.id === suggestionId) {
              return {
                ...item,
                comments: [...(item.comments || []), data.comment],
              };
            }
            return item;
          })
        );
        setCommentInputs((prev) => ({ ...prev, [suggestionId]: "" }));
        addToast("COMENTARIO REGISTRADO", "Tu aporte ha sido acoplado a la sugerencia.", "high-intensity");
        logTelemetryEvent("sintonizacion", `Comentario añadido a sugerencia ${suggestionId}`);
      }
    } catch (err) {
      console.warn("Error adding comment:", err);
    } finally {
      setCommentingLoading((prev) => ({ ...prev, [suggestionId]: false }));
    }
  };

  // Filter & Sort Logic
  const filteredSuggestions = suggestions
    .filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas" || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        return b.votes - a.votes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalVotesCount = suggestions.reduce((acc, curr) => acc + (curr.votes || 0), 0);
  const implementedCount = suggestions.filter(
    (s) => s.status === "Implementado" || s.status === "Completado"
  ).length;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Barra Superior / Selector de Vista en Móvil y Métricas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-pestañas: Ver Publicaciones vs Publicar */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("feed");
              setIsInlineFormOpen(false);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "feed"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Ver Publicaciones ({suggestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab("publish");
              setIsInlineFormOpen(true);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "publish" || isInlineFormOpen
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black"
                : "text-amber-400 hover:bg-amber-950/40"
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>✍️ Publicar Propuesta</span>
          </button>
        </div>

        {/* Métricas Rápidas & Acciones de Pantalla */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400">
              Votos: <strong className="text-indigo-300 font-bold">{totalVotesCount}</strong>
            </span>
            <span className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hidden xs:inline-flex">
              Implementadas: <strong className="text-emerald-400 font-bold">{implementedCount}</strong>
            </span>
          </div>

          {/* Botones de utilidad cuando está dentro del modal */}
          {isInsideModal && (
            <div className="flex items-center gap-1.5">
              {onToggleMaximize && (
                <button
                  type="button"
                  onClick={onToggleMaximize}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isMaximized ? "Restaurar tamaño normal" : "Maximizar a pantalla completa"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
                </button>
              )}
              {onOpenAsTab && (
                <button
                  type="button"
                  onClick={onOpenAsTab}
                  className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Abrir como pestaña principal de la aplicación"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Pestaña Completa</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO DE PUBLICACIÓN DEDICADO (Visible en modo 'publish' o cuando isInlineFormOpen es true) */}
      {(activeSubTab === "publish" || isInlineFormOpen) && (
        <section className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold font-mono text-amber-300 uppercase tracking-wide">
                  PUBLICAR NUEVA SUGERENCIA O IDEA
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Tu propuesta se guardará de forma permanente y podrá ser votada y comentada por la comunidad.
                </p>
              </div>
            </div>

            {activeSubTab === "feed" && isInlineFormOpen && (
              <button
                type="button"
                onClick={() => setIsInlineFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitNew} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Título */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Título de la Sugerencia *</span>
                  <span className="text-[10px] text-amber-400 font-normal">(Breve y descriptivo)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Frecuencia 963 Hz para Arcturus o Sonidos Binaurales..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans transition-all"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Categoría</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none font-mono cursor-pointer transition-all"
                >
                  {CATEGORIES.filter((c) => c !== "Todas").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Nombre de Operador */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Nombre de Operador / Autor</span>
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Tu nombre o indicativo"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none font-mono transition-all"
                />
              </div>

              {/* Detalle de la propuesta */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Explicación / Detalle de la Idea *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe detalladamente qué frecuencia, entidad, función o mejora sugieres para la Antena Interdimensional..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans resize-y min-h-[100px] transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              {activeSubTab === "publish" && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("feed");
                    setIsInlineFormOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  Volver a las Publicaciones
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "PUBLICANDO EN LA RED..." : "🚀 PUBLICAR SUGERENCIA"}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FILTROS, ORDENAMIENTO Y BÚSQUEDA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Categorías en Pills con scroll horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setSortBy("popular")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                sortBy === "popular"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/80 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>MÁS POPULARES</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy("recent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                sortBy === "recent"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>MÁS RECIENTES</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por palabra clave, temática o nombre de operador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/70 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none font-sans transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* LISTADO DE PUBLICACIONES / SUGERENCIAS */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Radio className="w-8 h-8 animate-spin text-amber-400" />
            <span>Sincronizando banco de sugerencias multidimensionales...</span>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <Lightbulb className="w-10 h-10 text-amber-500/60 mx-auto animate-pulse" />
            <h4 className="text-sm font-mono font-bold text-slate-300">
              No se encontraron sugerencias con los filtros aplicados.
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ¿Tienes una idea para la Antena? Sé el primero en publicarla tocando el botón de abajo:
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("publish");
                setIsInlineFormOpen(true);
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>PUBLICAR NUEVA SUGERENCIA</span>
            </button>
          </div>
        ) : (
          filteredSuggestions.map((item) => {
            const votedBy = item.votedBy || [];
            const hasVoted = votedBy.includes(distinctId);
            const isCommentsExpanded = !!expandedComments[item.id];
            const isTextExpanded = !!expandedText[item.id];
            const isLong = item.content.length > 280;

            return (
              <article
                key={item.id}
                id={`suggestion-${item.id}`}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all shadow-md"
              >
                {/* Cabecera del Post */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Categoría Badge */}
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-md">
                        {item.category}
                      </span>

                      {/* Estado Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                          item.status === "Implementado" || item.status === "Completado"
                            ? "bg-emerald-950/90 text-emerald-300 border-emerald-600/70"
                            : item.status === "En Desarrollo"
                            ? "bg-indigo-950/90 text-indigo-300 border-indigo-600/70 animate-pulse"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        {item.status === "Implementado" && "✅ IMPLEMENTADO"}
                        {item.status === "En Desarrollo" && "🚀 EN DESARROLLO"}
                        {item.status === "En Evaluación" && "🔍 EN EVALUACIÓN"}
                      </span>

                      {/* Autor */}
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        por <strong className="text-slate-200">{item.author}</strong>
                      </span>
                    </div>

                    {/* Título de la Sugerencia */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 font-sans leading-snug pt-0.5">
                      {item.title}
                    </h3>
                  </div>

                  {/* Fecha */}
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 self-start">
                    {new Date(item.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Contenido / Texto del Post */}
                <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                    {isLong && !isTextExpanded
                      ? `${item.content.substring(0, 280)}...`
                      : item.content}
                  </p>

                  {isLong && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedText((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      {isTextExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Mostrar menos</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Leer completo...</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Barra de Acciones: Votos, Comentarios y Detalles */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    {/* Botón de Votación / Apoyo */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        hasVoted
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                          : "bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasVoted ? "text-amber-400 fill-amber-400" : ""}`} />
                      <span className="font-mono text-sm">{item.votes || 0}</span>
                      <span className="text-[11px] font-normal hidden xs:inline">
                        {hasVoted ? "¡Apoyado!" : "Apoyar Idea"}
                      </span>
                    </button>

                    {/* Botón Desplegar Comentarios */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all ${
                        isCommentsExpanded
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/70"
                          : "bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span className="font-mono">{item.comments?.length || 0}</span>
                      <span className="text-[11px] font-normal hidden xs:inline">Comentarios</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {item.id.substring(0, 10)}
                  </span>
                </div>

                {/* SECCIÓN DESPLEGABLE DE COMENTARIOS */}
                {isCommentsExpanded && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Aportes y Comentarios de la Comunidad:</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {item.comments?.length || 0} mensajes
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {!item.comments || item.comments.length === 0 ? (
                        <p className="text-xs font-mono text-slate-500 italic py-2">
                          Aún no hay comentarios en esta propuesta. ¡Sé el primero en aportar!
                        </p>
                      ) : (
                        item.comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/90 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {comm.author}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                {new Date(comm.timestamp).toLocaleString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">
                              {comm.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input para agregar comentario */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <input
                        type="text"
                        placeholder="Escribe tu aporte o comentario..."
                        value={commentInputs[item.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddComment(item.id);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none font-sans"
                      />
                      <button
                        type="button"
                        disabled={commentingLoading[item.id]}
                        onClick={() => handleAddComment(item.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{commentingLoading[item.id] ? "..." : "Enviar"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SuggestionsBlogView;
