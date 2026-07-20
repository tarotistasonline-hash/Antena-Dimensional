import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = (import.meta as any).env?.VITE_MIXPANEL_TOKEN || "";

let isInitialized = false;

/**
 * Inicializa Mixpanel si el token está presente en las variables de entorno.
 */
export const initMixpanel = () => {
  if (MIXPANEL_TOKEN && !isInitialized) {
    try {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: true,
        track_pageview: true,
        persistence: "localStorage",
      });
      isInitialized = true;
      console.log("[Mixpanel] Inicializado correctamente en producción.");
    } catch (err) {
      console.warn("[Mixpanel] Error al inicializar SDK:", err);
    }
  } else if (!MIXPANEL_TOKEN) {
    console.log("[Mixpanel] VITE_MIXPANEL_TOKEN ausente. Operando en modo Simulación de Telemetría.");
  }
};

/**
 * Registra un evento en Mixpanel o en consola si no está activo.
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (isInitialized) {
    try {
      mixpanel.track(eventName, properties);
    } catch (err) {
      console.warn(`[Mixpanel] Error al registrar evento "${eventName}":`, err);
    }
  } else {
    console.log(`[Telemetría Mixpanel Sintonizada] Evento: "${eventName}"`, properties || {});
  }
};
