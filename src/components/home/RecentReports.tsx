import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, ArrowLeft, Search, Eye } from 'lucide-react';
import { Report } from '@/types';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';

interface RecentReportsProps {
  reports: Report[];
}

export function RecentReports({ reports }: RecentReportsProps) {
  const { t, resolvedLanguage } = useLanguage();

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('recent_reports_title')}</h2>
          <p className="text-muted-foreground mt-1">{t('recent_reports_subtitle')}</p>
        </div>
        <Link to="/reports">
          <Button variant="ghost" className="gap-2">
            {t('view_all_btn')}
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.slice(0, 6).map((report, index) => (
          <Card
            key={report.id}
            variant="interactive"
            className="group animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative aspect-video overflow-hidden rounded-t-xl">
                <img
                  src={report.images[0]}
                  alt={report.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge variant={report.type === 'lost' ? 'destructive' : 'success'}>
                    {t(report.type === 'lost' ? 'stat_lost' : 'stat_found')}
                  </Badge>
                </div>
                <div className="absolute bottom-3 right-3 left-3">
                  <h3 className="text-primary-foreground font-bold text-lg truncate">{report.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[report.category]}
                  </Badge>
                  <Badge
                    variant={
                      report.status === 'matched'
                        ? 'matched'
                        : report.status === 'processing'
                          ? 'processing'
                          : report.status === 'pending'
                            ? 'pending'
                            : 'closed'
                    }
                    className="text-xs"
                  >
                    {statusLabels[report.status]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {report.location.city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(report.date).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
