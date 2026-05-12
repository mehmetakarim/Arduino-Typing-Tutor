import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import {
  loadProgressFromFS,
  loadSettingsFromFS,
  loadProfilesFromFS,
  loadParentSettingsFromFS,
  setCachedProgress,
  setCachedSettings,
  setCachedProfiles,
  setCachedParentSettings,
} from "./utils/storage";

async function init() {
  const [progress, settings, profiles, parentSettings] = await Promise.all([
    loadProgressFromFS(),
    loadSettingsFromFS(),
    loadProfilesFromFS(),
    loadParentSettingsFromFS(),
  ]);

  setCachedProgress(progress);
  setCachedSettings(settings);
  setCachedProfiles(profiles);
  setCachedParentSettings(parentSettings);

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
