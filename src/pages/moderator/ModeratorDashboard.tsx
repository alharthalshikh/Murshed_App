import { useEffect, useState } from 'react';
import { ModeratorLayout } from '@/components/moderator/ModeratorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, GitCompare, CheckCircle, Clock } from 'lucide-react';
import { getSystemStats } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export default function ModeratorDashboard() {
    const { t, resolvedLanguage } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        const data = await getSystemStats();
        setStats(data);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <ModeratorLayout>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                </div>
            </ModeratorLayout>
        );
    }

    return (
        <ModeratorLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('moderator_dashboard_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('moderator_dashboard_subtitle')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('lost_reports')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">
                                        {stats?.totalLostReports.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                    <FileText className="h-7 w-7 text-red-600" />
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
                                    <FileText className="h-7 w-7 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('successful_matches')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">
                                        {stats?.successfulMatches.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-7 w-7 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('match_rate_label')}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">
                                        {stats?.matchRate?.toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US') || 0}%
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                                    <GitCompare className="h-7 w-7 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {t('moderator_permissions_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-muted-foreground">
                            <p>✅ {t('moderator_perm_edit_delete')}</p>
                            <p>✅ {t('moderator_perm_manage_matches')}</p>
                            <p>✅ {t('moderator_perm_stats')}</p>
                            <p className="text-sm text-muted-foreground/60 mt-4">
                                💡 {t('moderator_perm_hint')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ModeratorLayout>
    );
}
