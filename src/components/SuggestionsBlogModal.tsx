import React, { useState, useEffect } from "react";
import {
  X,
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Radio,
  Flame,
  Filter,
  User,
  Trash2,
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

interface SuggestionsBlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorName: string;
  addToast: (title: string, message: string, type?: "anomaly" | "high-intensity") => void;
}

const CATEGORIES = [
  "Todas",
  "Frecuencias",
  "Entidades ET",
  "Hardware",
  "Interfaz",
  "General",
];

export const SuggestionsBlogModal: React.FC<SuggestionsBlogModalProps> = ({
  isOpen,
  onClose,
  operatorName,
  addToast,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  
  // New Suggestion Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>(operatorName || "Operador Local");
  const [newCategory, setNewCategory] = useState<string>("Frecuencias");
  const [newContent, setNewContent] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active expanded comment section per suggestion
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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

  // Load suggestions from API
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/suggestions");
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.warn("Error al cargar sugerencias:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        logTelemetryEvent("sintonizacion", `Voto registrado en sugerencia: ${id}`);
      }
    } catch (err) {
      console.warn("Error voting:", err);
    }
  };

  // Handle Submit New Suggestion
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      addToast("CAMPOS INCOMPLETOS", "Por favor completa el título y detalle de la propuesta.", "anomaly");
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
        setIsFormOpen(false);
        addToast("SUGERENCIA PUBLICADA", "Tu propuesta ha sido compartida en la Red Multidimensional.", "high-intensity");
        logTelemetryEvent("sintonizacion", `Nueva sugerencia publicada: ${newTitle}`);
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
      const res = await fetch(`/api/suggestions/${suggestionId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: operatorName || "Operador Local",
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
  const implementedCount = suggestions.filter((s) => s.status === "Implementado" || s.status === "Completado").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                📜 BLOG DE SUGERENCIAS & IDEAS MULTIDIMENSIONALES
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Foro abierto para proponer nuevas frecuencias, entidades ET y funciones para la Antena.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Métricas y Barra de Acción Principal */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Total Ideas:</span>
              <strong className="text-amber-400 font-bold">{suggestions.length}</strong>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400">Votos Acumulados:</span>
              <strong className="text-indigo-300 font-bold">{totalVotesCount}</strong>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 hidden sm:flex">
              <span className="text-slate-400">Implementadas:</span>
              <strong className="text-emerald-400 font-bold">{implementedCount}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{isFormOpen ? "CERRAR FORMULARIO" : "PUBLICAR NUEVA SUGERENCIA"}</span>
          </button>
        </div>

        {/* Formulario de Nueva Sugerencia (Desplegable) */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmitNew}
            className="p-4 bg-slate-950 border-b border-amber-500/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                NUEVA PROPUESTA PARA LA ANTENA:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Se guardará en la base de datos multidimensional
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block">Título de la Sugerencia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Canal de sintonización Arcturiano en 963 Hz..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 block">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-mono cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c !== "Todas").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-mono text-slate-400 block">Nombre del Operador</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block">Detalle / Explicación de la Idea *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe qué frecuencia, función o mejora te gustaría ver en la Antena..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none font-sans resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-mono cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "ENVIANDO..." : "PUBLICAR SUGERENCIA"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Filtros, Búsqueda y Pestañas */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Categorías en Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    selectedCategory === cat
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setSortBy("popular")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer border ${
                  sortBy === "popular"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/80"
                    : "bg-slate-900 text-slate-500 border-slate-800"
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>MÁS POPULARES</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy("recent")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer border ${
                  sortBy === "recent"
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/80"
                    : "bg-slate-900 text-slate-500 border-slate-800"
                }`}
              >
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>MÁS RECIENTES</span>
              </button>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en sugerencias, ideas o por operador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none font-sans"
            />
          </div>
        </div>

        {/* Lista de Sugerencias */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-2">
              <Radio className="w-6 h-6 animate-spin text-amber-400" />
              <span>Sincronizando banco de sugerencias multidimensionales...</span>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <Lightbulb className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400 font-bold">
                No se encontraron sugerencias en este canal.
              </p>
              <p className="text-[11px] text-slate-500 font-sans">
                ¡Sé el primero en proponer una idea haciendo clic en "Publicar Nueva Sugerencia"!
              </p>
            </div>
          ) : (
            filteredSuggestions.map((item) => {
              const votedBy = item.votedBy || [];
              const hasVoted = votedBy.includes(distinctId);
              const isCommentsExpanded = !!expandedComments[item.id];

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>

                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            item.status === "Implementado" || item.status === "Completado"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
                              : item.status === "En Desarrollo"
                              ? "bg-indigo-950 text-indigo-300 border-indigo-700/60 animate-pulse"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}
                        >
                          {item.status === "Implementado" && "✅ IMPLEMENTADO"}
                          {item.status === "En Desarrollo" && "🚀 EN DESARROLLO"}
                          {item.status === "En Evaluación" && "🔍 EN EVALUACIÓN"}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500">
                          por <strong className="text-slate-300">{item.author}</strong>
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-sans leading-snug pt-0.5">
                        {item.title}
                      </h3>
                    </div>

                    <span className="text-[9px] font-mono text-slate-500 shrink-0 self-start">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                    {item.content}
                  </p>

                  {/* Acciones: Votos y Comentarios */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      {/* Botón Apoyar / Votar */}
                      <button
                        type="button"
                        onClick={() => handleVote(item.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          hasVoted
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? "text-amber-400 fill-amber-400" : ""}`} />
                        <span>{item.votes || 0}</span>
                        <span className="text-[10px] font-normal hidden sm:inline">
                          {hasVoted ? "¡Apoyado!" : "Apoyar Idea"}
                        </span>
                      </button>

                      {/* Botón Comentarios */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.comments?.length || 0}</span>
                        <span className="text-[10px] font-normal hidden sm:inline">Comentarios</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {item.id.substring(0, 8)}
                    </span>
                  </div>

                  {/* Sección Desplegable de Comentarios */}
                  {isCommentsExpanded && (
                    <div className="pt-3 border-t border-slate-900 space-y-3 animate-fade-in">
                      <div className="space-y-2">
                        {(!item.comments || item.comments.length === 0) ? (
                          <p className="text-[10px] font-mono text-slate-500 italic">
                            Aún no hay comentarios en esta sugerencia. ¡Sé el primero en opinar!
                          </p>
                        ) : (
                          item.comments.map((comm) => (
                            <div
                              key={comm.id}
                              className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-amber-300 font-bold flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {comm.author}
                                </span>
                                <span className="text-slate-500 text-[9px]">
                                  {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-300 font-sans text-xs">{comm.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Input para agregar comentario */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Añade un aporte o comentario..."
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
                          className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(item.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          <span>Enviar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 text-[10px]">
            Red de Feedback Multidimensional • Sintonizador Antena
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default SuggestionsBlogModal;
