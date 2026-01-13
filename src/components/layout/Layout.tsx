import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-6 pb-24 md:py-10">
        {children}
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
