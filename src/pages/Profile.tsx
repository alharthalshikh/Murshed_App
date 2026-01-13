import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Camera,
    MapPin,
    FileText,
    Share2,
    Bell,
    LogOut,
    ChevronLeft,
    User as UserIcon,
    Loader2,
    ArrowRight,
    Sun,
    Moon,
    Monitor,
    Clock,
    Languages,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ImageCropper from '@/components/profile/ImageCropper';
import { updateUserAvatar } from '@/services/authService';
import { uploadImage } from '@/services/imageService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

// ... (previous imports)

export default function Profile() {
    const { user, refreshUser, logout, isLoading: authLoading } = useAuth();
    const { theme, setTheme, schedule, setSchedule } = useTheme();
    const { language, setLanguage, resolvedLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedImageBlob: Blob) => {
        if (!user) return;

        setIsUploading(true);
        try {
            // Convert Blob to File
            const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });

            // 1. Upload to ImgBB
            const uploadResult = await uploadImage(file);

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || t('err_upload_avatar_failed'));
            }

            const imageUrl = uploadResult.url;

            // 2. Update User Profile in DB
            await updateUserAvatar(user.id, imageUrl);

            // 3. Refresh user context
            await refreshUser();

            toast.success(t('success_avatar_updated'));
        } catch (error) {
            console.error(error);
            toast.error(t('err_update_avatar_error'));
        } finally {
            setIsUploading(false);
            setSelectedImage(null);
        }
    };

    const handleShareApp = async () => {
        const shareUrl = window.location.origin;
        const shareData = {
            title: t('share_app_title'),
            text: t('share_app_text'),
            url: shareUrl,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success(t('success_share_thanks'));
            } else {
                throw new Error('Share not supported');
            }
        } catch (err) {
            // تجاهل خطأ الإلغاء من قبل المستخدم
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }

            // البديل: نسخ الرابط للمتصفحات التي لا تدعم المشاركة المباشرة أو عند حدوث خطأ
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success(t('success_link_copied'));
            } catch (clipboardErr) {
                toast.error(t('err_link_copy_failed'));
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // ... (in component)

    // ... (in component)

    // Ensure we handle loading state
    const isLoading = false; // Note: useAuth provides isLoading, need to destructure it. 
    // Wait, I cannot change the destructuring line in this block easily without context.
    // I will check if useAuth is destructured above.
    // The previous view_file showed: const { user, refreshUser, logout } = useAuth();
    // I need to update that line first or check if I can just add it.

    // Changing the logic:
    // 1. Update destructuring to get isLoading
    // 2. Add the skeleton return.

    // Let's do the Skeleton return first, assuming I'll fix the destructuring in a separate edit or if I find it's already there (it wasn't).

    if (!user) {
        // Fallback skeleton if user is loading (usually implied by !user in some auth flows, but explicit isLoading is better)
        // Since I can't see the destructuring line in this replace block, I will assume !user acts as loading for now or I will simply replace the whole component start.

        // Actually, to do this rights, I should Replace the component start to get isLoading.
        return (
            <div className="min-h-screen bg-background pb-20">
                <div className="relative h-64 bg-muted animate-pulse rounded-b-[3rem] overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                        <Skeleton className="w-32 h-32 rounded-full border-4 border-background mb-3" />
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                <div className="p-4 space-y-4 -mt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl" />

                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="relative h-64 bg-primary/10 rounded-b-[3rem] overflow-hidden">
                <div className="absolute top-4 right-4 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="bg-background/20 hover:bg-background/40 text-foreground backdrop-blur-sm rounded-full"
                    >
                        {resolvedLanguage === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-primary/25 to-transparent shadow-inner" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                    {/* NEW DESIGN v2.0 - 2026-01-09 */}
                    <div className="relative inline-block mb-3 group" key="avatar-container-v2">
                        {/* الصورة الرئيسية - حجم كبير 160px */}
                        <div
                            className="w-40 h-40 rounded-full border-[6px] border-background shadow-2xl overflow-hidden bg-background relative cursor-pointer transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            {isUploading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-2" />
                                        <p className="text-white text-xs font-medium">{t('uploading_badge')}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`}
                                        alt={user.name}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`;
                                        }}
                                    />
                                    {/* Overlay عند الـ hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* أيقونة التعديل في الزاوية */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className={cn("absolute bottom-2 w-14 h-14 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-10 border-4 border-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed", resolvedLanguage === 'ar' ? "right-2" : "left-2")}
                            title={t('change_avatar_title')}
                        >
                            <Camera className="w-6 h-6" />
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 justify-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {t('profile_welcome')}
                    </p>
                </div>
            </div>

            <div className="p-4 space-y-4 -mt-2">
                {/* Reports Section */}
                <div className="grid grid-cols-2 gap-3">
                    <Card
                        className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                        onClick={() => navigate('/my-reports?type=lost')}
                    >
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{t('my_lost_reports')}</span>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                        onClick={() => navigate('/my-reports?type=found')}
                    >
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{t('my_found_reports')}</span>
                        </CardContent>
                    </Card>
                </div>

                <Card
                    className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                    onClick={() => navigate('/my-reports')}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{t('my_reports')}</span>
                        </div>
                        <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", resolvedLanguage === 'en' && "rotate-180")} />
                    </CardContent>
                </Card>

                {/* Theme & Language Section */}
                <h3 className="text-sm font-medium text-muted-foreground px-1 pt-4">
                    {t('appearance_language')}
                </h3>

                <Card className="border-0 shadow-sm bg-card/50 overflow-hidden">
                    <CardContent className="p-0 divide-y divide-border/50">
                        {/* Language Setting */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{t('language')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'system', label: t('system'), icon: Monitor },
                                    { id: 'ar', label: 'العربية', icon: Languages },
                                    { id: 'en', label: 'English', icon: Globe },
                                ].map((lang) => (
                                    <Button
                                        key={lang.id}
                                        variant={language === lang.id ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-10 text-xs gap-1"
                                        onClick={() => setLanguage(lang.id as any)}
                                    >
                                        <lang.icon className="w-3.5 h-3.5" />
                                        {lang.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Setting */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                    <Sun className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{t('appearance')}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'light', label: t('light'), icon: Sun },
                                    { id: 'dark', label: t('dark'), icon: Moon },
                                    { id: 'system', label: t('system'), icon: Monitor },
                                    { id: 'scheduled', label: t('scheduled'), icon: Clock },
                                ].map((t_item) => (
                                    <Button
                                        key={t_item.id}
                                        variant={theme === t_item.id ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-10 text-xs gap-1"
                                        onClick={() => setTheme(t_item.id as any)}
                                    >
                                        <t_item.icon className="w-3.5 h-3.5" />
                                        {t_item.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Schedule Toggles */}
                            {theme === 'scheduled' && (
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {t('auto_dark_mode')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="start-time" className="text-[10px] uppercase tracking-wider">
                                                {t('from_time')}
                                            </Label>
                                            <Input
                                                id="start-time"
                                                type="time"
                                                value={schedule.start}
                                                onChange={(e) => setSchedule({ ...schedule, start: e.target.value })}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="end-time" className="text-[10px] uppercase tracking-wider">
                                                {t('to_time')}
                                            </Label>
                                            <Input
                                                id="end-time"
                                                type="time"
                                                value={schedule.end}
                                                onChange={(e) => setSchedule({ ...schedule, end: e.target.value })}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions Section */}
                <h3 className="text-sm font-medium text-muted-foreground px-1 pt-2">
                    {t('settings_sharing')}
                </h3>

                <div className="space-y-2">
                    <Card
                        className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                        onClick={handleShareApp}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{t('share_app')}</span>
                            </div>
                            <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", resolvedLanguage === 'en' && "rotate-180")} />
                        </CardContent>
                    </Card>

                    <Card
                        className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                        onClick={() => navigate('/notifications')}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{t('notifications')}</span>
                            </div>
                            <ChevronLeft className={cn("w-5 h-5 text-muted-foreground", resolvedLanguage === 'en' && "rotate-180")} />
                        </CardContent>
                    </Card>

                    <Card
                        className="border-0 shadow-sm bg-card/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group"
                        onClick={handleLogout}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 group-hover:bg-red-200 dark:group-hover:bg-red-900/40 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-red-600">{t('logout')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ImageCropper
                open={cropperOpen}
                onClose={() => setCropperOpen(false)}
                imageSrc={selectedImage}
                onCropComplete={handleCropComplete}
            />

            {/* Avatar Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[90vw] md:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">{t('profile_avatar_preview')}</DialogTitle>
                    <div className="relative aspect-square w-full">
                        <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-2xl shadow-2xl"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
