const STORAGE_KEY = "law_firm_app_settings";

export const defaultAppSettings = {
  firmName: "Cabinet Ait El Hadj",
  email: "contact@aitelhadj-avocat.com",
  phone: "+212 5 22 00 00 00",
  address: "Casablanca, Maroc",
  specialty: "Droit civil et commercial",
  darkMode: false,
  primaryColor: "gold",
  language: "fr",
  twoFactor: false,
  hearingAlerts: true,
  documentAlerts: true,
  taskAlerts: true,
};

export function loadAppSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultAppSettings, ...JSON.parse(raw) } : defaultAppSettings;
  } catch {
    return defaultAppSettings;
  }
}

export function saveAppSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyAppSettings(settings) {
  const body = document.body;
  body.classList.toggle("dark-mode", Boolean(settings.darkMode));
  body.classList.remove("theme-gold", "theme-green", "theme-ink");
  body.classList.add(`theme-${settings.primaryColor || "gold"}`);
}
