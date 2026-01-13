import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    Notification,
} from '@/services/notificationService';
import {
    Bell,
    CheckCheck,
    Loader2,
    Sparkles,
    FileText,
    Shield,
    Clock,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

const notificationIcons: Record<string, typeof Bell> = {
    match: Sparkles,
    status: FileText,
    system: Bell,
    admin: Shield,
};

const notificationColors: Record<string, string> = {
    match: 'bg-success/10 text-success',
    status: 'bg-primary/10 text-primary',
    system: 'bg-muted text-muted-foreground',
    admin: 'bg-destructive/10 text-destructive',
};

export default function Notifications() {
    const { user, canModerate } = useAuth();
    const navigate = useNavigate();
    const { t, resolvedLanguage } = useLanguage();
    const queryClient = useQueryClient();

    const { data: notificationsData, isLoading, isError } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => user ? getUserNotifications(user.id) : Promise.resolve([]),
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });

    const notifications = notificationsData || [];

    // الضغط على إشعار - يوجه للصفحة المناسبة
    const handleNotificationClick = async (notification: Notification) => {
        // تحديث كمقروء
        if (!notification.is_read) {
            markNotificationAsRead(notification.id); // Fire and forget logic for speed

            // تحديث الكاش فوراً (Optimistic Update)
            queryClient.setQueryData(['notifications', user?.id], (old: Notification[] | undefined) => {
                return (old || []).map(n => n.id === notification.id ? { ...n, is_read: true } : n);
            });
        }

        // التوجيه حسب نوع الإشعار ... (rest remains same)
        if (notification.related_match_id && canModerate) {
            const basePath = user?.role === 'admin' ? 'admin' : 'moderator';
            navigate(`/${basePath}/matches?id=${notification.related_match_id}`);
        } else if (notification.related_report_id) {
            navigate(`/reports/${notification.related_report_id}`);
        } else if (notification.type === 'match') {
            navigate('/my-reports?status=matched');
        } else {
            navigate('/reports');
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        markAllNotificationsAsRead(user.id);

        // Optimistic Update
        queryClient.setQueryData(['notifications', user?.id], (old: Notification[] | undefined) => {
            return (old || []).map(n => ({ ...n, is_read: true }));
        });
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // ... (inside component)

    // ... (inside component)

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="border-0 shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-3 w-24 mt-2" />
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-primary/5">
                        {resolvedLanguage === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Bell className="h-8 w-8 text-primary" />
                            {t('notifications')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {unreadCount > 0
                                ? (t('unread_notifications_count') as string).replace('{count}', unreadCount.toString())
                                : t('all_read_notifications')}
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead} className="flex items-center gap-2">
                        <CheckCheck className="h-4 w-4" />
                        {t('mark_all_as_read')}
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <Card className="border-0 shadow-xl">
                    <CardContent className="p-12 text-center">
                        <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{t('no_notifications')}</h3>
                        <p className="text-muted-foreground">{t('no_notifications_desc')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const Icon = notificationIcons[notification.type] || Bell;
                        const colorClass = notificationColors[notification.type] || notificationColors.system;

                        return (
                            <Card
                                key={notification.id}
                                className={cn(
                                    "border-0 shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.01]",
                                    !notification.is_read && (resolvedLanguage === 'ar' ? "bg-primary/5 border-r-4 border-r-primary" : "bg-primary/5 border-l-4 border-l-primary")
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                            colorClass
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={cn(
                                                    "font-semibold",
                                                    !notification.is_read && "text-primary"
                                                )}>
                                                    {t(notification.title as TranslationKey)}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {!notification.is_read && (
                                                        <Badge variant="default" className="text-xs">{t('notif_new_badge')}</Badge>
                                                    )}
                                                    {resolvedLanguage === 'ar' ? <ArrowLeft className="h-4 w-4 text-muted-foreground" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-2">
                                                {(() => {
                                                    try {
                                                        const data = JSON.parse(notification.message);
                                                        if (data && data.key) {
                                                            // ترجمة المعاملات إذا كانت مفاتيح (مثل الحالة)
                                                            const translatedParams = { ...data.params };
                                                            if (translatedParams.status) {
                                                                translatedParams.status = t(translatedParams.status as TranslationKey);
                                                            }
                                                            return t(data.key as TranslationKey, translatedParams);
                                                        }
                                                        return notification.message;
                                                    } catch (e) {
                                                        return t(notification.message as TranslationKey);
                                                    }
                                                })()}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {new Date(notification.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
}
