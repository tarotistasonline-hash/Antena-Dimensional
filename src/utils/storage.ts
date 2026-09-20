// Utilidad de almacenamiento local seguro con fallback en memoria
// Evita SecurityError o DOMException en iframes, modo incógnito o navegadores con cookies de terceros bloqueadas.

const inMemoryFallback = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignorar bloqueo de storage y usar fallback
    }
    return inMemoryFallback.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Ignorar bloqueo de storage y usar fallback
    }
    inMemoryFallback.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Ignorar bloqueo de storage y usar fallback
    }
    inMemoryFallback.delete(key);
  }
};
