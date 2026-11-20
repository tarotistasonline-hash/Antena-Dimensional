export type VisualThemeId = "vacio-profundo" | "nebulosa-purpura" | "cromo-anunnaki";

export interface VisualThemeOption {
  id: VisualThemeId;
  name: string;
  subtitle: string;
  description: string;
  swatches: [string, string, string];
  badgeText: string;
}

export const VISUAL_THEMES: VisualThemeOption[] = [
  {
    id: "vacio-profundo",
    name: "Vacío Profundo",
    subtitle: "Oscuro Interestelar",
    description: "Negro abisal y obsidiana cósmica con acentos esmeralda y cian de alta precisión.",
    swatches: ["#03050a", "#0f172a", "#10b981"],
    badgeText: "Por defecto",
  },
  {
    id: "nebulosa-purpura",
    name: "Nebulosa Púrpura",
    subtitle: "Amatista & Polvo Estelar",
    description: "Atmósfera violeta profunda inspirada en nebulosas de emisión con destellos magenta y lavanda.",
    swatches: ["#100720", "#271347", "#c084fc"],
    badgeText: "Cósmico",
  },
  {
    id: "cromo-anunnaki",
    name: "Cromo Anunnaki",
    subtitle: "Titanio & Oro Cuneiforme",
    description: "Superficies metálicas oscuras en grafito cromado con reflejos dorados y bronce ancestral.",
    swatches: ["#12100c", "#262119", "#f59e0b"],
    badgeText: "Metálico",
  },
];

export const VISUAL_THEME_STORAGE_KEY = "antena_visual_theme";
