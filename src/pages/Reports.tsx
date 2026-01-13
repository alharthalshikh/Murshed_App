import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { ReportsList } from '@/components/reports/ReportsList';
import { getReports, Report } from '@/services/reportService';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const Reports = () => {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  const { data: reportsData, isLoading: queryLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'all'], // Cache key for 'all' reports
    queryFn: () => getReports({}), // Empty filters as per original code
    enabled: !authLoading, // Wait for auth check
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  const reports = reportsData || [];
  const isLoading = queryLoading;
  const error = isError ? t('err_loading_reports') : null;

  // Note: Previous manual filtering logic in loadReports was empty, 
  // so this direct mapping is equivalent but cached.

  // ... (inside the component)

  // ... (inside the component)

  // عرض التحميل أثناء تحميل المصادقة أو البلاغات
  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <Card className="shadow-md border-0 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="w-full md:w-[150px] h-10" />
              <Skeleton className="w-full md:w-[150px] h-10" />
            </div>
          </CardContent>
        </Card>

        {/* Results Count Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Reports Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden shadow-lg border-0">
              <CardContent className="p-0">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Skeleton className="flex-1 h-9 rounded-lg" />
                    <Skeleton className="flex-1 h-9 rounded-lg" />
                    <Skeleton className="flex-1 h-9 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('reports_title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('reports_subtitle')}
          </p>
        </div>
        <Link to="/new-report">
          <Button variant="hero" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('new_report_btn')}
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('error_occurred')}</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {t('retry_btn')}
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('no_reports')}</h3>
          <p className="text-muted-foreground mb-4">{t('no_reports_desc')}</p>
          <Link to="/new-report">
            <Button variant="hero">
              <Plus className="h-4 w-4" />
              {t('first_report_btn')}
            </Button>
          </Link>
        </div>
      ) : (
        <ReportsList reports={reports} />
      )}
    </Layout>
  );
};

export default Reports;
