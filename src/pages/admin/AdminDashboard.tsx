import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSystemStats } from '@/lib/db';
import { getReports, Report } from '@/services/reportService';
import {
    FileSearch,
    MapPin,
    CheckCircle,
    Users,
    TrendingUp,
    ArrowLeft,
    Clock,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { runFullSystemMatching } from '@/services/matchingService';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

interface Stats {
    totalLostReports: number;
    totalFoundReports: number;
    successfulMatches: number;
    totalUsers: number;
    matchRate: number;
}

export default function AdminDashboard() {
    const { t, resolvedLanguage } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);

    // Stats Query
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: getSystemStats,
    });

    // Recent Reports Query
    const { data: recentReportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
        queryKey: ['admin', 'recent_reports'],
        queryFn: () => getReports({ limit: 5 }),
    });

    const recentReports = recentReportsData || [];
    const isLoading = statsLoading || reportsLoading;

    const handleFullScan = async () => {
        setIsScanning(true);
        toast.info(t('scan_starting_info'));

        try {
            const result = await runFullSystemMatching();
            if (result.matches > 0) {
                toast.success((t('success_scan_found') as string)
                    .replace('{count}', result.matches.toString())
                    .replace('{total}', result.processed.toString()));
                // Update data
                refetchStats();
                refetchReports();
            } else {
                toast.info((t('info_scan_no_new') as string)
                    .replace('{total}', result.processed.toString()));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('err_scan_failed'));
        } finally {
            setIsScanning(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'warning'> = {
            pending: 'warning',
            processing: 'secondary',
            matched: 'default', // Using default since 'success' variant might not exist on Badge or requires custom CSS
            contacted: 'default',
            delivered: 'default',
            closed: 'destructive',
        };
        const label = t(`stat_${status}` as TranslationKey) || status;
        const variant = variants[status] || 'default';
        return <Badge variant={variant}>{label}</Badge>;
    };

    if (isLoading) {
        return (
            <AdminLayout>
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                    <Skeleton className="h-14 w-14 rounded-2xl" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Match Rate Card Skeleton */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-20 w-20 rounded-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Reports Skeleton */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-9 w-24" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-9 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('admin_dashboard_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('admin_dashboard_subtitle')}</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleFullScan}
                    disabled={isScanning}
                    className="gap-2 border-primary/20 hover:bg-primary/5"
                >
                    {isScanning ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                        <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    {isScanning ? t('scanning_status') : t('full_scan_btn')}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('lost_reports')}</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.totalLostReports.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                <FileSearch className="h-7 w-7 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('found_reports')}</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.totalFoundReports.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                                <MapPin className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('successful_matches')}</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.successfulMatches.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                <CheckCircle className="h-7 w-7 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('total_users')}</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {stats?.totalUsers.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                <Users className="h-7 w-7 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Match Rate Card */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t('match_rate_label')}</p>
                            <p className="text-4xl font-bold text-primary mt-2">
                                {stats?.matchRate.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t('from_total_lost')}
                            </p>
                        </div>
                        <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center">
                            <TrendingUp className="h-10 w-10 text-primary-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {t('recent_reports_title')}
                    </CardTitle>
                    <Link to="/admin/reports">
                        <Button variant="ghost" size="sm" className="gap-2">
                            {t('view_all_btn')}
                            <ArrowLeft className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "" : "rotate-180")} />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentReports.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>{t('no_reports_yet')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${report.type === 'lost' ? 'bg-red-500/20' : 'bg-green-500/20'
                                            }`}>
                                            {report.type === 'lost' ? (
                                                <FileSearch className="h-6 w-6 text-red-600" />
                                            ) : (
                                                <MapPin className="h-6 w-6 text-green-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{report.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {report.user_name || t('unknown_user')} • {new Date(report.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(report.status)}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Link to={`/reports/${report.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        {t('view_details_btn')}
                                                    </Button>
                                                </Link>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('view_report_details_tooltip')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
