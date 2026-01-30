import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { CreateContactDTO, UpdateContactDTO, Contact } from '@/types/contact';
import { addContact, updateContact } from '@/services/contactService';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { uploadImage } from '@/services/imageService';
import ImageCropper from '@/components/profile/ImageCropper';

const contactSchema = z.object({
    full_name: z.string().min(2, 'Name is required'),
    phone: z.string().min(5, 'Phone is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    note: z.string().optional(),
    avatar_url: z.string().optional(),
    facebook_url: z.string().optional(),
    instagram_url: z.string().optional(),
    youtube_url: z.string().optional(),
    whatsapp_group_url: z.string().optional(),
});

interface ContactFormProps {
    onSuccess: (newContact?: Contact) => void;
    editingContact?: Contact | null;
    onCancelEdit?: () => void;
}

export function ContactForm({ onSuccess, editingContact, onCancelEdit }: ContactFormProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

    // Image Handling
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            email: '',
            note: '',
            avatar_url: '',
            facebook_url: '',
            instagram_url: '',
            youtube_url: '',
            whatsapp_group_url: '',
        },
    });

    useEffect(() => {
        if (editingContact) {
            form.reset({
                full_name: editingContact.full_name,
                phone: editingContact.phone,
                email: editingContact.email || '',
                note: editingContact.note || '',
                avatar_url: editingContact.avatar_url || '',
                facebook_url: editingContact.facebook_url || '',
                instagram_url: editingContact.instagram_url || '',
                youtube_url: editingContact.youtube_url || '',
                whatsapp_group_url: editingContact.whatsapp_group_url || '',
            });
        } else {
            form.reset({
                full_name: '',
                phone: '',
                email: '',
                note: '',
                avatar_url: '',
                facebook_url: '',
                instagram_url: '',
                youtube_url: '',
                whatsapp_group_url: '',
            });
        }
    }, [editingContact, form]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setIsCropperOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsUploading(true);
        try {
            const file = new File([croppedBlob], "contact_avatar.jpg", { type: "image/jpeg" });
            const result = await uploadImage(file);
            if (result.success && result.url) {
                form.setValue('avatar_url', result.url);
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

    async function onSubmit(values: z.infer<typeof contactSchema>) {
        setIsLoading(true);
        try {
            if (editingContact) {
                const updates: UpdateContactDTO = values;
                const updated = await updateContact(editingContact.id, updates);
                if (updated) {
                    toast.success(t('contact_updated_success'));
                    onSuccess(updated);
                    // Form clearing is handled by parent resetting editingContact or manual definition
                } else {
                    toast.error(t('contact_update_error'));
                }
            } else {
                const newContact = await addContact(values as CreateContactDTO);
                if (newContact) {
                    toast.success(t('contact_added_success'));
                    form.reset();
                    onSuccess(newContact);
                } else {
                    toast.error(t('contact_add_error'));
                }
            }
        } catch (error) {
            toast.error(t('error_occurred'));
        } finally {
            setIsLoading(false);
        }
    }

    const currentAvatar = form.watch('avatar_url');

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {/* Avatar Upload Section */}
                    <div className="flex items-center gap-6 mb-6">
                        <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative shrink-0">
                            {currentAvatar ? (
                                <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
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
                            <Label htmlFor="contact-avatar-upload" className="cursor-pointer">
                                <div className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                                    <Camera className="h-4 w-4" />
                                    {t('change_img_btn')}
                                </div>
                                <Input
                                    id="contact-avatar-upload"
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

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('name_label')} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('full_name_placeholder') || "Full Name"} {...field} className="text-right" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('phone_label')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="+967..." {...field} dir="ltr" className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('email_label')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="example@domain.com" {...field} dir="ltr" className="text-right" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="whatsapp_group_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('whatsapp_group_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://chat.whatsapp.com/..." {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="facebook_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('facebook_link_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://facebook.com/..." {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instagram_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('instagram_link_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://instagram.com/..." {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="youtube_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('youtube_link_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://youtube.com/..." {...field} dir="ltr" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="note"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('note_label')} ({t('optional')})</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        {editingContact && onCancelEdit && (
                            <Button type="button" variant="outline" onClick={onCancelEdit}>
                                {t('cancel')}
                            </Button>
                        )}
                        <Button type="submit" disabled={isLoading || isUploading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {editingContact ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {editingContact ? t('save_changes_btn') : t('add_contact')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>

            <ImageCropper
                imageSrc={selectedImage}
                open={isCropperOpen}
                onClose={() => setIsCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />
        </div >
    );
}
