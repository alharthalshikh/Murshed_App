import { useQuery } from '@tanstack/react-query';
import { getReports, Report } from '@/services/reportService';
import { useLanguage, TranslationKey } from '@/context/LanguageContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Calendar,
    MapPin,
    FileSearch,
    AlertCircle,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UserReportsDialogProps {
    userId: string | null;
    userName: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onViewDetails?: (report: Report) => void;
}

export function UserReportsDialog({ userId, userName, open, onOpenChange, onViewDetails }: UserReportsDialogProps) {
    const { t, resolvedLanguage } = useLanguage();

    const { data: reports, isLoading } = useQuery({
        queryKey: ['admin', 'user-reports', userId],
        queryFn: () => getReports({ userId: userId! }),
        enabled: !!userId && open,
    });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'destructive' | 'success' | 'warning' | 'secondary', label: string }> = {
            pending: { variant: 'warning', label: t('stat_pending') },
            processing: { variant: 'secondary', label: t('stat_processing') },
            matched: { variant: 'success', label: t('stat_matched') },
            contacted: { variant: 'default', label: t('stat_contacted') },
            delivered: { variant: 'success', label: t('stat_delivered') },
            closed: { variant: 'destructive', label: t('stat_closed') },
        };
        const { variant, label } = variants[status] || { variant: 'default', label: status };
        return <Badge variant={variant}>{label}</Badge>;
    };

    const getCategoryLabel = (category: string) => {
        const key = `cat_${category}` as TranslationKey;
        return t(key) || category;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {t('user_reports_history_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('user_reports_history_desc').replace('{name}', userName || '')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden border-0 shadow-sm bg-muted/30">
                                <CardContent className="p-0">
                                    <div className="flex h-24">
                                        <Skeleton className="w-24 h-full rounded-none" />
                                        <div className="flex-1 p-3 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : reports?.length === 0 ? (
                        <div className="text-center py-10">
                            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">{t('no_reports')}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {reports?.map((report) => (
                                <Card key={report.id} className="overflow-hidden border border-border/50 hover:border-primary/30 transition-colors">
                                    <CardContent className="p-0">
                                        <div className="flex h-24 md:h-28">
                                            {/* Image */}
                                            <div className="w-24 md:w-32 bg-muted relative shrink-0">
                                                {report.images?.[0] ? (
                                                    <img
                                                        src={report.images[0]}
                                                        alt={report.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FileSearch className="h-8 w-8 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <div className={cn("absolute top-1.5", resolvedLanguage === 'ar' ? "right-1.5" : "left-1.5")}>
                                                    <Badge variant={report.type === 'lost' ? 'destructive' : 'success'} className="text-[10px] h-4 px-1">
                                                        {report.type === 'lost' ? t('lost_reports') : t('found_reports')}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-sm md:text-base truncate">{report.title}</h4>
                                                    <div className="shrink-0 scale-75 md:scale-90 origin-top-right">
                                                        {getStatusBadge(report.status)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(report.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {report.location_city}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-muted-foreground/20">
                                                        {getCategoryLabel(report.category)}
                                                    </Badge>
                                                </div>

                                                <div className="flex justify-end mt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors"
                                                        onClick={() => onViewDetails?.(report)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        {t('view_details_btn')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
