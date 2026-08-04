// lib/theme.ts
export type Theme = "light" | "dark";
export type Accent = "blue" | "green" | "orange" | "pink" | "violet" | "neutral";

export interface BlockProps {
  theme?: Theme;
  accent?: Accent;
  embedded?: boolean;
}

export const DEFAULT_THEME: Theme = "dark";
export const DEFAULT_ACCENT: Accent = "blue";

const ACCENT_HEX: Record<Accent, string> = {
  blue: "#0093FF",
  green: "#22C55E",
  orange: "#F97316",
  pink: "#EC4899",
  violet: "#8B5CF6",
  neutral: "#FFFFFF",
};

export function resolvedAccentHex(accent: Accent, theme: Theme): string {
  if (accent === "neutral") return theme === "dark" ? "#FFFFFF" : "#1C1C1C";
  return ACCENT_HEX[accent];
}

export function surfaceTokens(theme: Theme) {
  return theme === "dark"
    ? { bg: "#1C1C1C", surface: "#282825", text: "#F2F2F2", textSecondary: "#C7C7C2", textMuted: "#8C8C86", border: "rgba(255,255,255,0.1)" }
    : { bg: "#F7F6F2", surface: "#FFFFFF", text: "#1C1C1C", textSecondary: "#4A4A46", textMuted: "#8C8C86", border: "rgba(0,0,0,0.08)" };
}