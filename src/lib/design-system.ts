/**
 * Design System - Centralized tokens and utilities
 * Provides a single source of truth for design values
 */

// ============================================
// COLOR TOKENS
// ============================================
export const colors = {
  // Primary palette
  primary: {
    50: "hsl(217, 95%, 90%)",
    100: "hsl(217, 95%, 80%)",
    200: "hsl(217, 95%, 60%)",
    300: "hsl(217, 95%, 50%)",
    400: "hsl(217, 95%, 45%)",
    500: "hsl(217, 95%, 40%)",
    600: "hsl(217, 95%, 35%)",
    700: "hsl(217, 95%, 30%)",
  },

  // Secondary palette
  secondary: {
    50: "hsl(220, 90%, 88%)",
    100: "hsl(220, 90%, 75%)",
    200: "hsl(220, 90%, 60%)",
    300: "hsl(220, 90%, 48%)",
    400: "hsl(220, 90%, 40%)",
    500: "hsl(220, 90%, 38%)",
    600: "hsl(220, 90%, 32%)",
  },

  // Semantic colors
  success: "hsl(160, 75%, 42%)",
  warning: "hsl(38, 95%, 55%)",
  error: "hsl(0, 85%, 60%)",
  info: "hsl(200, 80%, 50%)",

  // Neutral palette
  neutral: {
    50: "hsl(240, 15%, 98%)",
    100: "hsl(240, 15%, 95%)",
    200: "hsl(240, 15%, 90%)",
    300: "hsl(240, 15%, 85%)",
    400: "hsl(240, 10%, 65%)",
    500: "hsl(240, 10%, 50%)",
    600: "hsl(240, 10%, 35%)",
    700: "hsl(240, 15%, 20%)",
    800: "hsl(240, 15%, 12%)",
    900: "hsl(240, 15%, 5%)",
  },
};

// ============================================
// SPACING SCALE
// ============================================
export const spacing = {
  "2xs": "0.25rem", // 4px
  "xs": "0.5rem",   // 8px
  "sm": "0.75rem",  // 12px
  "md": "1rem",     // 16px
  "lg": "1.5rem",   // 24px
  "xl": "2rem",     // 32px
  "2xl": "3rem",    // 48px
  "3xl": "4rem",    // 64px
  "4xl": "6rem",    // 96px
};

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  fontFamily: {
    sans: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSize: {
    xs: { size: "0.75rem", lineHeight: "1rem" },
    sm: { size: "0.875rem", lineHeight: "1.25rem" },
    base: { size: "1rem", lineHeight: "1.5rem" },
    lg: { size: "1.125rem", lineHeight: "1.75rem" },
    xl: { size: "1.25rem", lineHeight: "1.75rem" },
    "2xl": { size: "1.5rem", lineHeight: "2rem" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
  },

  // Pre-configured text styles
  styles: {
    h1: "text-4xl font-extrabold tracking-tight leading-tight",
    h2: "text-3xl font-bold tracking-tight leading-tight",
    h3: "text-2xl font-semibold tracking-tight leading-snug",
    h4: "text-xl font-semibold leading-snug",
    h5: "text-lg font-semibold leading-snug",
    h6: "text-base font-semibold leading-snug",
    body: "text-base leading-relaxed",
    bodySmall: "text-sm leading-relaxed",
    caption: "text-xs leading-relaxed",
    label: "text-sm font-medium",
  },
};

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  "2xs": "0 1px 2px rgba(0,0,0,0.03)",
  "xs": "0 1px 3px rgba(0,0,0,0.05)",
  "sm": "0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
  "md": "0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
  "lg": "0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.05)",
  "xl": "0 16px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)",
  "2xl": "0 24px 64px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.08)",
  glow: "0 0 40px hsla(217, 95%, 45%, 0.25)",
  "glow-lg": "0 0 60px hsla(217, 95%, 45%, 0.35)",
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: "0.375rem",      // 6px
  md: "0.625rem",      // 10px
  lg: "0.875rem",      // 14px
  xl: "1rem",          // 16px
  "2xl": "1.25rem",    // 20px
  "3xl": "1.5rem",     // 24px
  "4xl": "2rem",       // 32px
  full: "9999px",
};

// ============================================
// Z-INDEX SCALE
// ============================================
export const zIndex = {
  background: -1,
  base: 0,
  dropdown: 1000,
  sticky: 500,
  fixed: 1000,
  modal: 2000,
  tooltip: 2500,
  popover: 2000,
  toast: 3000,
};

// ============================================
// TRANSITION & ANIMATION
// ============================================
export const transitions = {
  duration: {
    fast: "100ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
    slowest: "500ms",
  },

  timingFunction: {
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    "bounce-smooth": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// ============================================
// COMPONENT SIZE SCALE
// ============================================
export const componentSizes = {
  // Button sizes
  button: {
    xs: { height: "1.75rem", padding: "0 0.5rem", fontSize: "0.75rem" },
    sm: { height: "2rem", padding: "0 0.75rem", fontSize: "0.875rem" },
    md: { height: "2.5rem", padding: "0 1rem", fontSize: "1rem" },
    lg: { height: "3rem", padding: "0 1.5rem", fontSize: "1.125rem" },
    xl: { height: "3.5rem", padding: "0 2rem", fontSize: "1.25rem" },
  },

  // Input sizes
  input: {
    sm: { height: "2rem", padding: "0.5rem 0.75rem" },
    md: { height: "2.5rem", padding: "0.75rem 1rem" },
    lg: { height: "3rem", padding: "1rem 1.25rem" },
  },

  // Icon sizes (in rem)
  icon: {
    xs: "1rem",
    sm: "1.25rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "2.5rem",
    "2xl": "3rem",
  },
};

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ============================================
// ELEVATION SYSTEM (for cards, overlays, etc)
// ============================================
export const elevation = {
  0: "var(--shadow-2xs)",
  1: "var(--shadow-xs)",
  2: "var(--shadow-sm)",
  3: "var(--shadow)",
  4: "var(--shadow-md)",
  5: "var(--shadow-lg)",
  6: "var(--shadow-xl)",
  7: "var(--shadow-2xl)",
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get responsive spacing value
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

/**
 * Get color with optional opacity
 * Example: getColor("primary", 500, 0.5) => "hsl(217, 95%, 40%, 0.5)"
 */
export function getColor(
  palette: keyof typeof colors | "success" | "warning" | "error" | "info",
  shade?: number,
  opacity?: number
): string {
  const paletteValue = colors[palette as keyof typeof colors];

  if (!paletteValue || typeof paletteValue === "string") {
    const color = typeof paletteValue === "string" ? paletteValue : colors[palette as keyof typeof colors];
    return opacity ? `${color}, ${opacity})` : color as string;
  }

  const colorValue = paletteValue[shade as keyof typeof paletteValue] || paletteValue[500 as keyof typeof paletteValue];
  return opacity ? `${colorValue}, ${opacity})` : colorValue;
}

/**
 * Create shadow CSS string
 */
export function getShadow(level: keyof typeof shadows): string {
  return shadows[level];
}

/**
 * Create border radius CSS value
 */
export function getBorderRadius(size: keyof typeof borderRadius): string {
  return borderRadius[size];
}
