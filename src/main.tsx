import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Apply light theme class if needed — dark is default, no class required
try {
  const s = JSON.parse(localStorage.getItem('arduino-typing-tutor-settings') || '{}');
  if (s.theme === 'light') {
    document.documentElement.classList.add('light');
  }
} catch {
  // dark theme is default, no action needed
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
