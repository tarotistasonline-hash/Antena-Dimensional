import mixpanel from "mixpanel-browser";

let isInitialized = false;
let currentToken = "";

/**
 * Genera o recupera un Identificador Único Persistente (Distinct ID) para este navegador/cliente.
 * Esto es CRUCIAL para que Mixpanel reconozca usuarios y visitas únicas en lugar de agrupar todo en 1 solo usuario.
 */
export const getDistinctId = (): string => {
  if (typeof window === "undefined") return "operador_servidor";
  let id = localStorage.getItem("antena_mixpanel_distinct_id");
  if (!id) {
    id = "op_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    localStorage.setItem("antena_mixpanel_distinct_id", id);
  }
  return id;
};

export const DEFAULT_MIXPANEL_TOKEN = "a2abc4490ad62c9fb7713c881bb63b51";

/**
 * Obtiene el Token activo de Mixpanel desde localStorage, variables de entorno o predeterminado
 */
export const getMixpanelToken = (): string => {
  if (typeof window === "undefined") return DEFAULT_MIXPANEL_TOKEN;
  const stored = localStorage.getItem("mixpanel_project_token");
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }
  const envToken = (import.meta as any).env?.VITE_MIXPANEL_TOKEN;
  if (envToken && typeof envToken === "string" && envToken.trim().length > 0) {
    return envToken.trim();
  }
  return DEFAULT_MIXPANEL_TOKEN;
};

/**
 * Comprueba si Mixpanel está activo con un token válido
 */
export const isMixpanelInitialized = (): boolean => {
  return isInitialized && !!currentToken;
};

/**
 * Inicializa Mixpanel con el token configurado
 */
export const initMixpanel = (tokenOverride?: string): boolean => {
  const tokenToUse = tokenOverride || getMixpanelToken();
  if (!tokenToUse) {
    console.log("[Mixpanel] Token no configurado localmente. Consultando servidor...");
    // Intentar obtener token desde la API del servidor
    if (typeof window !== "undefined") {
      fetch("/api/mixpanel/config")
        .then((r) => r.json())
        .then((cfg) => {
          if (cfg && cfg.token && typeof cfg.token === "string" && cfg.token.trim()) {
            const cleanToken = cfg.token.trim();
            localStorage.setItem("mixpanel_project_token", cleanToken);
            initMixpanel(cleanToken);
          }
        })
        .catch(() => {});
    }
    return false;
  }

  try {
    const distinctId = getDistinctId();
    mixpanel.init(tokenToUse, {
      debug: false,
      track_pageview: true,
      persistence: "localStorage",
      batch_requests: false,
      ignore_dnt: true,
    });
    mixpanel.identify(distinctId);
    isInitialized = true;
    currentToken = tokenToUse;
    console.log("[Mixpanel] SDK Inicializado exitosamente con token:", tokenToUse.substring(0, 6) + "...", "Distinct ID:", distinctId);
    return true;
  } catch (err) {
    console.warn("[Mixpanel] Error al inicializar SDK:", err);
    return false;
  }
};

/**
 * Permite al usuario guardar un Token de Mixpanel manualmente desde la interfaz
 * Guarda localmente y en el servidor de forma persistente.
 */
export const saveMixpanelToken = async (newToken: string): Promise<boolean> => {
  const cleanToken = newToken.trim();
  
  if (!cleanToken) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mixpanel_project_token");
      try {
        await fetch("/api/mixpanel/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "" }),
        });
      } catch (err) {
        console.warn("Error al borrar token en servidor:", err);
      }
    }
    isInitialized = false;
    currentToken = "";
    return false;
  }

  // Enviar siempre al servidor primero para guardar el archivo config persistentemente
  if (typeof window !== "undefined") {
    try {
      await fetch("/api/mixpanel/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleanToken }),
      });
      localStorage.setItem("mixpanel_project_token", cleanToken);
    } catch (err) {
      console.warn("Error al guardar token en servidor:", err);
    }
  }

  const success = initMixpanel(cleanToken);
  if (success) {
    trackEvent("Token Mixpanel Conectado", {
      timestamp: new Date().toISOString(),
      source: "Manual UI Configuration",
    });
  }
  return success;
};

/**
 * Comprueba si el operador actual ha activado "Excluir Mis Visitas"
 * NOTA: Por defecto es FALSE para que las visitas de usuarios reales y métricas de Mixpanel SE REGISTREN.
 * El creador/administrador puede activar la exclusión haciendo clic en el botón de la UI o ingresando con ?owner=true o ?creator=true.
 */
export const isOperatorExcluded = (): boolean => {
  if (typeof window === "undefined") return false;

  // Detección por parámetro de URL (ej: ?owner=true, ?creator=true, ?admin=true, ?exclude=true)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("owner") === "true" ||
      params.get("creator") === "true" ||
      params.get("admin") === "true" ||
      params.get("exclude") === "true"
    ) {
      setOperatorExcluded(true);
      return true;
    }
  } catch (e) {}

  return (
    localStorage.getItem("antena_operator_excluded") === "true" ||
    localStorage.getItem("antena_exclude_my_visits_v2") === "true" ||
    localStorage.getItem("antena_exclude_my_visits") === "true"
  );
};

/**
 * Activa o desactiva la exclusión de visitas del operador
 */
export const setOperatorExcluded = (excluded: boolean): boolean => {
  if (typeof window === "undefined") return false;
  localStorage.setItem("antena_operator_excluded", excluded ? "true" : "false");
  localStorage.setItem("antena_exclude_my_visits_v2", excluded ? "true" : "false");
  localStorage.setItem("antena_exclude_my_visits", excluded ? "true" : "false");
  return excluded;
};

/**
 * Registra un evento en Mixpanel (cliente SDK + servidor proxy antitrazado) y en la consola local.
 * Si forceSend es true, omite la comprobación de exclusión (ideal para pruebas).
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>, forceSend: boolean = false) => {
  if (!forceSend && isOperatorExcluded()) {
    console.log(`[Mixpanel - Visita de Operador Excluida] Evento omitido: "${eventName}"`);
    return Promise.resolve(null);
  }

  const token = getMixpanelToken() || currentToken;
  if (!isInitialized && token) {
    initMixpanel(token);
  }

  const activeToken = token || currentToken;
  const distinctId = getDistinctId();

  const enrichedProps = {
    distinct_id: distinctId,
    $distinct_id: distinctId,
    url: typeof window !== "undefined" ? window.location.href : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    screenResolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // 1. Envío por SDK de Mixpanel en cliente
  if (isInitialized && (!isOperatorExcluded() || forceSend)) {
    try {
      mixpanel.track(eventName, enrichedProps);
      console.log(`[Mixpanel SDK Transmitido] Evento: "${eventName}"`, enrichedProps);
    } catch (err) {
      console.warn(`[Mixpanel SDK Error] Evento "${eventName}":`, err);
    }
  }

  // 2. Envío por Servidor Proxy (Bypassea AdBlockers y entrega garantizada a Mixpanel US y EU)
  if (activeToken) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    return fetch("/api/mixpanel/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        event: eventName,
        distinct_id: distinctId,
        properties: enrichedProps,
      }),
      signal: controller ? controller.signal : undefined,
    })
      .then((r) => r.json())
      .then((res) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.log(`[Mixpanel Server Proxy Confirmado]:`, res);
        return res;
      })
      .catch((err) => {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn(`[Mixpanel Server Proxy Warning]:`, err);
        return null;
      });
  } else {
    console.log(`[Telemetría Local] Evento: "${eventName}"`, enrichedProps);
    return Promise.resolve(null);
  }
};

/**
 * Obtiene el registro de eventos en vivo procesados por el servidor
 */
export const fetchMixpanelLogs = async () => {
  try {
    const res = await fetch("/api/mixpanel/logs");
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    return [];
  }
};

/**
 * Identifica a un usuario/operador en Mixpanel
 */
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (!isInitialized) initMixpanel();
  if (isInitialized) {
    try {
      mixpanel.identify(userId);
      if (traits) {
        mixpanel.people.set(traits);
      }
    } catch (err) {
      console.warn("[Mixpanel] Error al identificar usuario:", err);
    }
  }
};
