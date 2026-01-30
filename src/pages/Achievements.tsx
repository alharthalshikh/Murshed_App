import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ModeratorLayout } from '@/components/moderator/ModeratorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, Search, Loader2, RotateCcw } from 'lucide-react';
import { getReports, Report } from '@/services/reportService';
import { undoDeliveryByReportId } from '@/services/matchingService';
import { categoryLabels } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Achievements() {
    const { user, isModerator, canModerate } = useAuth();
    const { t, resolvedLanguage } = useLanguage();
    const queryClient = useQueryClient();
    const [isActionLoading, setIsActionLoading] = useState(false);

    const { data: deliveredReportsData, isLoading: queryLoading } = useQuery({
        queryKey: ['achievements', 'delivered'],
        queryFn: () => getReports({ status: 'delivered' }),
        staleTime: 1000 * 60 * 10,
    });

    const deliveredReports = deliveredReportsData || [];
    const isLoading = queryLoading || isActionLoading;

    const handleUndoDelivery = async (reportId: string) => {
        if (!confirm(t('confirm_cancel_delivery_desc') as string)) return;

        try {
            setIsActionLoading(true);
            const success = await undoDeliveryByReportId(reportId);
            if (success) {
                toast.success(t('delivery_cancelled_success'));
                // Invalidate to refetch all related lists
                await queryClient.invalidateQueries({ queryKey: ['achievements'] });
                await queryClient.invalidateQueries({ queryKey: ['reports'] });
                await queryClient.invalidateQueries({ queryKey: ['admin'] }); // Covers admin reports and matches
            } else {
                toast.error(t('err_undo_delivery'));
            }
        } catch (error) {
            console.error('Error undoing delivery:', error);
            toast.error(t('err_unexpected'));
        } finally {
            setIsActionLoading(false);
        }
    };


    // Always use simple wrapper since MainLayout handles the shell
    return (
        <div className="container mx-auto py-8 pb-24 md:pb-8">
            {/* Header Area */}
            <div className="text-center mb-10 space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-400/20 text-yellow-500 shadow-xl shadow-yellow-500/10 mb-2 border border-yellow-200/50">
                    <Trophy className="h-10 w-10" />
                </div>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{t('achievements_title')}</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    {t('achievements_subtitle')}
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden border-0 shadow-lg rounded-2xl">
                            <CardContent className="p-0">
                                <Skeleton className="aspect-[16/10] w-full" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-24 rounded-lg" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

            ) : deliveredReports.length === 0 ? (
                <Card className="border-0 shadow-xl bg-muted/30">
                    <CardContent className="p-16 text-center">
                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{t('no_achievements')}</h3>
                        <p className="text-muted-foreground">{t('no_achievements_desc')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {deliveredReports.map((report) => (
                        <Card key={report.id} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl bg-success/5 border border-success/10 flex flex-col">
                            <CardContent className="p-0 flex-1">
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    {report.images && report.images.length > 0 ? (
                                        <img
                                            src={report.images[0]}
                                            alt={report.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Trophy className="h-12 w-12 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-success/80 to-transparent flex items-end p-4">
                                        <div className="flex items-center gap-2 text-white">
                                            <CheckCircle className="h-5 w-5 fill-white text-success" />
                                            <span className="font-bold">{t('delivered_successfully')}</span>
                                        </div>
                                    </div>
                                    <Badge className={cn("absolute top-3 bg-white/90 text-success hover:bg-white backdrop-blur-sm border-0 font-bold", resolvedLanguage === 'ar' ? "right-3" : "left-3")}>
                                        {report.type === 'lost' ? t('recovered') : t('handed_over')}
                                    </Badge>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{report.title}</h3>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>{t(`cat_${report.category}` as TranslationKey) || report.category}</span>
                                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-lg">
                                            {new Date(report.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            {canModerate && (
                                <div className="p-4 pt-0 mt-auto border-t border-success/10">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-2"
                                                onClick={() => handleUndoDelivery(report.id)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                {t('undo_delivery')}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('undo_delivery_hint')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
