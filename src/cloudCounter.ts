/**
 * Contador de Visitas Reales y Telemetría Autónomo
 * Registra visitas reales persistentes en el servidor sin dependencias ni cuentas externas.
 */

import { safeStorage, safeSessionStorage } from "./utils/storage";

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const STORAGE_VISITS_KEY = "antena_universal_visits_count";
const STORAGE_EVENTS_KEY = "antena_telemetry_events_log";
const LAST_INCREMENT_TIME_KEY = "antena_last_increment_time_epoch";
const SESSION_COUNTED_KEY = "antena_visit_session_counted";
const VISIT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos para evitar inflar con recargas rápidas

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: "visita" | "sintonizacion" | "consulta" | "grabacion" | "transmision";
  details: string;
  device: string;
}

export interface ServerVisitLog {
  id: string;
  timestamp: string;
  device: string;
}

export interface ServerVisitStats {
  visits: number;
  updatedAt?: string;
  recentVisits: ServerVisitLog[];
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

// Obtener lista de eventos de telemetría guardados localmente
export const getLocalTelemetryLogs = (): TelemetryEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = safeStorage.getItem(STORAGE_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

// Registrar un nuevo evento de telemetría local
export const logTelemetryEvent = (
  type: TelemetryEvent["type"],
  details: string
): TelemetryEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const current = getLocalTelemetryLogs();
    const newEvent: TelemetryEvent = {
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
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
    const updated = [newEvent, ...current].slice(0, 50);
    safeStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// Obtener conteo guardado en caché local
export const getStoredVisits = (): number => {
  if (typeof window === "undefined") return 303;
  try {
    const val = safeStorage.getItem(STORAGE_VISITS_KEY);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {}
  return 303;
};

// Guardar conteo en caché local
export const saveStoredVisits = (count: number): number => {
  const safeVal = Math.max(0, Math.floor(count));
  if (typeof window !== "undefined") {
    try {
      safeStorage.setItem(STORAGE_VISITS_KEY, String(safeVal));
    } catch (e) {}
  }
  return safeVal;
};

// Comprueba si el operador actual está excluido del conteo
export const isCurrentOperatorExcluded = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("exclude") === "true") {
      setOperatorExclusionState(true);
      return true;
    }
    if (params.get("include") === "true") {
      setOperatorExclusionState(false);
      return false;
    }
  } catch (e) {}

  return safeStorage.getItem("antena_operator_excluded") === "true";
};

// Activa o desactiva la exclusión del operador
export const setOperatorExclusionState = (excluded: boolean): boolean => {
  if (typeof window !== "undefined") {
    try {
      safeStorage.setItem("antena_operator_excluded", String(excluded));
      safeStorage.setItem("antena_exclude_my_visits_v2", String(excluded));
      safeStorage.setItem("antena_exclude_my_visits", String(excluded));
    } catch (e) {}
  }
  return excluded;
};

// Obtiene conteo real y registros recientes en vivo desde el servidor
export const fetchServerVisitStats = async (): Promise<ServerVisitStats> => {
  let count = getStoredVisits();
  let recentVisits: ServerVisitLog[] = [];
  let updatedAt: string | undefined;
  try {
    const res = await fetchWithTimeout("/api/visits?t=" + Date.now(), {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    }, 6000);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.visits === "number") {
        count = saveStoredVisits(data.visits);
      }
      if (Array.isArray(data?.recentVisits)) {
        recentVisits = data.recentVisits;
      }
      if (typeof data?.updatedAt === "string") {
        updatedAt = data.updatedAt;
      }
    }
  } catch (e) {
    // Si la red falla, se conserva la copia local
  }
  return { visits: count, updatedAt, recentVisits };
};

// Sincroniza y obtiene el conteo real en vivo desde el servidor
export const fetchServerVisits = async (): Promise<number> => {
  const stats = await fetchServerVisitStats();
  return stats.visits;
};

// Registrar visita real (1 vez por sesión / ventana de 30 min, o forzada manualmente por el admin)
export const registerUniversalVisit = async (force: boolean = false): Promise<number> => {
  let count = getStoredVisits();
  const isExcluded = isCurrentOperatorExcluded();

  if (isExcluded && !force) {
    return fetchServerVisits();
  }

  const now = Date.now();
  const alreadyCountedThisSession = safeSessionStorage.getItem(SESSION_COUNTED_KEY) === "true";
  const lastTime = parseInt(safeStorage.getItem(LAST_INCREMENT_TIME_KEY) || "0", 10);
  const cooldownExpired = isNaN(lastTime) || now - lastTime > VISIT_COOLDOWN_MS;

  const shouldIncrement = force || (!alreadyCountedThisSession && cooldownExpired);

  if (shouldIncrement) {
    safeSessionStorage.setItem(SESSION_COUNTED_KEY, "true");
    safeStorage.setItem(LAST_INCREMENT_TIME_KEY, String(now));

    const deviceInfo = getDeviceInfo();
    logTelemetryEvent("visita", `Nueva visita real registrada desde ${deviceInfo}`);

    try {
      const res = await fetchWithTimeout("/api/visits/increment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ device: deviceInfo }),
      }, 6000);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.visits === "number") {
          count = saveStoredVisits(data.visits);
          return count;
        }
      }
    } catch (e) {
      count += 1;
      saveStoredVisits(count);
      return count;
    }
  } else {
    return fetchServerVisits();
  }

  return count;
};

// Forzar incremento explícito (+1 de prueba o botón directo del administrador)
export const incrementServerVisit = async (): Promise<number> => {
  return registerUniversalVisit(true);
};

// Calibrar o establecer el conteo manualmente desde la consola de operador
export const setUniversalVisits = async (newCount: number): Promise<number> => {
  const val = Math.max(0, Math.floor(newCount));
  saveStoredVisits(val);
  logTelemetryEvent("visita", `Contador calibrado manualmente a ${val}`);
  try {
    const res = await fetchWithTimeout("/api/visits/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: val }),
    }, 6000);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.visits === "number") {
        return saveStoredVisits(data.visits);
      }
    }
  } catch (e) {}
  return val;
};
