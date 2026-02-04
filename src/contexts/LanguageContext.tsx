/**
 * ClearPress AI - Language Context
 * Provides internationalization support throughout the app
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  translations,
  getTranslation,
  formatTranslation,
  type Language,
} from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, variables?: Record<string, string | number>) => string;
  translations: typeof translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({
  children,
  defaultLanguage = 'ja',
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clearpress-language');
      if (stored === 'ja' || stored === 'en') {
        return stored;
      }
    }
    return defaultLanguage;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clearpress-language', lang);
    }
  }, []);

  const t = useCallback(
    (path: string, variables?: Record<string, string | number>) => {
      const text = getTranslation(language, path);
      if (variables) {
        return formatTranslation(text, variables);
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
