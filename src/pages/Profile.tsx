import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
    Card, CardContent, CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
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
    Globe,
    Edit2,
    Save,
    X,
    Lock,
    Key,
    Phone
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
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { updateUserProfile, changePassword, updateUserCover } from '@/services/authService';

// ... (previous imports)

export default function Profile() {
    const { user, refreshUser, logout, isLoading: authLoading } = useAuth();
    const { theme, setTheme, schedule, setSchedule } = useTheme();
    const { language, setLanguage, resolvedLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Profile Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', phone: '' });

    // Password Change State
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    const handleEditToggle = () => {
        if (!isEditing && user) {
            setEditData({ name: user.name, phone: user.phone || '' });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsUploading(true);
        try {
            const updatedUser = await updateUserProfile(user.id, editData);
            if (updatedUser) {
                await refreshUser();
                toast.success(t('profile_updated_success'));
                setIsEditing(false);
            } else {
                toast.error(t('profile_update_failed'));
            }
        } catch (error) {
            toast.error(t('err_unexpected'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user) return;

        if (passwordData.new !== passwordData.confirm) {
            toast.error(t('err_password_mismatch'));
            return;
        }

        if (passwordData.new.length < 6) {
            toast.error(t('err_password_short'));
            return;
        }

        setIsUploading(true);
        try {
            const result = await changePassword(user.id, passwordData.current, passwordData.new);
            if (result.success) {
                toast.success(t('password_changed_success'));
                setIsPasswordDialogOpen(false);
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                toast.error(t(result.error as any || 'err_unexpected'));
            }
        } catch (error) {
            toast.error(t('err_unexpected'));
        } finally {
            setIsUploading(false);
        }
    };

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

    const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const uploadResult = await uploadImage(file);
            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || t('err_image_upload'));
            }

            await updateUserCover(user.id, uploadResult.url);
            await refreshUser();
            toast.success(t('success_cover_updated'));
        } catch (error) {
            console.error(error);
            toast.error(t('err_unexpected'));
        } finally {
            setIsUploading(false);
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
        <div className="min-h-screen bg-background pb-24 md:pb-0">
            {/* Header with Background Image */}
            <div className="relative h-80 w-full overflow-hidden group/header">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={user.cover_url || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200"}
                        alt="Header Background"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/header:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>

                {/* Back Button */}
                <div className="absolute top-4 right-4 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full border border-white/20"
                    >
                        {resolvedLanguage === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Main Edit Button (Pencil Icon floating like in screenshot) */}
                <div className="absolute top-4 left-4 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEditToggle}
                        className="h-12 w-12 bg-white/10 hover:bg-white/30 text-white backdrop-blur-md rounded-full border border-white/30 shadow-xl transition-all hover:rotate-12"
                        title={t('edit')}
                    >
                        <Edit2 className="w-6 h-6" />
                    </Button>
                </div>

                {/* Profile Content Over Background */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-10">
                    <div className="relative inline-block mb-4 group/avatar" key="avatar-v2">
                        <div
                            className="w-36 h-36 rounded-full border-[6px] border-background shadow-2xl overflow-hidden bg-background relative cursor-pointer transition-all duration-300 group-hover/avatar:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            onClick={() => setIsPreviewOpen(true)}
                        >
                            <img
                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`}
                                alt={user.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`;
                                }}
                            />
                        </div>
                    </div>

                    <div className="text-center px-4">
                        <h1 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight">
                            {t('greeting_with_name').replace('{name}', user.name)}
                        </h1>
                        {user.phone && (
                            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm border border-white/10 shadow-sm" dir="ltr">
                                <Phone className="w-3.5 h-3.5 opacity-70" />
                                {user.phone}
                            </p>
                        )}
                    </div>
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
                        className="border-0 shadow-sm bg-card/50 hover:bg-card transition-colors cursor-pointer"
                        onClick={() => setIsPasswordDialogOpen(true)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{t('change_password')}</span>
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
            </div >

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

            {/* Edit Profile Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('edit_profile')}</DialogTitle>
                        <DialogDescription>
                            {t('user_edit_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Avatar & Cover Edit in Dialog */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest">{t('change_avatar_title')}</Label>
                                <div className="relative group/dialog-avatar">
                                    <div className="w-24 h-24 rounded-full border-4 border-muted overflow-hidden bg-muted">
                                        <img
                                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=512`}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border-2 border-background"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2 w-full">
                                <Label className="text-xs text-muted-foreground uppercase tracking-widest">{t('change_cover_title')}</Label>
                                <div
                                    className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-muted relative cursor-pointer group/dialog-cover"
                                    onClick={() => coverInputRef.current?.click()}
                                >
                                    <img
                                        src={user.cover_url || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200"}
                                        alt="Cover Background"
                                        className="w-full h-full object-cover opacity-60 group-hover/dialog-cover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-sm text-primary group-hover/dialog-cover:scale-110 transition-transform">
                                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleCoverChange}
                                disabled={isUploading}
                            />
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <Label htmlFor="popup-name" className="text-sm font-medium">{t('full_name')}</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="popup-name"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="pl-9 h-11"
                                    placeholder={t('full_name_placeholder')}
                                />
                            </div>
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-2">
                            <Label htmlFor="popup-phone" className="text-sm font-medium">{t('phone_number')}</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="popup-phone"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    className="pl-9 h-11"
                                    placeholder={t('phone_placeholder')}
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUploading} className="flex-1 sm:flex-none">
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={isUploading || !editData.name} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('saving_btn')}
                                </>
                            ) : (
                                t('save_changes')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('change_password')}</DialogTitle>
                        <DialogDescription>
                            {t('user_edit_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">{t('current_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="current-password"
                                    type="password"
                                    className="pl-9"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t('new_password')}</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    className="pl-9"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                            <PasswordStrengthBar password={passwordData.new} t={t} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t('confirm_password')}</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    className="pl-9"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isUploading}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleChangePassword} disabled={isUploading || !passwordData.current || !passwordData.new}>
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('saving_btn')}
                                </>
                            ) : (
                                t('save_changes')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function PasswordStrengthBar({ password, t }: { password: string, t: any }) {
    if (!password) return null;

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let level = 0;
    let text = '';
    let color = '';

    if (score <= 2) { level = 1; text = t('weak'); color = 'bg-destructive'; }
    else if (score <= 3) { level = 2; text = t('medium'); color = 'bg-warning'; }
    else { level = 3; text = t('strong'); color = 'bg-success'; }

    return (
        <div className="space-y-1 mt-2">
            <div className="flex gap-1">
                {[1, 2, 3].map((l) => (
                    <div
                        key={l}
                        className={`h-1 flex-1 rounded-full transition-colors ${l <= level ? color : 'bg-muted'}`}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground text-right">
                {t('password_strength')} <span className="font-medium">{text}</span>
            </p>
        </div>
    );
}
