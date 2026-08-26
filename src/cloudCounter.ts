/**
 * Cloud Counter Universal — Sistema de Telemetría y Conteo Global Automático
 * 
 * Funciona de forma 100% autónoma y gratuita sin requerir cuentas, tokens ni configuración
 * tanto en Netlify (sitio estático) como en el servidor Express local o contenedores.
 */

import { isOperatorExcluded } from "./mixpanel";

const CLOUD_COUNTER_KEY = "antena_interdimensional_visits_v1";
const LOCAL_STORAGE_KEY = "antena_cached_visits";
const SESSION_STORAGE_KEY = "antena_visited_session_cloud";

// Valor base inicial de visitas para mantener la coherencia histórica
const INITIAL_BASELINE_VISITS = 152;

export interface CloudCounterStatus {
  totalVisits: number;
  isCloudSynced: boolean;
  source: "cloud" | "server" | "cache";
  lastSyncTime: Date;
}

let lastKnownCount = INITIAL_BASELINE_VISITS;

// Cargar conteo previo del almacenamiento local
if (typeof window !== "undefined") {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed > 0) {
        lastKnownCount = parsed;
      }
    }
  } catch (e) {}
}

/**
 * Guarda y actualiza de forma segura el conteo en localStorage asegurando que nunca disminuya
 */
export const persistLocalCount = (count: number): number => {
  if (typeof count !== "number" || isNaN(count)) return lastKnownCount;
  lastKnownCount = Math.max(lastKnownCount, count);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(lastKnownCount));
    } catch (e) {}
  }
  return lastKnownCount;
};

/**
 * Obtiene el conteo actual de visitas desde la nube o el servidor sin incrementar
 */
export const getCloudVisits = async (): Promise<number> => {
  // 1. Intentar consultar servidor local si está disponible
  try {
    const localRes = await fetch("/api/visits", { signal: AbortSignal.timeout(2500) });
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && typeof localData.visits === "number") {
        return persistLocalCount(localData.visits);
      }
    }
  } catch (e) {
    // Si estamos en Netlify u hosting estático, /api/visits no existe, continuamos a la nube
  }

  // 2. Consultar servicio Cloud Counter gratuito (CounterAPI Global)
  try {
    const cloudRes = await fetch(`https://api.counterapi.dev/v1/${CLOUD_COUNTER_KEY}/visits`, {
      signal: AbortSignal.timeout(3500)
    });
    if (cloudRes.ok) {
      const cloudData = await cloudRes.json();
      if (cloudData && typeof cloudData.count === "number") {
        return persistLocalCount(cloudData.count + INITIAL_BASELINE_VISITS);
      }
    }
  } catch (e) {
    // Falla de red en API primaria
  }

  // 3. Consultar proveedor alternativo gratuito (CodeTabs Counter API)
  try {
    const altRes = await fetch(`https://api.codetabs.com/v1/counter?key=${CLOUD_COUNTER_KEY}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (altRes.ok) {
      const altCount = await altRes.text();
      const parsed = parseInt(altCount, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return persistLocalCount(parsed + INITIAL_BASELINE_VISITS);
      }
    }
  } catch (e) {}

  return lastKnownCount;
};

/**
 * Registra una nueva visita incrementando el contador en la nube y servidor
 * Aplica deduplicación por sesión para no inflar visitas por recargas inmediatas
 */
export const registerCloudVisit = async (force: boolean = false): Promise<number> => {
  // Si el usuario es el administrador/creador y tiene la exclusión activa, no incrementar
  if (!force && isOperatorExcluded()) {
    console.log("[CloudCounter] Visita excluida para el operador/desarrollador.");
    return getCloudVisits();
  }

  // Comprobar si ya se contó en esta sesión de navegador
  if (!force && typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    const alreadyVisited = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (alreadyVisited) {
      return getCloudVisits();
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
  }

  let newCount = lastKnownCount + 1;

  // 1. Intentar incrementar en el servidor Express si existe
  try {
    const localRes = await fetch("/api/visits/increment", {
      method: "POST",
      signal: AbortSignal.timeout(2500)
    });
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && typeof localData.visits === "number") {
        newCount = persistLocalCount(localData.visits);
      }
    }
  } catch (e) {}

  // 2. Incrementar en el servicio Cloud Counter Universal (funciona directo en Netlify)
  try {
    const cloudRes = await fetch(`https://api.counterapi.dev/v1/${CLOUD_COUNTER_KEY}/visits/up`, {
      signal: AbortSignal.timeout(4000)
    });
    if (cloudRes.ok) {
      const cloudData = await cloudRes.json();
      if (cloudData && typeof cloudData.count === "number") {
        newCount = persistLocalCount(cloudData.count + INITIAL_BASELINE_VISITS);
      }
    }
  } catch (e) {
    console.warn("[CloudCounter] Fallback local activo para el contador.");
  }

  persistLocalCount(newCount);
  return newCount;
};

/**
 * Permite ajustar manualmente la cifra si el administrador lo requiere
 */
export const setManualCount = async (count: number): Promise<number> => {
  const cleanVal = Math.max(0, count);
  persistLocalCount(cleanVal);

  // Intentar sincronizar con el servidor local si está presente
  try {
    await fetch("/api/visits/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: cleanVal }),
      signal: AbortSignal.timeout(2000)
    });
  } catch (e) {}

  // Intentar sincronizar en la nube
  try {
    await fetch(`https://api.counterapi.dev/v1/${CLOUD_COUNTER_KEY}/visits/set?count=${Math.max(0, cleanVal - INITIAL_BASELINE_VISITS)}`, {
      signal: AbortSignal.timeout(3000)
    });
  } catch (e) {}

  return cleanVal;
};
