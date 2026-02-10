/**
 * Glassmorphic Design System
 * Premium glass-style UI with white backgrounds and dark gradient accents
 */

export const glassStyles = {
  // Glass card variations
  cards: {
    primary: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/5",
    secondary: "bg-white/60 backdrop-blur-lg border border-white/30 shadow-xl shadow-black/5",
    accent: "bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20",
    metric: "bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-black/5 hover:shadow-3xl hover:border-white/60 transition-all duration-300",
    sidebar: "bg-white/70 backdrop-blur-2xl border-r border-white/30",
  },

  // Gradient overlays and accents
  gradients: {
    primary: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    accent: "bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600",
    success: "bg-gradient-to-br from-emerald-500 to-teal-600",
    warning: "bg-gradient-to-br from-amber-500 to-orange-600",
    danger: "bg-gradient-to-br from-rose-500 to-red-600",
    info: "bg-gradient-to-br from-blue-500 to-cyan-600",
    subtle: "bg-gradient-to-br from-slate-100 to-slate-200",
    dark: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
  },

  // Text gradients
  textGradients: {
    primary: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent",
    accent: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent",
    premium: "bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 bg-clip-text text-transparent",
  },

  // Button styles
  buttons: {
    primary: "bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-lg shadow-slate-900/30 hover:shadow-xl hover:shadow-slate-900/40",
    secondary: "bg-white/80 backdrop-blur-lg border border-slate-200 text-slate-900 hover:bg-white/90 shadow-lg shadow-slate-900/10",
    accent: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-purple-500/30",
    ghost: "bg-transparent hover:bg-white/50 backdrop-blur-sm text-slate-900",
    outline: "border-2 border-slate-200 bg-transparent hover:bg-white/50 text-slate-900",
  },

  // Input styles
  inputs: {
    default: "bg-white/80 backdrop-blur-lg border border-slate-200 focus:border-slate-400 focus:bg-white/90 shadow-sm",
    glass: "bg-white/60 backdrop-blur-xl border border-white/40 focus:border-white/60 focus:bg-white/80",
  },

  // Badge styles
  badges: {
    primary: "bg-slate-900 text-white",
    secondary: "bg-white/80 backdrop-blur-lg border border-slate-200 text-slate-900",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    danger: "bg-gradient-to-r from-rose-500 to-red-500 text-white",
    info: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
  },

  // Status colors
  status: {
    new: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      text: "text-blue-600",
      border: "border-blue-200",
      glow: "shadow-lg shadow-blue-500/30",
    },
    assigned: {
      bg: "bg-gradient-to-br from-purple-500 to-pink-500",
      text: "text-purple-600",
      border: "border-purple-200",
      glow: "shadow-lg shadow-purple-500/30",
    },
    in_progress: {
      bg: "bg-gradient-to-br from-indigo-500 to-purple-500",
      text: "text-indigo-600",
      border: "border-indigo-200",
      glow: "shadow-lg shadow-indigo-500/30",
    },
    pending_customer: {
      bg: "bg-gradient-to-br from-amber-500 to-orange-500",
      text: "text-amber-600",
      border: "border-amber-200",
      glow: "shadow-lg shadow-amber-500/30",
    },
    resolved: {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      text: "text-emerald-600",
      border: "border-emerald-200",
      glow: "shadow-lg shadow-emerald-500/30",
    },
    closed: {
      bg: "bg-gradient-to-br from-slate-500 to-slate-600",
      text: "text-slate-600",
      border: "border-slate-200",
      glow: "shadow-lg shadow-slate-500/30",
    },
  },

  // Priority colors
  priority: {
    critical: {
      bg: "bg-gradient-to-br from-rose-600 to-red-600",
      text: "text-rose-600",
      border: "border-rose-200",
      glow: "shadow-lg shadow-rose-500/40",
    },
    high: {
      bg: "bg-gradient-to-br from-orange-500 to-red-500",
      text: "text-orange-600",
      border: "border-orange-200",
      glow: "shadow-lg shadow-orange-500/30",
    },
    medium: {
      bg: "bg-gradient-to-br from-amber-500 to-yellow-500",
      text: "text-amber-600",
      border: "border-amber-200",
      glow: "shadow-lg shadow-amber-500/30",
    },
    low: {
      bg: "bg-gradient-to-br from-emerald-500 to-green-500",
      text: "text-emerald-600",
      border: "border-emerald-200",
      glow: "shadow-lg shadow-emerald-500/30",
    },
  },

  // Animation classes
  animations: {
    fadeIn: "animate-in fade-in duration-500",
    slideUp: "animate-in slide-in-from-bottom-4 duration-500",
    slideDown: "animate-in slide-in-from-top-4 duration-500",
    scaleIn: "animate-in zoom-in-95 duration-300",
    shimmer: "animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent",
  },

  // Layout backgrounds
  backgrounds: {
    app: "bg-gradient-to-br from-slate-50 via-white to-slate-100",
    page: "bg-white/30",
    section: "bg-white/50 backdrop-blur-sm",
  },

  // Shadows and effects
  effects: {
    glow: "shadow-2xl shadow-purple-500/20",
    glowHover: "hover:shadow-3xl hover:shadow-purple-500/30",
    innerGlow: "shadow-inner shadow-white/50",
    float: "hover:-translate-y-1 transition-transform duration-300",
    pulse: "animate-pulse",
  },
};

// Utility function to combine glass styles
export const glass = (...classes: string[]) => classes.filter(Boolean).join(" ");

// Premium color palette
export const colors = {
  // Primary palette (dark slate)
  primary: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  // Accent palette (purple-pink gradient)
  accent: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },

  // Semantic colors
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

// Typography system - Professional compact sizes
export const typography = {
  heading: {
    h1: "text-3xl font-bold tracking-tight",      // Reduced from 5xl
    h2: "text-2xl font-bold tracking-tight",      // Reduced from 4xl
    h3: "text-xl font-semibold tracking-tight",   // Reduced from 3xl
    h4: "text-lg font-semibold tracking-tight",   // Reduced from 2xl
    h5: "text-base font-semibold",                // Reduced from xl
    h6: "text-sm font-semibold",                  // Reduced from lg
  },
  body: {
    large: "text-base",       // Reduced from lg
    base: "text-sm",         // Reduced from base
    small: "text-xs",        // Reduced from sm
    xs: "text-[10px]",       // Reduced from xs
  },
  weight: {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },
};

// Spacing system
export const spacing = {
  xs: "0.5rem",  // 8px
  sm: "0.75rem", // 12px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
  "4xl": "6rem", // 96px
};

// Border radius
export const radius = {
  sm: "0.375rem",  // 6px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
};
