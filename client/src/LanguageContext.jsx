import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readLanguage, writeLanguage } from './lib/appearance.js';
import { translate } from './lib/locale.js';

const LanguageContext = createContext({ language: 'en', t: (message, ...values) => translate('en', message, ...values) });

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => readLanguage());
  useEffect(() => {
    document.documentElement.lang = language;
    writeLanguage(language);
  }, [language]);
  const value = useMemo(() => ({
    language, setLanguage, t: (message, ...values) => translate(language, message, ...values),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
