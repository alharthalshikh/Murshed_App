import { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

export function MainLayout() {
    const location = useLocation();
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 w-full pb-20 md:pb-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className="border-t py-8 mt-auto hidden md:block">
                <div className="container text-center text-sm text-muted-foreground">
                    <p>{(t('copyright_year' as TranslationKey) as string).replace('{year}', currentYear.toString())}. {t('all_rights_reserved' as TranslationKey)}</p>
                    <p className="mt-1">{t('ai_powered' as TranslationKey)}</p>
                </div>
            </footer>

            <BottomNavigation />
        </div>
    );
}
