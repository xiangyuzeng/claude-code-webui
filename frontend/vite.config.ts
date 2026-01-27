/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, ".."), "");
  const apiPort = env.PORT || "8080";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@shared": resolve(__dirname, "../shared"),
        "@": resolve(__dirname, "src"),
        "~types": resolve(__dirname, "src/types"),
        "~components": resolve(__dirname, "src/components"),
        "~features": resolve(__dirname, "src/features"),
        "~hooks": resolve(__dirname, "src/hooks"),
        "~utils": resolve(__dirname, "src/utils"),
        "~contexts": resolve(__dirname, "src/contexts"),
        "~i18n": resolve(__dirname, "src/i18n"),
        "~theme": resolve(__dirname, "src/theme"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      globals: true,
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/cypress/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "**/scripts/**", // Exclude Playwright demo recording files
        "**/tests/**", // Exclude Playwright validation tests
      ],
    },
  };
});
