import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Sparkles, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSystemStats } from '@/lib/db';
import { GoogleBackground } from '@/components/ui/GoogleBackground';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const { t, resolvedLanguage } = useLanguage();
  const [stats, setStats] = useState({ successfulMatches: 0, matchRate: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const data = await getSystemStats();
      setStats({
        successfulMatches: data.successfulMatches,
        matchRate: data.matchRate
      });
    };
    loadStats();
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-12 lg:p-16 mb-10 border border-primary/5 shadow-inner">
      <GoogleBackground count={800} className="opacity-50" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="h-4 w-4" />
          {t('ai_powered')}
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-slide-up">
          {t('hero_title')}
          <span className="text-gradient block mt-2">{t('hero_subtitle')}</span>
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {t('hero_description')}
        </p>

        <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/new-report">
            <Button variant="hero" size="xl">
              <Search className="h-5 w-5" />
              {t('start_reporting_lost')}
            </Button>
          </Link>
          <Link to="/new-report?type=found">
            <Button variant="hero-outline" size="xl">
              <MapPin className="h-5 w-5" />
              {t('start_reporting_found')}
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>
              {stats.successfulMatches > 0 ? `+${stats.successfulMatches.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}` : '0'}{' '}
              {t('successful_report_count')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>
              {t('match_rate')} {stats.matchRate.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}%
            </span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="hidden lg:block absolute top-20 left-20 animate-float">
        <div className="w-16 h-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center">
          <Search className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>
      <div className="hidden lg:block absolute bottom-20 left-40 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-12 h-12 rounded-xl bg-secondary shadow-lg flex items-center justify-center">
          <MapPin className="h-6 w-6 text-secondary-foreground" />
        </div>
      </div>
    </section>
  );
}
