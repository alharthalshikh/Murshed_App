import { AdminLayout } from '@/components/admin/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
    Settings,
    Bell,
    Shield,
    Database,
    Globe,
    Save,
    RefreshCw,
    Zap,
    Trash2,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { resetSystemData } from '@/services/systemService';
import { runFullSystemMatching } from '@/services/matchingService';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
    const { t, resolvedLanguage } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Simulate loading settings
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // General Settings
    const [siteName, setSiteName] = useState(t('app_name'));
    const [siteDescription, setSiteDescription] = useState('نظام المفقودات الذكي في اليمن');
    const [contactEmail, setContactEmail] = useState('alharth465117@gmail.com');
    const [contactPhone, setContactPhone] = useState('771035015');

    // Notification Settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [matchNotifications, setMatchNotifications] = useState(true);
    const [statusNotifications, setStatusNotifications] = useState(true);

    // AI Settings
    const [aiEnabled, setAiEnabled] = useState(true);
    const [imageMatchThreshold, setImageMatchThreshold] = useState('0.7');
    const [textMatchThreshold, setTextMatchThreshold] = useState('0.6');
    const [locationRadius, setLocationRadius] = useState('10');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // محاكاة حفظ الإعدادات
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success(t('save_settings_success'));
        } catch (error) {
            toast.error(t('save_settings_err'));
        } finally {
            setIsSaving(false);
        }
    };

    // System Reset
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleSystemReset = async () => {
        setIsResetting(true);
        try {
            const result = await resetSystemData();
            if (result.success) {
                toast.success(result.message);

                // تصفير البيانات المحلية (اللغة، السمة)
                localStorage.clear();

                // إعادة تحميل الصفحة لتطبيق الإعدادات الافتراضية
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(t('err_unexpected'));
        } finally {
            setIsResetting(false);
        }
    };

    const handleGlobalReMatch = async () => {
        setIsSaving(true);
        try {
            toast.info(t('rematch_started'));
            const result = await runFullSystemMatching();
            toast.success(t('rematch_success') + ` (${result.matches} new)`);
        } catch (error) {
            console.error('Global rematch error:', error);
            toast.error(t('match_generic_err'));
        } finally {
            setIsSaving(false);
        }
    };

    const isRtl = resolvedLanguage === 'ar';

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('settings_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('settings_subtitle')}</p>
                </div>
                {isLoading ? (
                    <Skeleton className="h-10 w-32" />
                ) : (
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <RefreshCw className={cn("h-4 w-4 animate-spin", isRtl ? "ml-2" : "mr-2")} />
                        ) : (
                            <Save className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                        )}
                        {t('save_settings_btn')}
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="flex gap-2 mb-6 overflow-x-auto">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-10 w-24 rounded-md" />
                        ))}
                    </div>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <>
                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                            <TabsTrigger value="general" className="gap-2">
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('tabs_general')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2">
                                <Bell className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('tabs_notifications')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="gap-2">
                                <Zap className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('tabs_ai')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="security" className="gap-2">
                                <Shield className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('tabs_security')}</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* General Settings */}
                        <TabsContent value="general" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        {t('general_settings_title')}
                                    </CardTitle>
                                    <CardDescription>{t('settings_subtitle')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="siteName">{t('site_name_label')}</Label>
                                            <Input
                                                id="siteName"
                                                value={siteName}
                                                onChange={(e) => setSiteName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contactEmail">{t('contact_email_label')}</Label>
                                            <Input
                                                id="contactEmail"
                                                type="email"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="siteDescription">{t('site_description_label')}</Label>
                                        <Textarea
                                            id="siteDescription"
                                            value={siteDescription}
                                            onChange={(e) => setSiteDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">{t('contact_phone_label')}</Label>
                                        <Input
                                            id="contactPhone"
                                            value={contactPhone}
                                            onChange={(e) => setContactPhone(e.target.value)}
                                            dir="ltr"
                                            className={cn(isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notification Settings */}
                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-primary" />
                                        {t('notif_settings_title')}
                                    </CardTitle>
                                    <CardDescription>{t('notif_settings_title')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('email_notif_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('email_notif_desc')}</p>
                                        </div>
                                        <Switch
                                            checked={emailNotifications}
                                            onCheckedChange={setEmailNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('sms_notif_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('sms_notif_desc')}</p>
                                        </div>
                                        <Switch
                                            checked={smsNotifications}
                                            onCheckedChange={setSmsNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('match_notif_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('match_notif_desc')}</p>
                                        </div>
                                        <Switch
                                            checked={matchNotifications}
                                            onCheckedChange={setMatchNotifications}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('status_notif_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('status_notif_desc')}</p>
                                        </div>
                                        <Switch
                                            checked={statusNotifications}
                                            onCheckedChange={setStatusNotifications}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* AI Settings */}
                        <TabsContent value="ai" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" />
                                        {t('ai_settings_title')}
                                    </CardTitle>
                                    <CardDescription>{t('ai_settings_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                                        <div>
                                            <p className="font-medium">{t('ai_enabled_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('ai_enabled_desc')}</p>
                                        </div>
                                        <Switch
                                            checked={aiEnabled}
                                            onCheckedChange={setAiEnabled}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="imageThreshold">{t('image_threshold_label')}</Label>
                                            <Select value={imageMatchThreshold} onValueChange={setImageMatchThreshold}>
                                                <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                                                    <SelectItem value="0.5">50% - {isRtl ? 'منخفضة' : 'Low'}</SelectItem>
                                                    <SelectItem value="0.6">60% - {isRtl ? 'متوسطة' : 'Medium'}</SelectItem>
                                                    <SelectItem value="0.7">70% - {isRtl ? 'عالية' : 'High'}</SelectItem>
                                                    <SelectItem value="0.8">80% - {isRtl ? 'عالية جداً' : 'Very High'}</SelectItem>
                                                    <SelectItem value="0.9">90% - {isRtl ? 'صارمة' : 'Strict'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="textThreshold">{t('text_threshold_label')}</Label>
                                            <Select value={textMatchThreshold} onValueChange={setTextMatchThreshold}>
                                                <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                                                    <SelectItem value="0.4">40% - {isRtl ? 'منخفضة' : 'Low'}</SelectItem>
                                                    <SelectItem value="0.5">50% - {isRtl ? 'متوسطة' : 'Medium'}</SelectItem>
                                                    <SelectItem value="0.6">60% - {isRtl ? 'عالية' : 'High'}</SelectItem>
                                                    <SelectItem value="0.7">70% - {isRtl ? 'عالية جداً' : 'Very High'}</SelectItem>
                                                    <SelectItem value="0.8">80% - {isRtl ? 'صارمة' : 'Strict'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="locationRadius">{t('location_radius_label')}</Label>
                                        <Select value={locationRadius} onValueChange={setLocationRadius}>
                                            <SelectTrigger dir={isRtl ? 'rtl' : 'ltr'}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                                                <SelectItem value="5">5 {isRtl ? 'كم' : 'km'}</SelectItem>
                                                <SelectItem value="10">10 {isRtl ? 'كم' : 'km'}</SelectItem>
                                                <SelectItem value="25">25 {isRtl ? 'كم' : 'km'}</SelectItem>
                                                <SelectItem value="50">50 {isRtl ? 'كم' : 'km'}</SelectItem>
                                                <SelectItem value="100">100 {isRtl ? 'كم' : 'km'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h3 className="font-medium mb-3 flex items-center gap-2">
                                            <RefreshCw className="h-4 w-4" />
                                            {t('global_rematch_btn')}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {t('ai_analysis_desc')}
                                        </p>
                                        <Button
                                            onClick={handleGlobalReMatch}
                                            disabled={isSaving}
                                            variant="secondary"
                                            className="w-full sm:w-auto"
                                        >
                                            <RefreshCw className={cn("h-4 w-4", isSaving && "animate-spin", isRtl ? "ml-2" : "mr-2")} />
                                            {t('global_rematch_btn')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Settings */}
                        <TabsContent value="security" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary" />
                                        {t('security_settings_title')}
                                    </CardTitle>
                                    <CardDescription>{t('security_settings_desc')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('two_factor_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('two_factor_desc')}</p>
                                        </div>
                                        <Switch />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('account_lock_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('account_lock_desc')}</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{t('activity_log_label')}</p>
                                            <p className="text-sm text-muted-foreground">{t('activity_log_desc')}</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="pt-4 border-t space-y-4">
                                        <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => toast.info(t('clear_cache_btn'))}>
                                            <Database className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                                            {t('clear_cache_btn')}
                                        </Button>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2 text-lg">
                                                <Trash2 className="h-5 w-5" />
                                                {t('danger_zone_title')}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-4">
                                                {t('danger_zone_desc')}
                                            </p>
                                            <Button
                                                variant="destructive"
                                                className="w-full bg-red-700 hover:bg-red-800"
                                                onClick={() => setIsResetDialogOpen(true)}
                                            >
                                                {t('reset_system_btn')}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Reset Confirmation Dialog */}
                    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600 text-xl">{t('reset_confirm_title')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-base text-foreground/80">
                                    {t('reset_confirm_desc')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>{t('reset_cancel_btn')}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleSystemReset}
                                    className="bg-red-700 text-white hover:bg-red-800"
                                    disabled={isResetting}
                                >
                                    {isResetting ? t('resetting_label') : t('reset_action_btn')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </AdminLayout >
    );
}
