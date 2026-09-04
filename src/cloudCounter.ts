/**
 * Telemetría y Contador Universal Autónomo
 * Registra visitas reales y eventos sin depender de Mixpanel ni servicios de pago.
 */

const STORAGE_VISITS_KEY = "antena_universal_visits_count";
const STORAGE_EVENTS_KEY = "antena_telemetry_events_log";
const LAST_INCREMENT_TIME_KEY = "antena_last_increment_time_epoch";

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
    const updated = [newEvent, ...current].slice(0, 50); // Guardar los últimos 50 eventos
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// Obtener conteo guardado en caché local
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

// Guardar conteo en caché local
export const saveStoredVisits = (count: number): number => {
  const safeVal = Math.max(298, count);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_VISITS_KEY, String(safeVal));
    } catch (e) {}
  }
  return safeVal;
};

// Comprueba si el operador actual está excluido del conteo
export const isCurrentOperatorExcluded = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("owner") === "true" ||
      params.get("creator") === "true" ||
      params.get("admin") === "true" ||
      params.get("exclude") === "true"
    ) {
      setOperatorExclusionState(true);
      return true;
    }
  } catch (e) {}

  return (
    localStorage.getItem("antena_operator_excluded") === "true" ||
    localStorage.getItem("antena_exclude_my_visits_v2") === "true" ||
    localStorage.getItem("antena_exclude_my_visits") === "true"
  );
};

// Activa o desactiva la exclusión del operador
export const setOperatorExclusionState = (excluded: boolean): boolean => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("antena_operator_excluded", String(excluded));
      localStorage.setItem("antena_exclude_my_visits_v2", String(excluded));
      localStorage.setItem("antena_exclude_my_visits", String(excluded));
    } catch (e) {}
  }
  return excluded;
};

// Sincroniza y obtiene el conteo real en vivo desde el servidor
export const fetchServerVisits = async (): Promise<number> => {
  let count = getStoredVisits();
  try {
    const res = await fetch("/api/visits", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.visits === "number") {
        count = Math.max(count, data.visits);
        saveStoredVisits(count);
      }
    }
  } catch (e) {
    // Si la red falla, se conserva la copia local
  }
  return count;
};

// Registrar visita (incrementa en el servidor si no está en cooldown o si es forzada)
export const registerUniversalVisit = async (force: boolean = false): Promise<number> => {
  let count = getStoredVisits();
  const isExcluded = isCurrentOperatorExcluded();

  // Si el operador activó exclusión voluntaria y no es una acción forzada (+1 de prueba), solo consulta
  if (isExcluded && !force) {
    return fetchServerVisits();
  }

  // Comprobar cooldown de 10 segundos entre incrementos automáticos de la misma sesión
  const now = Date.now();
  let lastTime = 0;
  if (typeof sessionStorage !== "undefined") {
    try {
      lastTime = parseInt(sessionStorage.getItem(LAST_INCREMENT_TIME_KEY) || "0", 10);
    } catch (e) {}
  }

  const shouldIncrement = force || isNaN(lastTime) || now - lastTime > 10000;

  if (shouldIncrement) {
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem(LAST_INCREMENT_TIME_KEY, String(now));
      } catch (e) {}
    }

    logTelemetryEvent("visita", `Nueva conexión registrada desde ${getDeviceInfo()}`);

    try {
      const res = await fetch("/api/visits/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.visits === "number") {
          count = Math.max(count, data.visits);
          saveStoredVisits(count);
          return count;
        }
      }
    } catch (e) {
      // Si el servidor no responde de inmediato, incrementa localmente de forma provisional
      count += 1;
      saveStoredVisits(count);
      return count;
    }
  } else {
    // Si ya incrementó hace menos de 10s, sincroniza con el servidor
    return fetchServerVisits();
  }

  return count;
};

// Forzar incremento explícito (+1 de prueba o botón directo)
export const incrementServerVisit = async (): Promise<number> => {
  return registerUniversalVisit(true);
};

// Función para reiniciar o cambiar el conteo manualmente
export const setUniversalVisits = async (newCount: number): Promise<number> => {
  const val = Math.max(298, Math.floor(newCount));
  saveStoredVisits(val);
  logTelemetryEvent("visita", `Contador ajustado manualmente a ${val}`);
  try {
    const res = await fetch("/api/visits/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: val }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.visits === "number") {
        return saveStoredVisits(data.visits);
      }
    }
  } catch (e) {}
  return val;
};
