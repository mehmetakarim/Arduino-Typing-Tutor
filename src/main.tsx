import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import {
  loadProgressFromFS,
  loadSettingsFromFS,
  setCachedProgress,
  setCachedSettings,
} from "./utils/storage";

async function init() {
  const [progress, settings] = await Promise.all([
    loadProgressFromFS(),
    loadSettingsFromFS(),
  ]);

  setCachedProgress(progress);
  setCachedSettings(settings);

  // Temayı render öncesi uygula (FOUC önlemek için)
  if (settings.theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();
