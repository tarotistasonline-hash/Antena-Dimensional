import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Clock,
  Radio,
  Flame,
  User,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  BookOpen,
  PenTool,
  X,
  ExternalLink,
  Star,
  ThumbsUp,
  MapPin,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { logTelemetryEvent } from "../cloudCounter";
import { safeStorage } from "../utils/storage";

export interface GuestbookComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface GuestbookEntry {
  id: string;
  title: string;
  author: string;
  location?: string;
  recommend?: string;
  rating?: number;
  content: string;
  votes: number;
  commentsCount: number;
  comments: GuestbookComment[];
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

const formatTimestampIso = (val: unknown): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof (val as any).toDate === "function") return (val as any).toDate().toISOString();
  if (typeof val === "string") return val;
  return new Date().toISOString();
};

const sanitizeId = (raw: string, maxLen = 64): string => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, maxLen);
  return cleaned || "vis_" + Date.now().toString(36);
};

export const SuggestionsBlogView: React.FC<SuggestionsBlogViewProps> = ({
  addToast,
  isInsideModal = false,
  onOpenAsTab,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, GuestbookComment[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  // Tab mode in mobile/compact view: 'feed' or 'publish'
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "publish">("feed");

  // New Guestbook Form state
  const [isInlineFormOpen, setIsInlineFormOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>("");
  const [newLocation, setNewLocation] = useState<string>("");
  const [newRating, setNewRating] = useState<number>(5);
  const [newRecommend, setNewRecommend] = useState<"Sí, lo recomiendo" | "Neutral" | "No me gustó">("Sí, lo recomiendo");
  const [newContent, setNewContent] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Active expanded comment section per entry
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingLoading, setCommentingLoading] = useState<Record<string, boolean>>({});

  // Expanded full text per entry
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});

  const getLocalDistinctId = () => {
    if (typeof window !== "undefined") {
      let id = safeStorage.getItem("antena_local_distinct_id");
      if (!id) {
        id = "vis_" + Math.random().toString(36).substring(2, 10);
        safeStorage.setItem("antena_local_distinct_id", id);
      }
      return sanitizeId(id, 64);
    }
    return "vis_anon";
  };

  const distinctId = getLocalDistinctId();

  // Real-time Firestore listener for guestbook entries
  useEffect(() => {
    setLoading(true);
    const entriesQuery = query(
      collection(db, "guestbook_entries"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      entriesQuery,
      (snapshot) => {
        const loaded: GuestbookEntry[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: typeof data.title === "string" ? data.title : "Visita a la página",
            author: typeof data.author === "string" ? data.author : "Visitante",
            location: typeof data.location === "string" ? data.location : undefined,
            recommend: typeof data.recommend === "string" ? data.recommend : "Sí, lo recomiendo",
            rating: typeof data.rating === "number" ? data.rating : 5,
            content: typeof data.content === "string" ? data.content : "",
            votes: typeof data.votesCount === "number" ? data.votesCount : 0,
            commentsCount: typeof data.commentsCount === "number" ? data.commentsCount : 0,
            comments: [],
            createdAt: formatTimestampIso(data.createdAt),
          };
        });
        setEntries(loaded);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, "guestbook_entries");
      }
    );

    return () => unsubscribe();
  }, []);

  // Check whether current visitor has voted on loaded entries
  useEffect(() => {
    if (entries.length === 0) return;
    let cancelled = false;
    Promise.all(
      entries.map(async (entry) => {
        const votePath = `guestbook_entries/${entry.id}/votes/${distinctId}`;
        try {
          const voteSnap = await getDoc(doc(db, "guestbook_entries", entry.id, "votes", distinctId));
          return [entry.id, voteSnap.exists()] as const;
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, votePath);
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const nextMap: Record<string, boolean> = {};
        for (const [id, voted] of results) {
          nextMap[id] = voted;
        }
        setVotedMap(nextMap);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [entries.map((e) => e.id).join(","), distinctId]);

  // Subscribe to comments for any expanded guestbook entry
  useEffect(() => {
    const activeIds = Object.keys(expandedComments).filter((id) => expandedComments[id]);
    if (activeIds.length === 0) return;

    const unsubscribers = activeIds.map((entryId) => {
      const commentsPath = `guestbook_entries/${entryId}/comments`;
      const commentsQuery = query(
        collection(db, "guestbook_entries", entryId, "comments"),
        orderBy("createdAt", "asc"),
        limit(100)
      );
      return onSnapshot(
        commentsQuery,
        (snapshot) => {
          const loadedComments: GuestbookComment[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              author: typeof data.author === "string" ? data.author : "Visitante",
              content: typeof data.content === "string" ? data.content : "",
              timestamp: formatTimestampIso(data.createdAt),
            };
          });
          setCommentsMap((prev) => ({
            ...prev,
            [entryId]: loadedComments,
          }));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, commentsPath);
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [JSON.stringify(expandedComments)]);

  // Handle atomic like / useful vote in Firestore
  const handleVote = async (entryId: string) => {
    const entryPath = `guestbook_entries/${entryId}`;
    const entryRef = doc(db, "guestbook_entries", entryId);
    const voteRef = doc(db, "guestbook_entries", entryId, "votes", distinctId);

    try {
      const nextHasVoted = await runTransaction(db, async (tx) => {
        const entrySnap = await tx.get(entryRef);
        if (!entrySnap.exists()) {
          throw new Error("Entrada no encontrada.");
        }
        const voteSnap = await tx.get(voteRef);
        const currentVotes = typeof entrySnap.data().votesCount === "number" ? entrySnap.data().votesCount : 0;

        if (voteSnap.exists()) {
          tx.delete(voteRef);
          tx.update(entryRef, {
            votesCount: Math.max(0, currentVotes - 1),
            lastInteractionId: distinctId,
          });
          return false;
        } else {
          tx.set(voteRef, {
            voterId: distinctId,
            createdAt: serverTimestamp(),
          });
          tx.update(entryRef, {
            votesCount: currentVotes + 1,
            lastInteractionId: distinctId,
          });
          return true;
        }
      });

      setVotedMap((prev) => ({ ...prev, [entryId]: nextHasVoted }));
      logTelemetryEvent("sintonizacion", `Me gusta en libro de visitas ${entryId}`);
    } catch (err) {
      addToast("AVISO", "No se pudo actualizar tu voto en la base de datos.", "anomaly");
      handleFirestoreError(err, OperationType.WRITE, entryPath);
    }
  };

  // Handle Submit New Guestbook Entry in Firestore
  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      addToast("MENSAJE REQUERIDO", "Por favor escribe tu opinión o saludo para el libro de visitas.", "anomaly");
      return;
    }

    const entryId = sanitizeId(
      "gb_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7),
      128
    );
    const entryPath = `guestbook_entries/${entryId}`;

    const cleanTitle = (newTitle.trim() || "Visita a la página").slice(0, 120);
    const cleanAuthor = (newAuthor.trim() || "Visitante").slice(0, 60);
    const cleanLocation = (newLocation.trim() || "Visitante Web").slice(0, 80);
    const cleanContent = newContent.trim().slice(0, 2000);
    const cleanRating = Math.min(5, Math.max(1, Math.round(newRating)));

    try {
      setSubmitting(true);
      await setDoc(doc(db, "guestbook_entries", entryId), {
        title: cleanTitle,
        author: cleanAuthor,
        location: cleanLocation,
        recommend: newRecommend,
        rating: cleanRating,
        content: cleanContent,
        votesCount: 0,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: serverTimestamp(),
      });

      setNewTitle("");
      setNewContent("");
      setNewLocation("");
      setIsInlineFormOpen(false);
      setActiveSubTab("feed");
      addToast("¡GRACIAS POR TU VISITA!", "Tu mensaje quedó guardado permanentemente en el libro de visitas.", "high-intensity");
      logTelemetryEvent("sintonizacion", `Firma en libro de visitas por ${cleanAuthor}`);
    } catch (err) {
      addToast("ERROR DE BASE DE DATOS", "No se pudo guardar el mensaje en Firestore.", "anomaly");
      handleFirestoreError(err, OperationType.CREATE, entryPath);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Comment / Reply atomically in Firestore
  const handleAddComment = async (entryId: string) => {
    const text = commentInputs[entryId]?.trim();
    if (!text) return;

    const commentId = sanitizeId(
      "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      128
    );
    const commentPath = `guestbook_entries/${entryId}/comments/${commentId}`;
    const entryRef = doc(db, "guestbook_entries", entryId);
    const commentRef = doc(db, "guestbook_entries", entryId, "comments", commentId);
    const cleanAuthor = (newAuthor.trim() || "Visitante").slice(0, 60);
    const cleanContent = text.slice(0, 800);

    try {
      setCommentingLoading((prev) => ({ ...prev, [entryId]: true }));
      await runTransaction(db, async (tx) => {
        const entrySnap = await tx.get(entryRef);
        if (!entrySnap.exists()) {
          throw new Error("Entrada no encontrada.");
        }
        const currentCommentsCount =
          typeof entrySnap.data().commentsCount === "number" ? entrySnap.data().commentsCount : 0;

        tx.set(commentRef, {
          author: cleanAuthor,
          content: cleanContent,
          createdAt: serverTimestamp(),
        });
        tx.update(entryRef, {
          commentsCount: currentCommentsCount + 1,
          lastInteractionId: commentId,
        });
      });

      setCommentInputs((prev) => ({ ...prev, [entryId]: "" }));
      addToast("RESPUESTA PUBLICADA", "Tu comentario quedó guardado en el libro de visitas.", "high-intensity");
    } catch (err) {
      addToast("AVISO", "No se pudo guardar la respuesta.", "anomaly");
      handleFirestoreError(err, OperationType.CREATE, commentPath);
    } finally {
      setCommentingLoading((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  // Filter & Sort Logic
  const filteredEntries = entries
    .filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        return b.votes - a.votes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalLikes = entries.reduce((acc, curr) => acc + (curr.votes || 0), 0);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Barra Superior del Libro de Visitas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-amber-300 uppercase tracking-wide flex items-center gap-2">
                <span>📖 LIBRO DE VISITAS</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                ¿Qué te pareció nuestro sitio web? Lee los saludos de otros visitantes o deja tu propia firma.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales & Métricas */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Métricas del libro */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Mensajes:</span>
            <strong className="text-amber-300 font-bold">{entries.length}</strong>
            <span className="text-slate-700">|</span>
            <span className="text-amber-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>5.0</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>{totalLikes}</span>
            </span>
          </div>

          {/* Botón Firmar Libro */}
          <button
            type="button"
            onClick={() => {
              setIsInlineFormOpen(true);
              setActiveSubTab("publish");
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-black text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>Firmar el Libro</span>
          </button>

          {/* Botones de utilidad para Modal */}
          {isInsideModal && (
            <div className="flex items-center gap-1.5 ml-1">
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
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Abrir como pestaña principal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pestaña</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO PARA FIRMAR EL LIBRO DE VISITAS */}
      {(activeSubTab === "publish" || isInlineFormOpen) && (
        <section className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold font-mono text-amber-300 uppercase tracking-wide">
                  DEJAR TU MENSAJE EN EL LIBRO DE VISITAS
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Cuéntanos si te gustó el sitio web, de qué ciudad nos visitas y tus comentarios.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsInlineFormOpen(false);
                setActiveSubTab("feed");
              }}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Cerrar formulario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitNew} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Nombre o Apodo */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tu Nombre o Apodo *</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="Ej: Sofía, Carlos M., Visitante..."
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans transition-all"
                />
              </div>

              {/* Ciudad / País */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ciudad y País (opcional)</span>
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Ej: Buenos Aires, Argentina / Madrid, España..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans transition-all"
                />
              </div>

              {/* ¿Te gustó el sitio? (Calificación) */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>¿Qué te pareció el sitio web?</span>
                </label>
                <select
                  value={newRating}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setNewRating(r);
                    if (r >= 4) setNewRecommend("Sí, lo recomiendo");
                    else if (r === 3) setNewRecommend("Neutral");
                    else setNewRecommend("No me gustó");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none font-sans cursor-pointer transition-all"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ ¡Excelente, me encantó!</option>
                  <option value={4}>⭐⭐⭐⭐ Muy buena página</option>
                  <option value={3}>⭐⭐⭐ Interesante</option>
                  <option value={2}>⭐⭐ Regular</option>
                  <option value={1}>⭐ No me gustó</option>
                </select>
              </div>
            </div>

            {/* Título opcional del mensaje */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <span>Título breve de tu saludo (opcional)</span>
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="Ej: Muy linda página, felicitaciones / Gran experiencia..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans transition-all"
              />
            </div>

            {/* Contenido / Mensaje de visita */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <span>Tu Mensaje u Opinión sobre la Web *</span>
              </label>
              <textarea
                required
                rows={3}
                maxLength={2000}
                placeholder="Escribe aquí lo que te pareció el sitio web, cómo descubriste la página, si la recomiendas o qué sensación te dejó..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none font-sans resize-y min-h-[90px] transition-all leading-relaxed"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsInlineFormOpen(false);
                  setActiveSubTab("feed");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono font-black text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "PUBLICANDO..." : "✍️ DEJAR MI MENSAJE"}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* BARRA DE BÚSQUEDA Y ORDENAMIENTO */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        {/* Barra de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, país o palabras en los mensajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/70 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none font-sans transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ordenamiento */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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
        </div>
      </div>

      {/* LISTADO DE FIRMAS Y MENSAJES DEL LIBRO DE VISITAS */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Radio className="w-8 h-8 animate-spin text-amber-400" />
            <span>Cargando libro de visitas desde la base de datos...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <BookOpen className="w-10 h-10 text-amber-500/60 mx-auto animate-pulse" />
            <h4 className="text-sm font-mono font-bold text-slate-300">
              {searchQuery
                ? "No se encontraron mensajes con la búsqueda actual."
                : "El Libro de Visitas en la nueva base de datos está listo para tu firma."}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Sé el primero en dejar tu saludo o experiencia permanente en nuestro libro de visitas:
            </p>
            <button
              type="button"
              onClick={() => {
                setIsInlineFormOpen(true);
                setActiveSubTab("publish");
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              <span>FIRMAR EL LIBRO DE VISITAS</span>
            </button>
          </div>
        ) : (
          filteredEntries.map((item) => {
            const hasVoted = !!votedMap[item.id];
            const isCommentsExpanded = !!expandedComments[item.id];
            const isTextExpanded = !!expandedText[item.id];
            const isLong = item.content.length > 250;
            const rating = item.rating || 5;
            const itemComments = commentsMap[item.id] || [];

            return (
              <article
                key={item.id}
                id={`guestbook-${item.id}`}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 transition-all shadow-md"
              >
                {/* Cabecera del Mensaje */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Autor */}
                      <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px] font-bold border border-amber-500/30">
                          {item.author.charAt(0).toUpperCase()}
                        </div>
                        <span>{item.author}</span>
                      </span>

                      {/* Procedencia (Ciudad / País) */}
                      {item.location && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{item.location}</span>
                        </span>
                      )}

                      {/* Estrellas de satisfacción */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Recomendación */}
                      {item.recommend && (
                        <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          {item.recommend}
                        </span>
                      )}
                    </div>

                    {/* Título del Mensaje */}
                    {item.title && (
                      <h3 className="text-sm font-bold text-slate-100 font-sans pt-0.5">
                        {item.title}
                      </h3>
                    )}
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

                {/* Contenido / Texto del Mensaje */}
                <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                  <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                    {isLong && !isTextExpanded
                      ? `${item.content.substring(0, 250)}...`
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
                      className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-0.5 cursor-pointer"
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

                {/* Barra de Acciones: Me gusta y Respuestas */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/70 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    {/* Botón Me Gusta */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                        hasVoted
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)] font-bold"
                          : "bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? "text-amber-400 fill-amber-400" : ""}`} />
                      <span>{item.votes || 0}</span>
                      <span className="text-[10px] hidden xs:inline">{hasVoted ? "¡Te gusta!" : "Me gusta"}</span>
                    </button>

                    {/* Botón Respuestas */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                        isCommentsExpanded
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/70"
                          : "bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.commentsCount || itemComments.length || 0}</span>
                      <span className="text-[10px] hidden xs:inline">Respuestas</span>
                    </button>
                  </div>
                </div>

                {/* SECCIÓN DESPLEGABLE DE RESPUESTAS ENTRE VISITANTES */}
                {isCommentsExpanded && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Respuestas de visitantes:</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        {itemComments.length} mensajes
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {itemComments.length === 0 ? (
                        <p className="text-xs font-mono text-slate-500 italic py-1">
                          Aún no hay respuestas a este mensaje. ¡Sé el primero en responder!
                        </p>
                      ) : (
                        itemComments.map((comm) => (
                          <div
                            key={comm.id}
                            className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/90 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {comm.author}
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                {new Date(comm.timestamp).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-slate-200 font-sans text-xs leading-relaxed">
                              {comm.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input para responder */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/80">
                      <input
                        type="text"
                        maxLength={800}
                        placeholder="Escribe una respuesta a este visitante..."
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
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none font-sans"
                      />
                      <button
                        type="button"
                        disabled={commentingLoading[item.id]}
                        onClick={() => handleAddComment(item.id)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
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
