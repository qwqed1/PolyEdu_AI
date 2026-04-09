import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations from '../i18n/translations';
import { repairMojibakeDeep } from '../utils/repairMojibake';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const normalizedTranslations = useMemo(() => repairMojibakeDeep(translations), []);

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language === 'kk' ? 'kk' : 'ru';
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'ru' ? 'kk' : 'ru');
  }, []);

  const t = normalizedTranslations[language] || normalizedTranslations.ru;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
