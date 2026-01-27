import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Initialize i18n before App
import "~i18n/index";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
