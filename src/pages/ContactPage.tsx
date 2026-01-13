import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getContactInfo, ContactInfo } from '@/services/contactService';
import { Loader2, Phone, Facebook, Instagram, Youtube, MessagesSquare, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [info, setInfo] = useState<ContactInfo>({});
    const [isImageOpen, setIsImageOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await getContactInfo();
        setInfo(data);
        setIsLoading(false);
    };

    const SocialButton = ({ href, icon: Icon, label, colorClass }: { href?: string, icon: any, label: string, colorClass: string }) => {
        // ... existing SocialButton code ...
        if (!href) return null;
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="w-full block transform hover:-translate-y-1 transition-all duration-300">
                <Button className={`w-full gap-3 h-14 text-lg font-medium rounded-2xl ${colorClass}`} size="lg">
                    <Icon className="h-6 w-6" />
                    {label}
                </Button>
            </a>
        );
    };

    const WhatsAppButton = ({ number, label }: { number?: string, label: string }) => {
        // ... existing WhatsAppButton code ...
        if (!number) return null;
        const href = `https://wa.me/${number.replace(/\D/g, '')}`;
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="w-full block transform hover:-translate-y-1 transition-all duration-300">
                <Button className="w-full gap-3 h-14 text-lg font-medium rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 border-0" size="lg">
                    <Phone className="h-6 w-6" />
                    {label}
                </Button>
            </a>
        );
    };

    // ... (inside the component)

    // ... (inside the component)

    if (isLoading) {
        return (
            <Layout>
                <div className="container max-w-lg mx-auto py-8 px-4">
                    <div className="text-center mb-8 space-y-2">
                        <Skeleton className="h-10 w-48 mx-auto" />
                        <Skeleton className="h-4 w-64 mx-auto" />
                    </div>

                    <div className="flex flex-col items-center gap-6 mb-8">
                        {/* Avatar Skeleton */}
                        <Skeleton className="h-48 w-48 rounded-full border-4 border-white shadow-lg" />

                        {/* Name Skeleton */}
                        <div className="text-center -mt-4 space-y-2">
                            <Skeleton className="h-8 w-40 mx-auto" />
                            <Skeleton className="h-4 w-24 mx-auto" />
                        </div>

                        {/* Card Skeleton */}
                        <Card className="w-full border-t-8 border-t-primary/20 shadow-2xl rounded-3xl overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="w-full h-14 rounded-2xl" />
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-lg mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{t('contact_us_title')}</h1>
                    <p className="text-muted-foreground">{t('contact_us_desc')}</p>
                </div>

                <div className="flex flex-col items-center gap-6 mb-8">
                    <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                        <DialogTrigger asChild>
                            <div className="h-48 w-48 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 cursor-pointer transform hover:scale-105 transition-all duration-300 group relative">
                                {info.admin_avatar ? (
                                    <>
                                        <img src={info.admin_avatar} alt="Admin" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                    </>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-3xl">
                                        {t('nav_contact').charAt(0)}
                                    </div>
                                )}
                            </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none">
                            <div className="relative">
                                <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
                                    <X className="h-6 w-6" />
                                </DialogClose>
                                {info.admin_avatar && (
                                    <img
                                        src={info.admin_avatar}
                                        alt="Admin Full"
                                        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                                    />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {info.admin_name && (
                        <div className="text-center mb-8 -mt-6">
                            <h2 className="text-xl font-semibold">{info.admin_name}</h2>
                            <p className="text-sm text-muted-foreground">{t('contact_manager')}</p>
                        </div>
                    )}

                    <Card className="border-t-8 border-t-primary shadow-2xl rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                        <CardContent className="p-8 space-y-6">
                            <WhatsAppButton number={info.whatsapp_number} label={t('contact_wa_label')} />

                            <SocialButton
                                href={info.whatsapp_group_url}
                                icon={MessagesSquare}
                                label={t('join_wa_group')}
                                colorClass="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40"
                            />

                            <SocialButton
                                href={info.facebook_url}
                                icon={Facebook}
                                label={t('follow_facebook')}
                                colorClass="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
                            />

                            <SocialButton
                                href={info.instagram_url}
                                icon={Instagram}
                                label={t('follow_instagram')}
                                colorClass="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20 hover:shadow-pink-600/40"
                            />

                            <SocialButton
                                href={info.youtube_url}
                                icon={Youtube}
                                label={t('subscribe_youtube')}
                                colorClass="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
