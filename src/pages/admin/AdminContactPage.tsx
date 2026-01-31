import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllContacts, deleteContact, toggleContactStatus, getContactInfo, updateContactInfo, type ContactInfo } from '@/services/contactService';
import { toast } from 'sonner';
import { Contact } from '@/types/contact';
import { ContactForm } from '@/components/admin/contacts/ContactForm';
import { ContactsList } from '@/components/admin/contacts/ContactsList';
import { useLanguage } from '@/context/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { uploadImage } from '@/services/imageService';
import ImageCropper from '@/components/profile/ImageCropper';
import { cn } from '@/lib/utils';

export default function AdminContactPage() {
    const { t, resolvedLanguage } = useLanguage();
    const isRtl = resolvedLanguage === 'ar';

    // Multi-contact state
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    // Legacy/Social Media state
    const [socialLoading, setSocialLoading] = useState(true);
    const [socialSaving, setSocialSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [socialData, setSocialData] = useState<ContactInfo>({
        admin_name: '',
        admin_avatar: '',
        whatsapp_number: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        whatsapp_group_url: '',
        snapchat_url: '',
    });

    // Image Cropping State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'admin' | 'contact' | null>(null); // To distinguish who is uploading

    useEffect(() => {
        loadContacts();
        loadSocialData();
    }, []);

    const loadContacts = async () => {
        setIsLoadingContacts(true);
        setError(null);
        try {
            const data = await getAllContacts();
            setContacts(data);
        } catch (err) {
            console.error(err);
            setError(t('err_loading_contacts') || 'Error loading contacts');
        } finally {
            setIsLoadingContacts(false);
        }
    };

    const loadSocialData = async () => {
        setSocialLoading(true);
        const data = await getContactInfo();
        setSocialData(data);
        setSocialLoading(false);
    };

    // --- Contacts CRUD Handlers ---

    const handleSuccess = (newOrUpdatedContact?: Contact) => {
        loadContacts(); // Reload full list to be sure
        setEditingContact(null); // Return to Add Mode
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        // We might want to switch tab or scroll, but form is in the same tab
    };

    const handleCancelEdit = () => {
        setEditingContact(null);
    };

    const handleDelete = async (contact: Contact) => {
        if (!confirm(t('confirm_delete') || 'Are you sure?')) return;

        const success = await deleteContact(contact.id);
        if (success) {
            toast.success(t('contact_deleted') || 'Contact deleted successfully');
            loadContacts();

            // If deleting the one being edited, reset form
            if (editingContact?.id === contact.id) {
                setEditingContact(null);
            }
        } else {
            toast.error(t('error_deleting_contact') || 'Failed to delete contact');
        }
    };

    const handleToggleStatus = async (contact: Contact) => {
        const success = await toggleContactStatus(contact.id, !contact.is_active);
        if (success) {
            toast.success(t('status_updated') || 'Status updated');
            loadContacts();
        } else {
            toast.error(t('error_updating_status') || 'Failed to update status');
        }
    };

    // --- Legacy/Social Handlers ---

    const handleSaveSocial = async () => {
        setSocialSaving(true);
        try {
            const success = await updateContactInfo(socialData);
            if (success) {
                toast.success(t('save_contact_success'));
            } else {
                toast.error(t('save_contact_err'));
            }
        } catch (error) {
            toast.error(t('save_contact_err'));
        } finally {
            setSocialSaving(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadTarget('admin');
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
        if (uploadTarget === 'admin') {
            setIsUploading(true);
            try {
                // Convert Blob to File
                const file = new File([croppedBlob], "profile_image.jpg", { type: "image/jpeg" });

                const result = await uploadImage(file);
                if (result.success && result.url) {
                    setSocialData(prev => ({ ...prev, admin_avatar: result.url }));
                    toast.success(t('upload_photo_success'));
                } else {
                    toast.error(result.error || t('upload_photo_err'));
                }
            } catch (error) {
                toast.error(t('upload_photo_err'));
            } finally {
                setIsUploading(false);
            }
        }
        // Note: ContactForm handles its own cropping internally via its own state
    };

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('contact_mgmt_title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('contact_mgmt_subtitle')}</p>
                </div>
            </div>

            <Tabs defaultValue="social" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="social">{t('social_media_settings') || "General Settings"}</TabsTrigger>
                    <TabsTrigger value="contacts">{t('contacts_list') || "Team Contacts"}</TabsTrigger>
                </TabsList>

                {/* --- Tab 1: Legacy Social Settings (Admin Profile) --- */}
                <TabsContent value="social">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{t('general_info') || "General Information"}</CardTitle>
                                    <CardDescription>{t('admin_profile_img_desc')}</CardDescription>
                                </div>
                                <Button onClick={handleSaveSocial} disabled={socialSaving || socialLoading} variant="default">
                                    {socialSaving ? <Loader2 className={cn("h-4 w-4 animate-spin", isRtl ? "ml-2" : "mr-2")} /> : <Save className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />}
                                    {socialSaving ? t('saving_btn') : t('save_changes_btn')}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative">
                                        {socialData.admin_avatar ? (
                                            <img src={socialData.admin_avatar} alt="Profile" className="h-full w-full object-cover" />
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
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="admin_name">{t('admin_name_label')}</Label>
                                        <Input
                                            id="admin_name"
                                            value={socialData.admin_name || ''}
                                            onChange={e => setSocialData({ ...socialData, admin_name: e.target.value })}
                                            className="bg-card"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp_number">{t('contact_wa_label') || "WhatsApp Number"}</Label>
                                        <Input
                                            id="whatsapp_number"
                                            value={socialData.whatsapp_number || ''}
                                            onChange={e => setSocialData({ ...socialData, whatsapp_number: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                            placeholder="e.g. 967770000000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp_group">{t('whatsapp_group_label')}</Label>
                                        <Input
                                            id="whatsapp_group"
                                            value={socialData.whatsapp_group_url || ''}
                                            onChange={e => setSocialData({ ...socialData, whatsapp_group_url: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="facebook">{t('facebook_link_label')}</Label>
                                        <Input
                                            id="facebook"
                                            value={socialData.facebook_url || ''}
                                            onChange={e => setSocialData({ ...socialData, facebook_url: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">{t('instagram_link_label')}</Label>
                                        <Input
                                            id="instagram"
                                            value={socialData.instagram_url || ''}
                                            onChange={e => setSocialData({ ...socialData, instagram_url: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="youtube">{t('youtube_link_label')}</Label>
                                        <Input
                                            id="youtube"
                                            value={socialData.youtube_url || ''}
                                            onChange={e => setSocialData({ ...socialData, youtube_url: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="snapchat">{t('snapchat_link_label') || "Snapchat Link"}</Label>
                                        <Input
                                            id="snapchat"
                                            value={socialData.snapchat_url || ''}
                                            onChange={e => setSocialData({ ...socialData, snapchat_url: e.target.value })}
                                            dir="ltr"
                                            className={cn("bg-card", isRtl ? "text-right" : "text-left")}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Tab 2: Contacts Management (Multi-User) --- */}
                <TabsContent value="contacts">
                    <div className="grid gap-8">
                        {/* Section 1: Add/Edit Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{editingContact ? (t('edit_contact') || "Edit Contact") : (t('add_new_contact') || "Add New Contact")}</CardTitle>
                                <CardDescription>
                                    {editingContact
                                        ? (t('edit_contact_desc') || "Update contact details below.")
                                        : (t('add_contact_desc') || "Fill in the details to add a new contact to the team.")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ContactForm
                                    onSuccess={handleSuccess}
                                    editingContact={editingContact}
                                    onCancelEdit={handleCancelEdit}
                                />
                            </CardContent>
                        </Card>

                        {/* Section 2: Contacts List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('contacts_list') || "Team Contacts"}</CardTitle>
                                <CardDescription>{t('manage_team_contacts_desc') || "View and manage all active team members."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingContacts ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="p-6 text-center border border-destructive/20 bg-destructive/5 rounded-lg">
                                        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                                        <p className="text-destructive font-medium mb-4">{error}</p>
                                        <Button variant="outline" onClick={loadContacts}>
                                            {t('retry_btn') || 'Retry'}
                                        </Button>
                                    </div>
                                ) : (
                                    <ContactsList
                                        contacts={contacts}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <ImageCropper
                imageSrc={selectedImage}
                open={isCropperOpen}
                onClose={() => setIsCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />
        </AdminLayout>
    );
}
