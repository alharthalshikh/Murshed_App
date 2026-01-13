import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Calendar,
  Search,
  Sparkles,
  FileSearch,
  Coins,
  HeartHandshake,
  MessageSquare,
  Phone,
  Share2,
} from 'lucide-react';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { Report, updateReportStatus } from '@/services/reportService';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { toast } from 'sonner';

interface ReportsListProps {
  reports: Report[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const navigate = useNavigate();
  const { user, canModerate } = useAuth();
  const { t, resolvedLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (canModerate && String(report.short_id).includes(searchQuery));

    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleShare = async (report: Report) => {
    const url = `${window.location.origin}/reports/${report.id}`;
    const text = `${t(report.type === 'lost' ? 'wa_share_lost' : 'wa_share_found')} ${report.title}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('wa_share_title'),
          text,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('link_copied'));
  };

  const openWhatsApp = (report: Report) => {
    const adminPhone = '771035015';
    const shortId = report.short_id || t('loading');

    let message = '';
    if (report.type === 'found') {
      message = (t('wa_message_found') as string).replace('{id}', String(shortId));
    } else {
      message = (t('wa_message_lost') as string).replace('{id}', String(shortId));
    }

    window.open(`https://wa.me/967${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const makeCall = () => {
    const adminPhone = '771035015';
    window.location.href = `tel:${adminPhone}`;
  };

  const handleMarkAsDelivered = async (e: React.MouseEvent, report: Report) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const success = await updateReportStatus(report.id, 'delivered');
      if (success) {
        toast.success(t('report_marked_delivered_success'));
        // navigate('/achievements'); // Removed navigation as per user request

        // Force refresh the list to remove the button
        await queryClient.invalidateQueries({ queryKey: ['reports'] });
        await queryClient.invalidateQueries({ queryKey: ['admin'] });
      } else {
        toast.error(t('error_occurred'));
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(t('error_occurred'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", resolvedLanguage === 'ar' ? "right-3" : "left-3")} />
              <Input
                placeholder={t('search_reports_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(resolvedLanguage === 'ar' ? "pr-10 text-right" : "pl-10 text-left")}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder={t('type_filter_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="lost">{t('stat_lost')}</SelectItem>
                <SelectItem value="found">{t('stat_found')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder={t('status_filter_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="pending">{t('stat_pending')}</SelectItem>
                <SelectItem value="processing">{t('stat_processing')}</SelectItem>
                <SelectItem value="matched">{t('stat_matched')}</SelectItem>
                <SelectItem value="delivered">{t('stat_delivered')}</SelectItem>
                <SelectItem value="closed">{t('stat_closed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('showing_reports')} {filteredReports.length} {t('of')} {reports.length} {t('reports_count')}
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report, index) => (
          <Card
            key={report.id}
            className="group animate-fade-in overflow-hidden shadow-lg border-0 hover:shadow-xl transition-all duration-300 cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/reports/${report.id}`)}
          >
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                {report.images && report.images.length > 0 ? (
                  <img
                    src={report.images[0]}
                    alt={report.title}
                    loading="lazy"
                    fetchPriority={index < 3 ? "high" : "low"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                    }}
                  />
                ) : null}

                <div className={cn(
                  "w-full h-full flex items-center justify-center placeholder-icon",
                  report.images && report.images.length > 0 ? "hidden" : ""
                )}>
                  <FileSearch className="h-16 w-16 text-muted-foreground/50" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent pointer-events-none" />
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <Badge variant={report.type === 'lost' ? 'destructive' : 'success'}>
                    {t(report.type === 'lost' ? 'stat_lost' : 'stat_found')}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {report.status === 'matched' && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success text-success-foreground text-xs shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {t('matched_badge')}
                    </div>
                  )}
                  {report.reward_amount && Number(report.reward_amount) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold shadow-sm animate-pulse">
                      <Coins className="h-3 w-3" />
                      {t('reward_badge')}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 left-3 z-10">
                  <h3 className="text-white font-bold text-lg truncate leading-tight drop-shadow-md">
                    {report.title}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {t(`cat_${report.category}` as TranslationKey) || report.category}
                  </Badge>
                  <Badge
                    variant={
                      report.status === 'matched' || report.status === 'delivered'
                        ? 'success'
                        : report.status === 'processing'
                          ? 'secondary'
                          : report.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                    }
                    className="text-xs"
                  >
                    {t(`stat_${report.status}` as TranslationKey) || report.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {report.location_city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {report.date_occurred
                      ? new Date(report.date_occurred).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')
                      : t('no_date')}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 border-primary/20 hover:bg-primary/5 text-xs h-9 rounded-lg"
                    onClick={() => handleShare(report)}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {t('share_btn')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 border-primary/20 hover:bg-primary/5 text-xs h-9 rounded-lg"
                    onClick={() => openWhatsApp(report)}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t('whatsapp_btn')}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1 bg-[#088395] hover:bg-[#077181] text-white text-xs h-9 border-0 rounded-lg"
                    onClick={makeCall}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {t('call_btn')}
                  </Button>
                </div>

                {/* Delivery Action - Only for Owner/Admin and only when status is 'matched' */}
                {(report.user_id === user?.id || canModerate) && report.status === 'matched' && (
                  <Button
                    className="w-full mt-2 gap-2 bg-success hover:bg-success/90 text-white border-0 shadow-lg shadow-success/20 rounded-xl transition-all active:scale-[0.98]"
                    onClick={(e) => handleMarkAsDelivered(e, report)}
                  >
                    <HeartHandshake className="h-4 w-4" />
                    <span className="font-bold">{t('mark_as_delivered_btn')}</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <Card className="p-12 text-center shadow-md border-0">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">{t('no_results')}</h3>
          <p className="text-muted-foreground">
            {t('no_results_desc')}
          </p>
        </Card>
      )}
    </div>
  );
}
