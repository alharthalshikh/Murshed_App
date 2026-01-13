import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getReportById, Report, updateReportStatus } from '@/services/reportService';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowRight,
    Calendar,
    MapPin,
    Tag,
    Palette,
    FileText,
    Sparkles,
    User,
    Mail,
    Clock,
    Loader2,
    AlertCircle,
    Share2,
    Phone,
    MessageSquare,
    CheckCircle,
    Edit,
    HeartHandshake,
    ZoomIn,
    ZoomOut,
    RotateCw,
    X,
    Maximize2,
    History as HistoryIcon,
} from 'lucide-react';
import { UserReportsDialog } from '@/components/admin/UserReportsDialog';

interface MatchedReport {
    id: string;
    title: string;
    description: string;
    location_city: string;
    location_address?: string;
    user_name: string;
    user_phone?: string;
    user_email: string;
    images?: string[];
    date_occurred: string;
}

export default function ReportDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, canModerate, isAdmin } = useAuth();
    const { t, resolvedLanguage } = useLanguage();
    const [report, setReport] = useState<Report | null>(null);
    const [matchedReport, setMatchedReport] = useState<MatchedReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Zoom Modal State
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
    const handleRotate = () => setRotation(prev => prev + 90);
    const resetZoom = () => {
        setZoomLevel(1);
        setRotation(0);
    };

    useEffect(() => {
        if (!isZoomOpen) {
            resetZoom();
        }
    }, [isZoomOpen]);

    useEffect(() => {
        if (id) {
            loadReport(id);
        }
    }, [id]);

    const loadReport = async (reportId: string) => {
        setIsLoading(true);
        try {
            const data = await getReportById(reportId);
            setReport(data);
            if (data?.images && data.images.length > 0) {
                setSelectedImage(data.images[0]);
            }

            // Note: In a real app, matched report details should be fetched via a dedicated service function
            // to avoid SQL in the frontend. For now, we'll gracefully handle it.
            if (data?.status === 'matched') {
                // Future improvement: implement getMatchedReportDetails(reportId)
            }
        } catch (error) {
            console.error('Error loading report:', error);
            toast.error(t('err_loading_reports'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `${t(report?.type === 'lost' ? 'wa_share_lost' : 'wa_share_found')} ${report?.title}`,
            text: `${report?.description}\n\n${t('city_label')}: ${report?.location_city}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success(t('link_copied'));
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleContactReporter = () => {
        if (!report) return;

        const reporterPhone = report.user_phone;
        const reporterEmail = report.user_email;
        const shortId = String(report.short_id || (report.id?.substring(0, 4)) || t('loading'));

        const message = (t('contact_reporter_wa') as string)
            .replace('{name}', report.user_name || (resolvedLanguage === 'ar' ? 'يا أخي' : 'Friend'))
            .replace('{title}', report.title)
            .replace('{id}', shortId);

        if (reporterPhone) {
            // نستخدم 967 كمفتاح دولي لليمن إذا لم يكن موجوداً
            const formattedPhone = reporterPhone.startsWith('967') ? reporterPhone : `967${reporterPhone}`;
            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (reporterEmail) {
            const subject = encodeURIComponent((t('contact_reporter_subject') as string).replace('{title}', report.title));
            const body = encodeURIComponent(message);
            window.location.href = `mailto:${reporterEmail}?subject=${subject}&body=${body}`;
        } else {
            toast.error(t('contact_no_info_error'));
        }
    };

    const openWhatsApp = () => {
        const adminPhone = '771035015';
        const shortId = String(report?.short_id || (report?.id?.substring(0, 4)) || t('loading'));

        let message = '';
        if (report?.type === 'found') {
            message = (t('wa_message_found') as string).replace('{id}', shortId);
        } else {
            message = (t('wa_message_lost') as string).replace('{id}', shortId);
        }

        window.open(`https://wa.me/967${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const makeCall = () => {
        const adminPhone = '771035015';
        window.location.href = `tel:${adminPhone}`;
    };

    const handleMarkAsDelivered = async () => {
        if (!report || !user) return;

        try {
            const success = await updateReportStatus(report.id, 'delivered');
            if (success) {
                toast.success(t('confirm_delivery_btn'));
                navigate('/achievements');
            } else {
                toast.error(t('error_occurred'));
            }
        } catch (error) {
            console.error('Error marking as delivered:', error);
            toast.error(t('error_occurred'));
        }
    };

    const openUserHistory = (userId: string, userName: string) => {
        setHistoryUser({ id: userId, name: userName });
        setIsHistoryOpen(true);
    };

    const handleViewHistoryReportDetails = (historyReport: Report) => {
        setIsHistoryOpen(false);
        navigate(`/reports/${historyReport.id}`);
    };

    // ... (inside component)

    // ... (inside component)

    if (isLoading) {
        return (
            <Layout>
                <div className="container pt-6 pb-24 md:py-10">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-10 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Main Image Skeleton */}
                            <Card className="overflow-hidden border-0 shadow-xl">
                                <CardContent className="p-0">
                                    <Skeleton className="aspect-video w-full" />
                                    <div className="flex gap-2 p-4">
                                        {[1, 2, 3].map(i => (
                                            <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Details Skeleton */}
                            <Card className="border-0 shadow-xl">
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-8 w-64 mb-2" />
                                        <Skeleton className="h-12 w-32 rounded-xl" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Skeletons */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-xl">
                                <CardHeader className="border-b">
                                    <Skeleton className="h-6 w-40" />
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <Skeleton className="h-14 w-14 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>

                            <div className="sticky bottom-10">
                                <Skeleton className="h-16 w-full rounded-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!report) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{t('report_not_found')}</h3>
                    <p className="text-muted-foreground mb-4">{t('report_not_found_desc')}</p>
                    <Button variant="outline" onClick={() => navigate('/reports')} className="gap-2">
                        {resolvedLanguage === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
                        {t('back_to_reports')}
                    </Button>
                </div>
            </Layout>
        );
    }

    const isOwner = report.user_id === user?.id || canModerate;

    return (
        <Layout>
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    {resolvedLanguage === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
                    {t('back_btn')}
                </Button>

                <div className="flex gap-2">
                    {isOwner && (
                        <Link to={`/reports/${report.id}/edit`}>
                            <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                                <Edit className="h-4 w-4 text-primary" />
                                {t('edit_report_btn')}
                            </Button>
                        </Link>
                    )}
                    <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Images */}
                    <Card className="overflow-hidden border-0 shadow-xl">
                        <CardContent className="p-0">
                            {/* Main Image */}
                            <div className="relative aspect-video bg-muted group">
                                {selectedImage ? (
                                    <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                                        <DialogTrigger asChild>
                                            <div className="w-full h-full cursor-zoom-in relative">
                                                <img
                                                    src={selectedImage}
                                                    alt={report.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Maximize2 className="h-8 w-8 text-white drop-shadow-lg" />
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-0 bg-black/95 shadow-none flex flex-col items-center justify-center outline-none">
                                            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={selectedImage}
                                                    alt="Zoomed"
                                                    style={{
                                                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                                        transition: 'transform 0.3s ease-out'
                                                    }}
                                                    className="max-w-full max-h-full object-contain select-none cursor-move"
                                                />
                                            </div>

                                            {/* Controls */}
                                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-sm p-4 rounded-full border border-white/10 z-50">
                                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                                                    <ZoomOut className="h-6 w-6" />
                                                </Button>
                                                <span className="text-white font-mono min-w-[3ch] text-center">{Math.round(zoomLevel * 100)}%</span>
                                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                                                    <ZoomIn className="h-6 w-6" />
                                                </Button>
                                                <div className="w-px h-6 bg-white/20 mx-2" />
                                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={handleRotate}>
                                                    <RotateCw className="h-6 w-6" />
                                                </Button>
                                                <div className="w-px h-6 bg-white/20 mx-2" />
                                                <DialogClose asChild>
                                                    <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/20 hover:text-red-400 rounded-full">
                                                        <X className="h-6 w-6" />
                                                    </Button>
                                                </DialogClose>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FileText className="h-20 w-20 text-muted-foreground/50" />
                                    </div>
                                )}

                                <div className="absolute top-4 right-4 pointer-events-none">
                                    <Badge
                                        variant={report.type === 'lost' ? 'destructive' : 'success'}
                                        className="text-sm px-3 py-1 shadow-lg"
                                    >
                                        {t(report.type === 'lost' ? 'stat_lost' : 'stat_found')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {report.images && report.images.length > 1 && (
                                <div className="flex gap-2 p-4 overflow-x-auto">
                                    {report.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'border-transparent hover:border-muted-foreground/30'
                                                }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${t('image_count')} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Report Information */}
                    <Card className="border-0 shadow-xl">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl pt-1">
                                        {report.title}
                                    </CardTitle>
                                </div>
                                {report.reward_amount && Number(report.reward_amount) > 0 && (
                                    <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                                        <Sparkles className="h-4 w-4" />
                                        <div className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}>
                                            <p className="text-[10px] uppercase font-bold">{t('reward_badge')}</p>
                                            <p className="font-bold">
                                                {Number(report.reward_amount).toLocaleString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')} {t(report.reward_currency === 'YER' ? 'currency_yer' : 'currency_usd' as TranslationKey)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">
                                    {t(`cat_${report.category}` as TranslationKey) || report.category}
                                </Badge>
                                <Badge
                                    variant={
                                        report.status === 'matched'
                                            ? 'success'
                                            : report.status === 'processing'
                                                ? 'secondary'
                                                : report.status === 'pending'
                                                    ? 'warning'
                                                    : 'destructive'
                                    }
                                >
                                    {t(`stat_${report.status}` as TranslationKey) || report.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {t('description_label')}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {report.description}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {report.color && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <Palette className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('color_label')}</p>
                                            <p className="font-medium">{report.color}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {t(report.type === 'lost' ? 'lost_date_label' : 'found_date_label')}
                                        </p>
                                        <p className="font-medium">
                                            {report.date_occurred
                                                ? new Date(report.date_occurred).toLocaleDateString('ar-SA')
                                                : 'بدون تاريخ'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">المدينة</p>
                                        <p className="font-medium">{report.location_city}</p>
                                    </div>
                                </div>

                                {report.location_address && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('address_label')}</p>
                                            <p className="font-medium">{report.location_address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {report.distinguishing_marks && (
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        {t('distinguishing_marks_label')}
                                    </h3>
                                    <p className="text-muted-foreground">{report.distinguishing_marks}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {report.created_at && (
                                        <>{t('published_on')} {new Date(report.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}</>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Reporter Card */}
                    <Card className="border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {t('publisher_info')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl ring-2 ring-primary/10 ring-offset-2">
                                    {report.user_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{report.user_name || t('unknown_user')}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {report.user_email}
                                    </p>
                                </div>
                            </div>

                            {/* Actions for viewers */}
                            <div className="space-y-3">
                                <Button className="w-full gap-2" variant="default" onClick={handleContactReporter}>
                                    <MessageSquare className="h-4 w-4" />
                                    {t('send_message_btn')}
                                </Button>

                                {isAdmin && (
                                    <Button
                                        className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                        variant="outline"
                                        onClick={() => openUserHistory(report.user_id, report.user_name || t('unknown_user'))}
                                    >
                                        <HistoryIcon className="h-4 w-4" />
                                        {t('view_user_reports_btn')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Matched Report Info */}
                    {report.status === 'matched' && (
                        <Card className="border-2 border-success shadow-xl bg-success/5 animate-pulse">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-success mb-1">{t('match_found_title')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t('match_found_desc')}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Delivery Action - Only for Owner/Admin and only when status is 'matched' */}
                    {(report.user_id === user?.id || canModerate) && report.status === 'matched' && (
                        <Card className="border-0 shadow-xl overflow-hidden bg-success/10 border-success/20">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-success">
                                    <HeartHandshake className="h-5 w-5" />
                                    {t('confirm_delivery_title')}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t('confirm_delivery_desc')}
                                </p>
                                <Button
                                    className="w-full gap-2 bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 rounded-xl py-6 transition-all active:scale-95"
                                    onClick={handleMarkAsDelivered}
                                >
                                    <HeartHandshake className="h-5 w-5" />
                                    <span className="font-bold text-lg">{t('confirm_delivery_btn')}</span>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sticky Action Bar */}
                    <div className="sticky bottom-[76px] z-40 lg:bottom-10 mt-6">
                        <Card className="border shadow-2xl bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden">
                            <CardContent className="p-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-11 gap-2 text-primary border-primary/20 hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="h-4 w-4" />
                                        <span className="font-bold text-sm whitespace-nowrap">{t('share_btn')}</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="flex-1 h-11 gap-2 text-primary border-primary/20 hover:bg-primary/5 rounded-xl transition-all active:scale-95"
                                        onClick={openWhatsApp}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="font-bold text-sm whitespace-nowrap">{t('whatsapp_btn')}</span>
                                    </Button>

                                    <Button
                                        className="flex-1 h-11 gap-2 bg-[#088395] hover:bg-[#077181] text-white shadow-lg shadow-[#088395]/20 rounded-xl transition-all active:scale-95 border-0"
                                        onClick={makeCall}
                                    >
                                        <Phone className="h-4 w-4" />
                                        <span className="font-bold text-sm whitespace-nowrap">{t('call_btn')}</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            {/* Spacer for sticky bar */}
            <div className="h-28 md:hidden" />

            <UserReportsDialog
                userId={historyUser?.id || null}
                userName={historyUser?.name || null}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                onViewDetails={handleViewHistoryReportDetails}
            />
        </Layout>
    );
}
