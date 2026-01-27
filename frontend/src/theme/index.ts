import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type { Theme } from "~types/settings";

// Color palette aligned with TailwindCSS slate colors
const lightPalette = {
  primary: {
    main: "#2563eb", // blue-600
    light: "#3b82f6", // blue-500
    dark: "#1d4ed8", // blue-700
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#64748b", // slate-500
    light: "#94a3b8", // slate-400
    dark: "#475569", // slate-600
    contrastText: "#ffffff",
  },
  background: {
    default: "#f8fafc", // slate-50
    paper: "#ffffff",
  },
  text: {
    primary: "#1e293b", // slate-800
    secondary: "#64748b", // slate-500
  },
  divider: "#e2e8f0", // slate-200
  error: {
    main: "#dc2626", // red-600
  },
  warning: {
    main: "#f59e0b", // amber-500
  },
  success: {
    main: "#16a34a", // green-600
  },
  info: {
    main: "#0ea5e9", // sky-500
  },
};

const darkPalette = {
  primary: {
    main: "#3b82f6", // blue-500
    light: "#60a5fa", // blue-400
    dark: "#2563eb", // blue-600
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#94a3b8", // slate-400
    light: "#cbd5e1", // slate-300
    dark: "#64748b", // slate-500
    contrastText: "#0f172a",
  },
  background: {
    default: "#0f172a", // slate-900
    paper: "#1e293b", // slate-800
  },
  text: {
    primary: "#f1f5f9", // slate-100
    secondary: "#94a3b8", // slate-400
  },
  divider: "#334155", // slate-700
  error: {
    main: "#f87171", // red-400
  },
  warning: {
    main: "#fbbf24", // amber-400
  },
  success: {
    main: "#4ade80", // green-400
  },
  info: {
    main: "#38bdf8", // sky-400
  },
};

const getBaseThemeOptions = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === "light" ? lightPalette : darkPalette),
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    h1: { fontWeight: 700, letterSpacing: "-0.025em" },
    h2: { fontWeight: 700, letterSpacing: "-0.025em" },
    h3: { fontWeight: 600, letterSpacing: "-0.025em" },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12, // Matches rounded-xl
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            mode === "light"
              ? "0 1px 3px 0 rgb(0 0 0 / 0.1)"
              : "0 1px 3px 0 rgb(0 0 0 / 0.3)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginLeft: 8,
          marginRight: 8,
          "&.Mui-selected": {
            backgroundColor:
              mode === "light"
                ? "rgba(37, 99, 235, 0.1)"
                : "rgba(59, 130, 246, 0.2)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export const createAppTheme = (mode: Theme) =>
  createTheme(getBaseThemeOptions(mode));

export type AppTheme = ReturnType<typeof createAppTheme>;
