import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getAllNotifications,
    deleteNotification,
    Notification,
} from '@/services/notificationService';
import {
    Bell,
    Search,
    Loader2,
    Trash2,
    Sparkles,
    FileText,
    Shield,
    Clock,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';

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

export default function AdminNotifications() {
    const { t, resolvedLanguage } = useLanguage();
    const isRtl = resolvedLanguage === 'ar';
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const typeLabels: Record<string, string> = {
        match: t('notif_type_match'),
        status: t('notif_type_status'),
        system: t('notif_type_system'),
        admin: t('notif_type_admin'),
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await getAllNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
            toast.error(t('error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const success = await deleteNotification(id);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success(t('delete_notif_success'));
        } else {
            toast.error(t('delete_notif_err'));
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch =
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || n.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Stats
    const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        match: notifications.filter(n => n.type === 'match').length,
        status: notifications.filter(n => n.type === 'status').length,
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Bell className="h-8 w-8 text-primary" />
                    {t('notif_mgmt_title')}
                </h1>
                <p className="text-muted-foreground mt-1">{t('notif_mgmt_subtitle')}</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bell className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">{t('notif_stat_total')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <Bell className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.unread}</p>
                            <p className="text-sm text-muted-foreground">{t('notif_stat_unread')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.match}</p>
                            <p className="text-sm text-muted-foreground">{t('notif_stat_match')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.status}</p>
                            <p className="text-sm text-muted-foreground">{t('notif_stat_status')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t('search_notif_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={cn(isRtl ? "pr-10" : "pl-10")}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir={isRtl ? "rtl" : "ltr"}>
                                <SelectItem value="all">{t('all')}</SelectItem>
                                <SelectItem value="match">{t('notif_type_match')}</SelectItem>
                                <SelectItem value="status">{t('notif_type_status')}</SelectItem>
                                <SelectItem value="system">{t('notif_type_system')}</SelectItem>
                                <SelectItem value="admin">{t('notif_type_admin')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="divide-y">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="h-12 w-12 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                            <Skeleton className="h-4 w-3/4" />
                                            <div className="flex items-center gap-4 mt-2">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-20">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t('no_notifications')}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification) => {
                                const Icon = notificationIcons[notification.type] || Bell;
                                const colorClass = notificationColors[notification.type] || notificationColors.system;

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-muted/30 transition-colors",
                                            !notification.is_read && "bg-primary/5"
                                        )}
                                    >
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
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{t(notification.title as TranslationKey)}</h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {typeLabels[notification.type] || notification.type}
                                                    </Badge>
                                                    {!notification.is_read && (
                                                        <Badge variant="default" className="text-xs">{t('new_badge')}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-sm line-clamp-2">
                                                    {(() => {
                                                        try {
                                                            const data = JSON.parse(notification.message);
                                                            if (data && data.key) {
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
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(notification.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                    {notification.user_name && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {notification.user_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(notification.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
