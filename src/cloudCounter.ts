/**
 * Telemetría y Contador Universal Autónomo
 * Registra visitas reales y eventos sin depender de Mixpanel ni servicios de pago.
 */

const STORAGE_VISITS_KEY = "antena_universal_visits_count";
const STORAGE_EVENTS_KEY = "antena_telemetry_events_log";
const SESSION_FLAG_KEY = "antena_session_registered_today";

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: "visita" | "sintonizacion" | "consulta" | "grabacion" | "transmision";
  details: string;
  device: string;
}

// Obtener info básica del dispositivo del visitante
export const getDeviceInfo = (): string => {
  if (typeof window === "undefined" || !navigator) return "Navegador Web";
  const ua = navigator.userAgent;
  let device = "Escritorio (PC/Mac)";
  if (/Android/i.test(ua)) device = "Móvil (Android)";
  else if (/iPhone|iPad|iPod/i.test(ua)) device = "Móvil (iOS)";
  else if (/Mobile/i.test(ua)) device = "Dispositivo Móvil";

  let browser = "Navegador";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";

  return `${device} — ${browser}`;
};

// Obtener lista de eventos de telemetría guardados
export const getLocalTelemetryLogs = (): TelemetryEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

// Registrar un nuevo evento de telemetría
export const logTelemetryEvent = (
  type: TelemetryEvent["type"],
  details: string
): TelemetryEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const current = getLocalTelemetryLogs();
    const newEvent: TelemetryEvent = {
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }),
      type,
      details,
      device: getDeviceInfo(),
    };
    const updated = [newEvent, ...current].slice(0, 50); // Guardar los últimos 50 eventos
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// Obtener conteo guardado
export const getStoredVisits = (): number => {
  if (typeof window === "undefined") return 298;
  try {
    const val = localStorage.getItem(STORAGE_VISITS_KEY);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return Math.max(298, parsed);
    }
  } catch (e) {}
  return 298;
};

// Guardar conteo
export const saveStoredVisits = (count: number): number => {
  const safeVal = Math.max(298, count);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_VISITS_KEY, String(safeVal));
    } catch (e) {}
  }
  return safeVal;
};

// Registrar visita (incrementa si es sesión nueva)
export const registerUniversalVisit = async (): Promise<number> => {
  let count = getStoredVisits();

  // Verificar si el operador actual está excluido (Filtro creador / ?owner=true)
  const isOperatorExcluded =
    typeof window !== "undefined" &&
    (localStorage.getItem("antena_operator_excluded") === "true" ||
      new URLSearchParams(window.location.search).get("owner") === "true");

  // Verificar si ya se registró en esta pestaña/sesión
  const alreadyVisited = typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_FLAG_KEY);

  if (!alreadyVisited && !isOperatorExcluded) {
    count += 1;
    saveStoredVisits(count);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_FLAG_KEY, "true");
    }
    logTelemetryEvent("visita", `Nueva conexión registrada desde ${getDeviceInfo()}`);
  }

  // Intentar sincronizar con el servidor local si existe
  try {
    const endpoint = !alreadyVisited && !isOperatorExcluded ? "/api/visits/increment" : "/api/visits";
    const method = endpoint === "/api/visits/increment" ? "POST" : "GET";
    const res = await fetch(endpoint, { method, signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.visits === "number") {
        count = Math.max(count, data.visits);
        saveStoredVisits(count);
      }
    }
  } catch (e) {}

  return count;
};

// Función para reiniciar o cambiar el conteo manualmente
export const setUniversalVisits = async (newCount: number): Promise<number> => {
  const val = saveStoredVisits(newCount);
  logTelemetryEvent("visita", `Contador ajustado manualmente a ${val}`);
  try {
    await fetch("/api/visits/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: val }),
      signal: AbortSignal.timeout(1500),
    });
  } catch (e) {}
  return val;
};
