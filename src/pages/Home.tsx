import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsCard } from '@/components/home/StatsCard';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FileSearch, MapPin, CheckCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSystemStats } from '@/lib/db';
import { useLanguage } from '@/context/LanguageContext';

interface Stats {
  totalLostReports: number;
  totalFoundReports: number;
  successfulMatches: number;
  matchRate: number;
}

const Index = () => {
  const { t, resolvedLanguage } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalLostReports: 0,
    totalFoundReports: 0,
    successfulMatches: 0,
    matchRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getSystemStats();
      setStats(data);
    } catch (error) {
      console.error(t('stats_loading_error'), error);
    }
  };

  return (
    <Layout>
      <HeroSection />

      {/* Stats Section */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatsCard
          title={t('lost_reports')}
          value={stats.totalLostReports.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
          icon={FileSearch}
          trend={{ value: 12, isPositive: true }}
          iconClassName="gradient-primary"
        />
        <StatsCard
          title={t('found_reports')}
          value={stats.totalFoundReports.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
          icon={MapPin}
          trend={{ value: 8, isPositive: true }}
          iconClassName="gradient-secondary"
        />
        <StatsCard
          title={t('successful_matches_card')}
          value={stats.successfulMatches.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
          iconClassName="bg-success"
        />
        <StatsCard
          title={t('match_rate_card')}
          value={`${stats.matchRate.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}%`}
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
          iconClassName="bg-warning"
        />
      </section>

      <HowItWorks />
    </Layout>
  );
};

export default Index;

