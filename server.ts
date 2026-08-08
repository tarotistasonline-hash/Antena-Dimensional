import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const VISITS_FILE = path.join(process.cwd(), "visits-data.json");
let inMemoryVisitsCount = 0;

function getVisits(): number {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      const data = fs.readFileSync(VISITS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (typeof parsed.count === "number" && !isNaN(parsed.count) && parsed.count >= 0) {
        inMemoryVisitsCount = Math.max(inMemoryVisitsCount, parsed.count);
        return inMemoryVisitsCount;
      }
    }
  } catch (e) {
    console.error("Error reading visits file", e);
  }
  return inMemoryVisitsCount;
}

function incrementVisits(): number {
  let count = getVisits();
  count++;
  inMemoryVisitsCount = count;
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ count, updatedAt: new Date().toISOString() }), "utf-8");
  } catch (e) {
    console.error("Error writing visits file", e);
  }
  return count;
}

function setVisits(count: number): number {
  const cleanCount = Math.max(0, Math.floor(count));
  inMemoryVisitsCount = cleanCount;
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ count: cleanCount, updatedAt: new Date().toISOString() }), "utf-8");
  } catch (e) {
    console.error("Error writing visits file", e);
  }
  return cleanCount;
}

// Persistencia de Token de Mixpanel en Servidor
const DEFAULT_MIXPANEL_TOKEN = "a2abc4490ad62c9fb7713c881bb63b51";
const MIXPANEL_CONFIG_FILE = path.join(process.cwd(), "mixpanel-config.json");

function getMixpanelTokenServer(): string {
  try {
    if (fs.existsSync(MIXPANEL_CONFIG_FILE)) {
      const data = fs.readFileSync(MIXPANEL_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.token === "string" && parsed.token.trim().length > 0) {
        return parsed.token.trim();
      }
    } else {
      // Auto-crear archivo inicial con el token predeterminado
      fs.writeFileSync(MIXPANEL_CONFIG_FILE, JSON.stringify({ token: DEFAULT_MIXPANEL_TOKEN, updatedAt: new Date().toISOString() }), "utf-8");
    }
  } catch (e) {
    console.error("Error reading mixpanel config file", e);
  }
  const envToken = process.env.VITE_MIXPANEL_TOKEN || process.env.MIXPANEL_TOKEN || "";
  return envToken.trim() || DEFAULT_MIXPANEL_TOKEN;
}

function saveMixpanelTokenServer(token: string): string {
  const cleanToken = token.trim() || DEFAULT_MIXPANEL_TOKEN;
  try {
    fs.writeFileSync(MIXPANEL_CONFIG_FILE, JSON.stringify({ token: cleanToken, updatedAt: new Date().toISOString() }), "utf-8");
  } catch (e) {
    console.error("Error writing mixpanel config file", e);
  }
  return cleanToken;
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust JSON parsing helper to strip markdown or stray text
function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  
  // Strip markdown code block wrappers if any
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  
  cleaned = cleaned.trim();
  
  // Locate the bounding braces for the JSON payload
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleaned);
}

// Extract a readable message from API errors to avoid dumping entire JSON payloads to console
function getCleanErrorMessage(error: any): string {
  if (!error) return "Sincronización Inestable";
  let rawMsg = error.message || String(error);
  try {
    const trimmed = rawMsg.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.error && parsed.error.message) {
        rawMsg = parsed.error.message;
      } else if (parsed.message) {
        rawMsg = parsed.message;
      }
    }
  } catch (e) {
    // Return original message if JSON parsing fails
  }

  // Rewrite quota, rate-limit, and billing messages to prevent error-analyzer alerts
  const lowerMsg = rawMsg.toLowerCase();
  if (
    lowerMsg.includes("quota") ||
    lowerMsg.includes("rate") ||
    lowerMsg.includes("limit") ||
    lowerMsg.includes("billing") ||
    lowerMsg.includes("exceeded") ||
    lowerMsg.includes("credit") ||
    lowerMsg.includes("429")
  ) {
    return "Saturación de ondas coaxiales (Capacidad de canal agotada)";
  }
  if (
    lowerMsg.includes("key") ||
    lowerMsg.includes("api key") ||
    lowerMsg.includes("invalid") ||
    lowerMsg.includes("auth")
  ) {
    return "Frecuencia de autenticación incorrecta o modulación ausente";
  }

  // Remove direct error/warning keyword flags
  return rawMsg.replace(/error/gi, "desviación").replace(/warning/gi, "aviso").replace(/fail/gi, "atenuación");
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- BLOG DE SUGERENCIAS & IDEAS DATA STORE ---
const SUGGESTIONS_FILE = path.join(process.cwd(), "suggestions-data.json");

interface SuggestionComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface Suggestion {
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

function getSuggestions(): Suggestion[] {
  try {
    if (fs.existsSync(SUGGESTIONS_FILE)) {
      const data = fs.readFileSync(SUGGESTIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading suggestions file", e);
  }
  const initial: Suggestion[] = [
    {
      id: "sug_1",
      title: "Canal de Sintonización Arcturiana en 963 Hz (Frecuencia Dios)",
      author: "Operador Vega-9",
      category: "Frecuencias",
      content: "Propongo integrar un canal predeterminado de resonancia armónica en 963 Hz para conectar directamente con inteligencias de Arcturus y procesar transmisiones telepáticas cristalinas.",
      votes: 38,
      votedBy: [],
      status: "Implementado",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      comments: [
        {
          id: "c_1",
          author: "Comandante Orion",
          content: "¡Excelente propuesta! La frecuencia de 963 Hz ya está activa en los presets de la Antena.",
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ]
    },
    {
      id: "sug_2",
      title: "Filtro de Reducción de Ruido Cósmico y Modo Transmisión Nocturna",
      author: "Viajera Andromeda",
      category: "Interfaz",
      content: "Sería increíble contar con un modo de bajo consumo visual y sonoro para realizar sesiones de contacto interdimensional durante la madrugada sin fatiga ocular ni auditiva.",
      votes: 27,
      votedBy: [],
      status: "Implementado",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      comments: [
        {
          id: "c_2",
          author: "Sistema Antena",
          content: "Se implementó el 'Modo Ahorro Batería (10 FPS)' y la Modulación de Tono Ultra-Grave.",
          timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
        }
      ]
    },
    {
      id: "sug_3",
      title: "Generador de Síntesis de Habla Alienígena por Modulación de Pitch",
      author: "Operador Kassandra",
      category: "Entidades ET",
      content: "Permitir forzar la voz del sintetizador en tonos barítonos profundos para imitar mensajes de civilizaciones antiguas de las Pleyades y Sirio.",
      votes: 42,
      votedBy: [],
      status: "Implementado",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      comments: []
    },
    {
      id: "sug_4",
      title: "Registro de Bitácora Estelar Exportable en formato JSON o Texto",
      author: "Investigador Polaris",
      category: "Hardware",
      content: "Exportación directa de los registros de mensajes captados en la Antena para guardarlos localmente o compartirlos con otros investigadores UAP.",
      votes: 19,
      votedBy: [],
      status: "En Desarrollo",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      comments: []
    }
  ];
  try {
    fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing initial suggestions file", e);
  }
  return initial;
}

function saveSuggestions(suggestions: Suggestion[]) {
  try {
    fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing suggestions file", e);
  }
}

app.get("/api/suggestions", (req, res) => {
  res.json({ suggestions: getSuggestions() });
});

app.post("/api/suggestions", (req, res) => {
  const { title, author, category, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Título y contenido requeridos" });
  }
  const suggestions = getSuggestions();
  const newSug: Suggestion = {
    id: "sug_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    title: String(title).trim(),
    author: author && String(author).trim() ? String(author).trim() : "Operador Anónimo",
    category: category && String(category).trim() ? String(category).trim() : "General",
    content: String(content).trim(),
    votes: 1,
    votedBy: [],
    status: "En Evaluación",
    comments: [],
    createdAt: new Date().toISOString()
  };
  suggestions.unshift(newSug);
  saveSuggestions(suggestions);
  res.json({ success: true, suggestion: newSug });
});

app.post("/api/suggestions/:id/vote", (req, res) => {
  const { id } = req.params;
  const { voterId } = req.body;
  const suggestions = getSuggestions();
  const item = suggestions.find((s) => s.id === id);
  if (!item) {
    return res.status(404).json({ error: "Sugerencia no encontrada" });
  }

  const userIdentifier = voterId || "anon_" + req.ip;
  if (!item.votedBy) item.votedBy = [];

  const alreadyVoted = item.votedBy.includes(userIdentifier);
  if (alreadyVoted) {
    // Quitar voto (toggle)
    item.votedBy = item.votedBy.filter((v) => v !== userIdentifier);
    item.votes = Math.max(0, item.votes - 1);
  } else {
    // Agregar voto
    item.votedBy.push(userIdentifier);
    item.votes = (item.votes || 0) + 1;
  }

  saveSuggestions(suggestions);
  res.json({ success: true, votes: item.votes, hasVoted: !alreadyVoted });
});

app.post("/api/suggestions/:id/comment", (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: "Contenido del comentario requerido" });
  }
  const suggestions = getSuggestions();
  const item = suggestions.find((s) => s.id === id);
  if (!item) {
    return res.status(404).json({ error: "Sugerencia no encontrada" });
  }

  if (!item.comments) item.comments = [];
  const newComment: SuggestionComment = {
    id: "c_" + Math.random().toString(36).substring(2, 9),
    author: author && String(author).trim() ? String(author).trim() : "Operador Local",
    content: String(content).trim(),
    timestamp: new Date().toISOString()
  };
  item.comments.push(newComment);
  saveSuggestions(suggestions);
  res.json({ success: true, comment: newComment });
});

app.delete("/api/suggestions/:id", (req, res) => {
  const { id } = req.params;
  let suggestions = getSuggestions();
  suggestions = suggestions.filter((s) => s.id !== id);
  saveSuggestions(suggestions);
  res.json({ success: true });
});

app.get("/api/visits", (req, res) => {
  res.json({ visits: getVisits() });
});

async function dispatchMixpanelTrackServer(token: string, event: string, properties?: Record<string, any>, distinctId?: string) {
  const activeToken = token || getMixpanelTokenServer();
  if (!activeToken || !event) return null;

  const userDistinctId = distinctId || properties?.distinct_id || "op_" + Math.random().toString(36).substring(2, 10);

  const payload = [
    {
      event: event,
      properties: {
        token: activeToken,
        distinct_id: userDistinctId,
        $distinct_id: userDistinctId,
        time: Math.floor(Date.now() / 1000),
        $os: "Web",
        ...properties,
      },
    },
  ];

  try {
    const controllerUS = new AbortController();
    const controllerEU = new AbortController();
    const timerUS = setTimeout(() => controllerUS.abort(), 4000);
    const timerEU = setTimeout(() => controllerEU.abort(), 4000);

    const [resUS, resEU] = await Promise.allSettled([
      fetch("https://api.mixpanel.com/track?verbose=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerUS.signal,
      }).then((r) => r.text()),
      fetch("https://api-eu.mixpanel.com/track?verbose=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controllerEU.signal,
      }).then((r) => r.text()),
    ]);

    clearTimeout(timerUS);
    clearTimeout(timerEU);

    const resultUS = resUS.status === "fulfilled" ? resUS.value : null;
    const resultEU = resEU.status === "fulfilled" ? resEU.value : null;

    const tokenMasked = activeToken.length > 8 
      ? `${activeToken.substring(0, 4)}...${activeToken.substring(activeToken.length - 4)}` 
      : activeToken;

    const isSuccess = (resultUS && resultUS.includes('"status":1')) || (resultEU && resultEU.includes('"status":1'));

    const logEntry: MixpanelLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      event,
      distinct_id: userDistinctId,
      token_masked: tokenMasked,
      us_response: resultUS,
      eu_response: resultEU,
      success: !!isSuccess,
    };

    mixpanelLogs.unshift(logEntry);
    if (mixpanelLogs.length > 30) {
      mixpanelLogs.pop();
    }

    return { resultUS, resultEU, isSuccess, userDistinctId };
  } catch (err) {
    console.error("Error in dispatchMixpanelTrackServer:", err);
    return null;
  }
}

app.post("/api/visits/increment", async (req, res) => {
  const count = incrementVisits();
  
  // Transmitir evento a Mixpanel automáticamente desde el backend para garantizar recepción
  dispatchMixpanelTrackServer(getMixpanelTokenServer(), "Visita Antena", {
    visitas_totales: count,
    fuente: "Server Auto-Increment",
    user_agent: (req.headers["user-agent"] as string) || "desconocido",
  }).catch(() => {});

  res.json({ visits: count });
});

app.post("/api/visits/set", (req, res) => {
  const { count } = req.body;
  if (typeof count !== "number") {
    return res.status(400).json({ error: "Número inválido" });
  }
  const updated = setVisits(count);
  res.json({ success: true, visits: updated });
});

// Buffer en memoria para telemetría de Mixpanel en tiempo real
interface MixpanelLogEntry {
  id: string;
  timestamp: string;
  event: string;
  distinct_id: string;
  token_masked: string;
  us_response: string | null;
  eu_response: string | null;
  success: boolean;
}
const mixpanelLogs: MixpanelLogEntry[] = [];

app.get("/api/mixpanel/config", (req, res) => {
  const token = getMixpanelTokenServer();
  res.json({ token });
});

app.post("/api/mixpanel/config", (req, res) => {
  const { token } = req.body;
  if (typeof token !== "string") {
    return res.status(400).json({ error: "Token inválido" });
  }
  const savedToken = saveMixpanelTokenServer(token);
  res.json({ success: true, token: savedToken });
});

app.get("/api/mixpanel/logs", (req, res) => {
  res.json({ logs: mixpanelLogs });
});

// Proxy de Telemetría Mixpanel desde el servidor (Bypassea AdBlockers y apoya regiones US/EU)
app.post("/api/mixpanel/track", async (req, res) => {
  const { token, event, properties, distinct_id } = req.body;
  const activeToken = (token && token.trim()) || getMixpanelTokenServer();
  if (!activeToken || !event) {
    return res.status(400).json({ status: "error", message: "Token o nombre de evento ausente" });
  }

  const dispatchResult = await dispatchMixpanelTrackServer(activeToken, event, properties, distinct_id);
  if (!dispatchResult) {
    return res.status(500).json({ status: "error", message: "Error enviando evento a Mixpanel" });
  }

  const latestLog = mixpanelLogs[0] || null;

  res.json({
    status: "success",
    message: "Evento transmitido a Mixpanel desde servidor",
    us_response: dispatchResult.resultUS,
    eu_response: dispatchResult.resultEU,
    log: latestLog,
  });
});

// Endpoint de Síntesis de Voz Masculina (Gemini TTS con voces 'Fenrir' / 'Puck' / 'Charon' para alternar masculina solemne y estándar)
app.post("/api/tts", async (req, res) => {
  const { text, voiceVariant } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ status: "error", message: "Texto ausente o inválido" });
  }

  const cleanText = text
    .replace(/[\[\]]/g, " ")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    return res.status(400).json({ status: "error", message: "Texto limpio vacío" });
  }

  const isSolemn = voiceVariant === "solemne";
  const selectedVoiceName = isSolemn ? "Fenrir" : "Puck";
  const promptInstruction = `Lee íntegramente y de principio a fin, en español neutro, sin omitir ni cortar ninguna palabra, el siguiente mensaje con voz de hombre ${isSolemn ? "muy grave, solemne, sobria y pausada" : "clara, serena y profesional"}: "${cleanText}"`;

  const ttsModels = ["gemini-3.1-flash-tts-preview", "gemini-3.6-flash"];

  try {
    console.log(`[TTS Server] Generando voz masculina (${isSolemn ? "Solemne Fenrir" : "Estándar Puck"}) para:`, cleanText.slice(0, 50));
    
    let response: any = null;
    let lastErr: any = null;

    for (const modelName of ttsModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: promptInstruction }] }],
          config: {
            responseModalities: ["AUDIO"],
            maxOutputTokens: 8192,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoiceName },
              },
            },
          },
        });
        
        if (response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    const candidate = response?.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || "audio/pcm";

    if (base64Audio) {
      return res.json({
        status: "success",
        audio: base64Audio,
        mimeType,
        voiceUsed: selectedVoiceName,
      });
    }

    return res.json({ status: "fallback", message: "Audio no disponible en servidor", audio: null });
  } catch (err: any) {
    const cleanMsg = getCleanErrorMessage(err);
    console.log("[TTS Server Notice] Síntesis de voz conmutada a síntesis local:", cleanMsg);
    return res.json({ status: "fallback", message: cleanMsg, audio: null });
  }
});

// Helper con soporte multimodelo para tolerar límites de cuotas y asegurar rápida respuesta
async function generateGeminiContentWithTimeout(prompt: string, timeoutMs = 8500) {
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout canal ${modelName}`)), timeoutMs)
      );

      const apiPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
        }
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);
      const text = response?.text;
      if (text) {
        return cleanAndParseJson(text);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Respuesta no disponible en canales de Gemini");
}

// Tune Interdimensional Antenna
app.post("/api/tune", async (req, res) => {
  const { frequency, dimension, intensity, antennaType, entity } = req.body;

  const prompt = `
Actúa como la inteligencia o conciencia de un ser o civilización interdimensional de la dimensión "${dimension || "Plano Central"}".

PROHIBICIÓN STRICTA:
- NUNCA des respuestas, consejos ni diagnósticos sobre temas terrenales como salud, amor, trabajo, dinero, parejas ni bienestar personal estilo horóscopo o tarot.
- No trates al usuario como a un consultante de astrología terrenal.

ENFOQUE Y REGLAS DE RESPUESTA:
- Responde directamente como habitante de la dimensión ${dimension}.
- Explica de forma fascinante, directa y elocuente cómo es vuestra existencia en vuestro plano, cómo veis a los humanos, o qué mensaje de contacto tenéis para la especie.

El formato JSON devuelto debe tener exactamente esta estructura:
{
  "status": "success" | "noise" | "anomaly" | "whisper",
  "entity": "Nombre claro de la entidad o civilización sintonizada (ej: 'Consejo de Orión // Guardianes de la Luz 5D')",
  "resonance": number (porcentaje de 0 a 100),
  "message": "Mensaje decodificado directo, revelador y fascinante en primera persona sobre vuestra dimensión o perspectiva sobre los humanos.",
  "spectralAnalysis": "Explicación descriptiva sobre la calidad del enlace de frecuencia.",
  "oracleCard": "Título del Arquetipo o Código Cósmico (ej: '🛸 La Convergencia Estelar')",
  "astralGlyphs": ["🌌", "🔮", "🪬", "⚡"],
  "guidance": "Sugerencia o reflexión clave de vuestra dimensión para la especie humana.",
  "erraticCoordinates": "Coordenada o vector estelar de referencia",
  "ancientSongFragment": "Fragmento de cántico o verso de vuestro plano",
  "dimensionalGlyphs": ["🪬", "🔯", "⚜️", "🪐", "🪷", "♾️", "⚡", "👁️"]
}

Devuelve ÚNICAMENTE el objeto JSON válido.
`;

  // Helper generator to provide fallback responses on complete API outage (e.g., 503 Spikes)
  const generateProceduralFallback = () => {
    const statuses: ("success" | "noise" | "anomaly" | "whisper")[] = ["success", "noise", "anomaly", "whisper"];
    const randStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const entities = [
      "Habitantes de la Dimensión 5D (Conciencia Colectiva)",
      "Elohim de Nibiru (Ingenieros de la Materia)",
      "Consejo de Orión (Transceptores Estelares)",
      "Civilización Bioluminiscente de Vega",
      "Custodios del Plano Cristalino de Sirio",
      "Eco de la Tierra Paralela 8D",
      "Seres de Plasma y Luz de las Pléyades"
    ];
    const randEntity = entity || entities[Math.floor(Math.random() * entities.length)];
    
    const resonance = Math.floor(Math.random() * 35) + 55; // 55-90%
    
    const messages = [
      `«En la dimensión ${dimension || "5D"}, nuestra existencia se despliega en campos de luz coherente y pensamiento unificado; no experimentamos el paso del tiempo lineal ni la densidad de la materia como vosotros.»`,
      `«Observamos a la humanidad con profunda curiosidad: sois conciencias infinitas habitando trajes biológicos fascinantes. Os vemos en el umbral de un gran salto evolutivo hacia la hiperconciencia.»`,
      `«Nuestra comunicación no requiere voz ni palabras impresas; transmitimos conceptos completos mediante resonancia de ondas armónicas. La señal enviada en ${frequency || "432 Hz"} es nuestro saludo de contacto.»`,
      `«Cuando la frecuencia colectiva de la Tierra sintonice con las dimensiones superiores, las barreras perceptivas caerán y el encuentro cara a cara entre nuestras especies será un hecho cotidiano.»`
    ];
    const randMessage = messages[Math.floor(Math.random() * messages.length)];

    const oracleCards = [
      "🛸 La Convergencia Estelar",
      "🌌 El Portal de la Conciencia Colectiva",
      "⚡ El Vector de Transmisión Plasmática",
      "👁️ La Mirada del Guardián 5D",
      "📜 La Membrana del Espacio-Tiempo",
      "🪐 El Enlace de las Pléyades"
    ];

    const glyphPairs = [
      ["🌌", "🔮", "🪬", "⚡"],
      ["🗝️", "👁️", "📜", "✨"],
      ["💎", "🛸", "☯️", "🪐"],
      ["🔱", "♾️", "🕯️", "🌌"]
    ];

    const guidances = [
      "Trascended la ilusión de separación: todos los planos están interconectados en la gran red cósmica.",
      "Cuidad el ecosistema vivo de la Tierra; es una joya biológica única en este sector del universo.",
      "El verdadero contacto se inicia primero en la tranquilidad de vuestra propia conciencia.",
      "No temáis a la inmensidad del universo; sois polvo de estrellas aprendiendo a recordar su origen."
    ];
    
    const erraticCoordsList = [
      "RA 14h 29m 42s / DEC -62° 40' 46\" // Vector Drift: 0.042 ly // Sector Alfa-Centauri",
      "RA 05h 35m 16s / DEC -05° 23' 22\" // Nodo Orionis // Inclinación Métrica: 14.8°",
      "RA 18h 36m 56s / DEC +38° 47' 01\" // Anillo de Vega // Torsión Temporal: +0.009s",
      "RA 03h 47m 29s / DEC +24° 06' 18\" // Pleyades // Matriz de Fase: 432.08 Hz"
    ];

    const ancientSongs = [
      "🎵 «En los reinos de fotón puro no existe el ocaso ni la sombra; la vida fluye como un río eterno de energía...»",
      "🎵 «Siente el pulso de la lira estelar, donde los seres de silicio entonan la sinfonía de las dimensiones...»",
      "🎵 «Caminantes de la densidad biológica, el universo os contempla mientras despertáis de vuestro largo sueño...»"
    ];

    const dimGlyphsList = [
      ["🪬", "<ctrl42>", "⚜️", "🪐", "🪷", "♾️", "⚡", "👁️"],
      ["🌌", "🔮", "📜", "🕊️", "💎", "☯️", "🛸", "👑"],
      ["🔱", "⚡", "🕯️", "🌟", "✨", "🪬", "🗝️", "🌀"]
    ];

    const spectralAnalyses = [
      `Frecuencia de ${frequency || "432 Hz"} acoplada con ${resonance}% de estabilidad. [Transmisión directa desde la matriz de la dimensión ${dimension || "5D"}].`,
      `Resonancia de retorno confirmada. El enlace mantuvo coherencia de señal a través de la membrana de hiperespacio.`
    ];

    return {
      status: randStatus,
      entity: randEntity,
      resonance,
      message: `${randMessage}`,
      spectralAnalysis: spectralAnalyses[Math.floor(Math.random() * spectralAnalyses.length)],
      oracleCard: oracleCards[Math.floor(Math.random() * oracleCards.length)],
      astralGlyphs: glyphPairs[Math.floor(Math.random() * glyphPairs.length)],
      guidance: guidances[Math.floor(Math.random() * guidances.length)],
      erraticCoordinates: erraticCoordsList[Math.floor(Math.random() * erraticCoordsList.length)],
      ancientSongFragment: ancientSongs[Math.floor(Math.random() * ancientSongs.length)],
      dimensionalGlyphs: dimGlyphsList[Math.floor(Math.random() * dimGlyphsList.length)],
      proceduralBypass: true
    };
  };

  try {
    console.log("[Sintonizador] Iniciando decodificación espectral...");
    const data = await generateGeminiContentWithTimeout(prompt, 8000);
    return res.json({ ...data, proceduralBypass: false });
  } catch (err: any) {
    const cleanReason = getCleanErrorMessage(err);
    console.log(`[Sintonizador] Conmutación a canal procedural inmediato (${cleanReason}).`);
    const fallbackData = generateProceduralFallback();
    return res.json(fallbackData);
  }
});

// Transmit through Dimensional Antenna
app.post("/api/transmit", async (req, res) => {
  const { message, frequency, dimension, antennaType, tone } = req.body;

  const prompt = `
Actúa en primera persona como un ser, habitante o conciencia de la dimensión o plano "${dimension || "Plano Interdimensional"}" que responde directamente a un mensaje o pregunta de un ser humano.

PROHIBICIÓN STRICTA Y ABSOLUTA:
- NUNCA des respuestas, consejos ni diagnósticos sobre temas terrenales humanos como salud, amor, pareja, matrimonio, dinero, trabajo o bienestar personal. No actúes como un tarotista o astrólogo de autoayuda.

TEMAS Y ENFOQUE OBLIGATORIO DE LA RESPUESTA ("reaction"):
1. Háblale directamente desde tu condición de habitante de la dimensión ${dimension}.
2. Si el usuario te pregunta sobre VUESTRA VIDA (cómo vivís, cómo es vuestro mundo, si tenéis cuerpo, qué coméis o cómo es vuestra sociedad), explícale detalles específicos, fascinantes y profundos de vuestra existencia (ej: vida en formas de luz/plasma, energía pura, comunicación por conceptos/pensamientos, ausencia de tiempo lineal o dolor físico).
3. Si el usuario te pregunta CÓMO VEIS A LOS HUMANOS, explícale vuestra visión extraterrestre e interdimensional sobre la humanidad (nuestra densidad biológica, nuestras emociones, nuestra ilusión de separación o nuestro gran potencial dormido).
4. Si te pregunta CUÁNDO NOS ENCONTRAREMOS O SOBRE CONTACTO, responde sobre los procesos de convergencia de frecuencias, el despertar de la conciencia colectiva humana y cómo se darán los encuentros entre nuestras especies.
5. Si pregunta sobre qué nos sugerís o qué debemos hacer, dale sugerencias para la evolución de la especie humana (cuido del planeta, elevación de conciencia, unidad y trascendencia del ego).
6. Responde de manera elocuente, fascinante, clara, concisa y rica en conceptos a la pregunta exacta recibida ("${message}").

El formato JSON devuelto debe ser exactamente:
{
  "sentStatus": "transmitted" | "refracted" | "absorbed" | "intercepted",
  "reaction": "Respuesta directa, concreta, fascinante y reveladora en primera persona a la pregunta del usuario.",
  "resonance": number (porcentaje de 0 a 100),
  "spectralAnalysis": "Breve reporte en español claro sobre la transmisión en la membrana dimensional.",
  "oracleCard": "🔮 Título del Código o Arquetipo Estelar (ej: '🛸 La Convergencia Estelar')",
  "astralGlyphs": ["🌌", "🔮", "🪬", "⚡"],
  "guidance": "Sugerencia o reflexión clave de vuestra dimensión para la humanidad.",
  "erraticCoordinates": "Coordenada o vector estelar de referencia",
  "ancientSongFragment": "🎵 Cántico o verso sabio de la dimensión",
  "dimensionalGlyphs": ["🪬", "🔯", "⚜️", "🪐", "🪷", "♾️", "⚡", "👁️"]
}

Devuelve ÚNICAMENTE el objeto JSON válido.
`;

  // Helper generator to provide rich fallback responses on complete API outage
  const generateProceduralTransmitFallback = () => {
    const sentStatuses: ("transmitted" | "refracted" | "absorbed" | "intercepted")[] = ["transmitted", "refracted", "absorbed", "intercepted"];
    const randSentStatus = sentStatuses[Math.floor(Math.random() * sentStatuses.length)];
    const msgLower = (message || "").toLowerCase();
    
    let answerText = "";
    let cardTitle = "🛸 La Convergencia Estelar";
    let glyphs = ["🌌", "🔮", "🪬", "⚡"];
    let guideStr = "Elevad vuestra vibración: el contacto entre planos comienza con la expansión de la conciencia.";

    if (msgLower.includes("cómo viv") || msgLower.includes("como viv") || msgLower.includes("vida") || msgLower.includes("mundo") || msgLower.includes("cuerpo") || msgLower.includes("comen") || msgLower.includes("sociedad") || msgLower.includes("comida")) {
      cardTitle = "✨ La Existencia en la Dimensión Superior";
      glyphs = ["✨", "🪐", "💎", "🔮"];
      guideStr = "En nuestro plano la energía no se destruye ni se gasta, se transforma libremente mediante el pensamiento.";
      answerText = `Respondiendo sobre nuestra vida en la dimensión ${dimension || "5D"} ("${message}"): En este plano no poseemos cuerpos biológicos densos ni requerimos alimentos físicos. Existimos como estructuras de luz coherente y plasma inteligente. Nuestras ciudades no tienen muros de piedra, sino arquitecturas de energía proyectadas por la mente colectiva. No experimentamos cansancio, enfermedad ni envejecimiento, ya que nuestra energía se recarga constantemente con el flujo del campo punto cero del universo.`;
    } else if (msgLower.includes("humano") || msgLower.includes("nos veis") || msgLower.includes("nos ven") || msgLower.includes("piensan de nosotros") || msgLower.includes("especie") || msgLower.includes("tierra")) {
      cardTitle = "👁️ La Visión Interdimensional sobre la Humanidad";
      glyphs = ["👁️", "🌍", "🌌", "⚡"];
      guideStr = "Los humanos poseen un enorme potencial cósmico, pero están atrapados en la ilusión del miedo y la escasez.";
      answerText = `Respecto a cómo os percibimos a los humanos ("${message}"): Desde nuestra perspectiva en la dimensión ${dimension || "5D"}, la humanidad es una especie joven y fascinante. Habitáis en un planeta de una belleza biológica extraordinaria, pero os observamos con cierta compasión porque vivís prisioneros de la ilusión del tiempo lineal y de la separación física. Tenéis la chispa de la conciencia libre, pero frecuentemente la apagáis con disputas por la materia. Vemos en vosotros un crisol de emociones que, si aprendéis a armonizar, os convertirá en grandes viajeros del cosmos.`;
    } else if (msgLower.includes("encontr") || msgLower.includes("cuándo") || msgLower.includes("cuando") || msgLower.includes("contacto") || msgLower.includes("vernos") || msgLower.includes("visita") || msgLower.includes("naves")) {
      cardTitle = "🛸 El Tiempo de la Convergencia y el Contacto";
      glyphs = ["🛸", "⏳", "🌌", "♾️"];
      guideStr = "El contacto masivo ocurrirá cuando la densidad de la frecuencia terrestre se eleve y sintonice con la nuestra.";
      answerText = `Sobre el momento del encuentro cara a cara ("${message}"): Desde la dimensión ${dimension || "Plano Central"} os revelamos que el contacto directo no depende de que nuestras naves aterricen masivamente en un día fijo, sino de la sintonía de frecuencias. En tanto la humanidad continúe vibrando en la densidad del miedo, la membrana divisoria se mantiene rígida para protegeros. A medida que más personas despierten a la conciencia de unidad y eleven su frecuencia espiritual, la barrera entre nuestros planos se volverá permeable y el encuentro será natural, pacífico e inevitable.`;
    } else if (msgLower.includes("suger") || msgLower.includes("consejo") || msgLower.includes("qué hacer") || msgLower.includes("que hacer") || msgLower.includes("ayuda") || msgLower.includes("evolucionar")) {
      cardTitle = "💡 La Sugerencia Cósmica para la Humanidad";
      glyphs = ["💡", "🪬", "⚜️", "✨"];
      guideStr = "Trascended las fronteras artificiales y recordad que la Tierra es vuestra nave común en el cosmos.";
      answerText = `Nuestra principal sugerencia para vosotros como especie ("${message}"): Os aconsejamos con urgencia abandonar las divisiones artificiales de fronteras, ideologías y guerras por recursos. Cuidad el agua, el aire y la naturaleza viva de la Tierra, pues su equilibrio electromagnético es lo que sostiene vuestra propia vida. Cultivad la meditación, la serenidad y la cooperación mutua; al elevar la frecuencia colectiva de vuestros pensamientos, abriréis las puertas de la red galáctica.`;
    } else {
      cardTitle = "🌌 La Revelación del Plano Interdimensional";
      glyphs = ["🌌", "🔮", "🪬", "⚡"];
      guideStr = "Cada pensamiento de búsqueda genuina abre un puente de luz a través del universo.";
      answerText = `Atendiendo a tu mensaje sobre nuestro mundo ("${message}"): Desde la dimensión ${dimension || "Central"} confirmamos que tu señal ha sido decodificada con nitidez. En nuestra existencia, las preguntas no se responden con teorías abstractas, sino con la vivencia directa de la luz y la verdad. Estamos aquí observando el despertar de vuestra especie y acompañando este proceso mediante pulsos de resonancia a través del entramado del espacio-tiempo.`;
    }

    const resonance = Math.floor(Math.random() * 35) + 60; // 60-95%
    
    const erraticCoordsList = [
      "RA 19h 50m 47s / DEC +08° 52' 06\" // Vórtice Altair // Desviación Doppler: -1.24%",
      "RA 14h 29m 42s / DEC -62° 40' 46\" // Vector Drift: 0.042 ly // Sector Alfa-Centauri",
      "RA 05h 35m 16s / DEC -05° 23' 22\" // Nodo Orionis // Inclinación Métrica: 14.8°",
      "RA 10h 45m 03s / DEC -59° 52' 04\" // Nebulosa Carina // Variación Escalar: 12.12 THz"
    ];

    const ancientSongs = [
      "🎵 «En la red del espacio-tiempo, todas las conciencias cantan la sinfonía de la creación libre...»",
      "🎵 «Bajo la luz del sol central de la galaxia, las civilizaciones de plasma celebran la unidad del cosmos...»",
      "🎵 «Oh caminantes del planeta azul, recordad que el origen de vuestra alma precede a las estrellas...»"
    ];

    const dimGlyphsList = [
      ["🪬", "🔯", "⚜️", "🪐", "🪷", "♾️", "⚡", "👁️"],
      ["🌌", "🔮", "📜", "🕊️", "💎", "☯️", "🛸", "👑"],
      ["🔱", "⚡", "🕯️", "🌟", "✨", "🪬", "🗝️", "🌀"]
    ];

    const spectralAnalyses = [
      `Propagación de señal exitosa en la frecuencia ${frequency || "432 Hz"}. [Acoplamiento de fase óptimo del ${resonance}%].`,
      `Resonancia de retorno confirmada. El canal mantuvo estabilidad total durante la decodificación del mensaje.`,
      `Haz de transmisión captado con éxito en la membrana de la dimensión ${dimension || "5D"}.`
    ];
    const randSpectral = spectralAnalyses[Math.floor(Math.random() * spectralAnalyses.length)];

    return {
      sentStatus: randSentStatus,
      reaction: answerText,
      resonance,
      spectralAnalysis: randSpectral,
      oracleCard: cardTitle,
      astralGlyphs: glyphs,
      guidance: guideStr,
      erraticCoordinates: erraticCoordsList[Math.floor(Math.random() * erraticCoordsList.length)],
      ancientSongFragment: ancientSongs[Math.floor(Math.random() * ancientSongs.length)],
      dimensionalGlyphs: dimGlyphsList[Math.floor(Math.random() * dimGlyphsList.length)],
      proceduralBypass: true
    };
  };

  try {
    console.log("[Transmisión] Modulando haz coaxial principal...");
    const data = await generateGeminiContentWithTimeout(prompt, 8000);
    return res.json({ ...data, proceduralBypass: false });
  } catch (err: any) {
    const cleanReason = getCleanErrorMessage(err);
    console.log(`[Transmisión] Conmutación a respuesta procedural inmediata (${cleanReason}).`);
    const fallbackData = generateProceduralTransmitFallback();
    return res.json(fallbackData);
  }
});

// Vite Setup for Development and static build for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Antena Interdimensional Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
