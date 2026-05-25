import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLanguage, languages, translations } from "./translations";

const I18nContext = createContext(null);

function readSavedLanguage() {
  const saved = localStorage.getItem("app_language");
  return languages.some(language => language.code === saved) ? saved : defaultLanguage;
}

function getNestedValue(source, key) {
  return key.split(".").reduce((value, part) => value?.[part], source);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readSavedLanguage);
  const currentLanguage = languages.find(item => item.code === language) || languages[0];

  useEffect(() => {
    localStorage.setItem("app_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = currentLanguage.dir;
    document.body.classList.toggle("rtl", currentLanguage.dir === "rtl");
  }, [language, currentLanguage.dir]);

  const value = useMemo(() => {
    const t = (key, fallback) => (
      getNestedValue(translations[language], key)
      ?? getNestedValue(translations[defaultLanguage], key)
      ?? fallback
      ?? key
    );

    return {
      language,
      languages,
      dir: currentLanguage.dir,
      isRtl: currentLanguage.dir === "rtl",
      setLanguage: setLanguageState,
      t,
    };
  }, [language, currentLanguage.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
