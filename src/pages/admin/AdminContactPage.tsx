import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getContactInfo, updateContactInfo, type ContactInfo } from '@/services/contactService';
import { toast } from 'sonner';
import { Save, Loader2, Link as LinkIcon, Phone, Camera, X } from 'lucide-react';
import { uploadImage } from '@/services/imageService';
import ImageCropper from '@/components/profile/ImageCropper';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export default function AdminContactPage() {
    const { t, resolvedLanguage } = useLanguage();
    const isRtl = resolvedLanguage === 'ar';
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState<ContactInfo>({
        admin_name: '',
        admin_avatar: '',
        whatsapp_number: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        whatsapp_group_url: '',
    });

    // Image Cropping State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getContactInfo();
        setFormData(data);
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await updateContactInfo(formData);
            if (success) {
                toast.success(t('save_contact_success'));
            } else {
                toast.error(t('save_contact_err'));
            }
        } catch (error) {
            toast.error(t('save_contact_err'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsCropperOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsUploading(true);
        try {
            // Convert Blob to File
            const file = new File([croppedBlob], "profile_image.jpg", { type: "image/jpeg" });

            const result = await uploadImage(file);
            if (result.success && result.url) {
                setFormData(prev => ({ ...prev, admin_avatar: result.url }));
                toast.success(t('upload_photo_success'));
            } else {
                toast.error(result.error || t('upload_photo_err'));
            }
        } catch (error) {
            toast.error(t('upload_photo_err'));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('contact_mgmt_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('contact_mgmt_subtitle')}</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className={cn("h-4 w-4 animate-spin", isRtl ? "ml-2" : "mr-2")} /> : <Save className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />}
                    {isSaving ? t('saving_btn') : t('save_changes_btn')}
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            </div>
                            <div className="space-y-2 mt-6">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-3 w-64" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('admin_profile_img_title')}</CardTitle>
                            <CardDescription>{t('admin_profile_img_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative">
                                    {formData.admin_avatar ? (
                                        <img src={formData.admin_avatar} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">{t('no_photo_label')}</span>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                                        <div className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                                            <Camera className="h-4 w-4" />
                                            {t('change_img_btn')}
                                        </div>
                                        <Input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                        />
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{t('image_upload_hint')}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-6">
                                <Label htmlFor="admin_name">{t('admin_name_label')}</Label>
                                <Input
                                    id="admin_name"
                                    placeholder={t('admin_name_placeholder')}
                                    value={formData.admin_name || ''}
                                    onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">{t('admin_name_desc')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('contact_methods_title')}</CardTitle>
                            <CardDescription>{t('social_links_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {t('whatsapp_number_label')}
                                    </Label>
                                    <Input
                                        id="whatsapp"
                                        placeholder="مثال: 967771234567"
                                        value={formData.whatsapp_number || ''}
                                        onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                        dir="ltr"
                                        className={cn(isRtl ? "text-right" : "text-left")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_group" className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4" />
                                        {t('whatsapp_group_label')}
                                    </Label>
                                    <Input
                                        id="whatsapp_group"
                                        placeholder="https://chat.whatsapp.com/..."
                                        value={formData.whatsapp_group_url || ''}
                                        onChange={e => setFormData({ ...formData, whatsapp_group_url: e.target.value })}
                                        dir="ltr"
                                        className={cn(isRtl ? "text-right" : "text-left")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="facebook">{t('facebook_link_label')}</Label>
                                <Input
                                    id="facebook"
                                    placeholder="https://facebook.com/..."
                                    value={formData.facebook_url || ''}
                                    onChange={e => setFormData({ ...formData, facebook_url: e.target.value })}
                                    dir="ltr"
                                    className={cn(isRtl ? "text-right" : "text-left")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instagram">{t('instagram_link_label')}</Label>
                                <Input
                                    id="instagram"
                                    placeholder="https://instagram.com/..."
                                    value={formData.instagram_url || ''}
                                    onChange={e => setFormData({ ...formData, instagram_url: e.target.value })}
                                    dir="ltr"
                                    className={cn(isRtl ? "text-right" : "text-left")}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="youtube">{t('youtube_link_label')}</Label>
                                <Input
                                    id="youtube"
                                    placeholder="https://youtube.com/..."
                                    value={formData.youtube_url || ''}
                                    onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
                                    dir="ltr"
                                    className={cn(isRtl ? "text-right" : "text-left")}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <ImageCropper
                imageSrc={selectedImage}
                open={isCropperOpen}
                onClose={() => setIsCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />
        </AdminLayout>
    );
}
