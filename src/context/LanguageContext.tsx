import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, type TranslationKey } from '@/i18n/translations';
export type { TranslationKey };

type Language = 'ar' | 'en' | 'system';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    resolvedLanguage: 'ar' | 'en';
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'system';
    });
    const [resolvedLanguage, setResolvedLanguage] = useState<'ar' | 'en'>('ar');

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text = translations[resolvedLanguage][key as keyof typeof translations['ar']] || key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v.toString());
            });
        }

        return text;
    };

    useEffect(() => {
        let activeLang: 'ar' | 'en' = 'ar';

        if (language === 'system') {
            const sysLang = navigator.language.split('-')[0];
            activeLang = sysLang === 'en' ? 'en' : 'ar';
        } else {
            activeLang = language as 'ar' | 'en';
        }

        setResolvedLanguage(activeLang);

        // Update HTML attributes for RTL/LTR
        const html = document.documentElement;
        html.lang = activeLang;
        html.dir = activeLang === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, resolvedLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
