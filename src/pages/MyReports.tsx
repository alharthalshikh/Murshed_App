import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getReports, Report } from '@/services/reportService';
import { statusLabels } from '@/data/mockData';
import { toast } from 'sonner';
import {
    MessageSquare,
    Phone,
    Share2,
    Eye,
    ArrowRight,
    Search,
    Filter,
    Calendar,
    MapPin,
    Tag,
    FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

export default function MyReports() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, resolvedLanguage } = useLanguage();
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') || 'all';

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>(initialType);

    const { data: reports, isLoading, error } = useQuery({
        queryKey: ['my-reports', user?.id, filterType],
        queryFn: async () => {
            if (!user) return [];
            return await getReports({
                userId: user.id,
                type: filterType === 'all' ? undefined : (filterType as 'lost' | 'found'),
            });
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // البيانات تبقى "طازجة" لمدة دقيقتين
        gcTime: 1000 * 60 * 10, // تبقى في الذاكرة 10 دقائق
    });

    const filteredReports = reports?.filter(report =>
        report.title.toLowerCase().includes(search.toLowerCase()) ||
        report.description.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const label = t(`status_${status}` as TranslationKey) || status;
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">{label}</Badge>;
            case 'processing':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700">{label}</Badge>;
            case 'matched':
                return <Badge variant="secondary" className="bg-green-100 text-green-700">{label}</Badge>;
            case 'closed':
                return <Badge variant="outline">{label}</Badge>;
            default:
                return <Badge variant="outline">{label}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        return type === 'lost'
            ? <Badge variant="destructive">{t('lost' as TranslationKey)}</Badge>
            : <Badge variant="default" className="bg-green-600">{t('found' as TranslationKey)}</Badge>;
    };

    const handleShare = async (report: Report) => {
        const url = `${window.location.origin}/reports/${report.id}`;
        const key = report.type === 'lost' ? 'share_text_lost' : 'share_text_found';
        const text = (t(key as TranslationKey) as string)
            .replace('{title}', report.title);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('share_app_title') as string,
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
        toast.success(t('success_link_copied'));
    };

    const openWhatsApp = (report: Report) => {
        const adminPhone = '771035015';
        const shortId = report.short_id || 'مجهول';

        let message = '';
        const idStr = String(shortId);
        if (report.type === 'found') {
            message = (t('wa_message_found_mine' as TranslationKey) as string).replace('{id}', idStr);
        } else {
            message = (t('wa_message_lost_saw' as TranslationKey) as string).replace('{id}', idStr);
        }

        window.open(`https://wa.me/967${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const makeCall = () => {
        const adminPhone = '771035015';
        window.location.href = `tel:${adminPhone}`;
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        {resolvedLanguage === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowRight className="h-5 w-5 rotate-180" />}
                    </Button>
                    <h1 className="text-xl font-bold">
                        {filterType === 'lost' ? t('my_lost_reports' as TranslationKey) :
                            filterType === 'found' ? t('my_found_reports' as TranslationKey) : t('all_my_reports' as TranslationKey)}
                    </h1>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", resolvedLanguage === 'ar' ? "right-3" : "left-3")} />
                        <Input
                            placeholder={t('search_my_reports_placeholder' as TranslationKey)}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={cn(resolvedLanguage === 'ar' ? "pr-9 text-right" : "pl-9 text-left")}
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[110px]">
                            <Filter className="w-4 h-4 ml-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all' as TranslationKey)}</SelectItem>
                            <SelectItem value="lost">{t('lost' as TranslationKey)}</SelectItem>
                            <SelectItem value="found">{t('found' as TranslationKey)}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-0 shadow-sm">
                            <div className="flex h-32">
                                <Skeleton className="w-32 h-full rounded-none" />
                                <div className="flex-1 p-4 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : error ? (
                    <div className="text-center py-12 text-destructive">
                        <p>{t('err_loading_reports_list')}</p>
                    </div>
                ) : filteredReports?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>{t('no_reports_found')}</p>
                    </div>
                ) : (
                    filteredReports?.map((report) => (
                        <Card
                            key={report.id}
                            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
                            onClick={() => navigate(`/reports/${report.id}`)}
                        >
                            <div className="flex h-32">
                                {/* Image Overlaying logical consistent naming */}
                                <div className="w-32 bg-muted relative overflow-hidden">
                                    {report.images && report.images.length > 0 ? (
                                        <img
                                            src={report.images[0]}
                                            alt={report.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}

                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center placeholder-icon bg-gray-100",
                                        report.images && report.images.length > 0 ? "hidden" : ""
                                    )}>
                                        <FileSearch className="w-8 h-8 text-gray-400" />
                                    </div>

                                    <div className={cn("absolute top-2", resolvedLanguage === 'ar' ? "right-2" : "left-2")}>
                                        {getTypeBadge(report.type)}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h3 className="font-bold line-clamp-1 flex-1">{report.title}</h3>
                                            {getStatusBadge(report.status)}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    {report.date_occurred
                                                        ? format(new Date(report.date_occurred), 'dd MMM yyyy', { locale: resolvedLanguage === 'ar' ? ar : undefined })
                                                        : t('no_date')}
                                                </span>
                                            </div>
                                            {report.location_city && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{report.location_city}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 mt-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/5 rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShare(report);
                                            }}
                                        >
                                            <Share2 className="w-3 h-3" />
                                            {t('share_btn')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 px-2 text-[10px] gap-1 border-primary/20 hover:bg-primary/5 rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openWhatsApp(report);
                                            }}
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            {t('whatsapp_btn')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1 h-8 px-2 text-[10px] gap-1 bg-[#088395] hover:bg-[#077181] text-white border-0 rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                makeCall();
                                            }}
                                        >
                                            <Phone className="w-3 h-3" />
                                            {t('call_btn')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

