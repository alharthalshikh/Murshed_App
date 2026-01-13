import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getReports, updateReportStatus, deleteReport, Report } from '@/services/reportService';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage, TranslationKey } from '@/context/LanguageContext';
import {
    Search,
    Filter,
    Eye,
    Trash2,
    FileSearch,
    MapPin,
    Calendar,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    Sparkles,
    History as HistoryIcon,
} from 'lucide-react';
import { UserReportsDialog } from '@/components/admin/UserReportsDialog';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const getStatusOptions = (t: (key: TranslationKey) => string) => [
    { value: 'all', label: t('filter_all_statuses') },
    { value: 'pending', label: t('stat_pending') },
    { value: 'processing', label: t('stat_processing') },
    { value: 'matched', label: t('stat_matched') },
    { value: 'contacted', label: t('stat_contacted') },
    { value: 'delivered', label: t('stat_delivered') },
    { value: 'closed', label: t('stat_closed') },
];

const getTypeOptions = (t: (key: TranslationKey) => string) => [
    { value: 'all', label: t('filter_all_types') },
    { value: 'lost', label: t('lost_reports') },
    { value: 'found', label: t('found_reports') },
];

const getCategoryLabel = (t: (key: TranslationKey) => string, category: string) => {
    const labels: Record<string, string> = {
        electronics: t('cat_electronics'),
        documents: t('cat_documents'),
        jewelry: t('cat_jewelry'),
        bags: t('cat_bags'),
        keys: t('cat_keys'),
        pets: t('cat_pets'),
        clothing: t('cat_clothing'),
        other: t('cat_other'),
    };
    return labels[category] || category;
};

// ... imports

export default function AdminReports() {
    const { t, resolvedLanguage } = useLanguage();
    const statusOptions = getStatusOptions(t);
    const typeOptions = getTypeOptions(t);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    // Derived filters for query key
    const filters = {
        limit,
        offset: (page - 1) * limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? (typeFilter as 'lost' | 'found') : undefined,
        search: searchQuery || undefined,
    };

    const {
        data: reports = [],
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ['admin', 'reports', filters],
        queryFn: () => getReports(filters),
        placeholderData: keepPreviousData, // Keep old data while fetching new page
    });

    // History dialog state
    const [historyUser, setHistoryUser] = useState<{ id: string; name: string } | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // ... existing UI state ...

    // ... existing imports

    // UI States
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Handlers
    const handleSearch = () => {
        setPage(1);
        // refetch happens automatically due to dependency on filters
    };

    const handleStatusChange = async (reportId: string, newStatus: string) => {
        try {
            const success = await updateReportStatus(reportId, newStatus);
            if (success) {
                toast.success(t('report_update_status_success'));
                refetch();
            } else {
                toast.error(t('report_update_status_err'));
            }
        } catch (error) {
            toast.error(t('error_occurred'));
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!confirm(t('report_delete_confirm'))) return;

        try {
            const success = await deleteReport(reportId);
            if (success) {
                toast.success(t('report_delete_success'));
                refetch();
            } else {
                toast.error(t('report_delete_err'));
            }
        } catch (error) {
            toast.error(t('error_occurred'));
        }
    };

    const openUserHistory = (userId: string, userName: string) => {
        setHistoryUser({ id: userId, name: userName });
        setIsHistoryOpen(true);
    };

    const handleViewHistoryReportDetails = (report: Report) => {
        setIsHistoryOpen(false); // Close history dialog first
        openReportDetail(report); // Open report detail dialog
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'destructive' | 'success' | 'warning' | 'secondary', label: string }> = {
            pending: { variant: 'warning', label: t('stat_pending') },
            processing: { variant: 'secondary', label: t('stat_processing') },
            matched: { variant: 'success', label: t('stat_matched') },
            contacted: { variant: 'default', label: t('stat_contacted') },
            delivered: { variant: 'success', label: t('stat_delivered') },
            closed: { variant: 'destructive', label: t('stat_closed') },
        };
        const { variant, label } = variants[status] || { variant: 'default', label: status };
        return <Badge variant={variant}>{label}</Badge>;
    };

    const openReportDetail = (report: Report) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">{t('mgmt_reports_title')}</h1>
                <p className="text-muted-foreground mt-1">{t('mgmt_reports_subtitle')}</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", resolvedLanguage === 'ar' ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t('search_reports_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className={cn(resolvedLanguage === 'ar' ? "pr-10" : "pl-10")}
                            />
                        </div>

                        {/* Type Filter */}
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-44">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Refresh */}
                        <Button variant="outline" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b last:border-0">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 pl-4">
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                        <Skeleton className="h-4 w-32" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-20">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t('no_reports')}</p>
                            <p className="text-muted-foreground">{t('no_results_desc')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_report')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_type')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_category')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_status')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_date')}</th>
                                        <th className={cn("p-4 font-medium", resolvedLanguage === 'ar' ? "text-right" : "text-left")}>{t('table_actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {report.images && report.images[0] ? (
                                                        <img
                                                            src={report.images[0]}
                                                            alt={report.title}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                                            {report.type === 'lost' ? (
                                                                <FileSearch className="h-5 w-5 text-muted-foreground" />
                                                            ) : (
                                                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{report.title}</p>
                                                        <p className="text-sm text-muted-foreground">{report.user_name || t('report_unknown_user')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={report.type === 'lost' ? 'destructive' : 'success'}>
                                                    {report.type === 'lost' ? t('lost_reports') : t('found_reports')}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {getCategoryLabel(t, report.category)}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(report.status)}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(report.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openReportDetail(report)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('view_details_btn')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-primary hover:text-primary hover:bg-primary/5"
                                                                onClick={() => openUserHistory(report.user_id, report.user_name || t('report_unknown_user'))}
                                                            >
                                                                <HistoryIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('view_user_reports_btn')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(report.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('delete_btn')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {reports.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        {resolvedLanguage === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {t('page_prev')}
                    </Button>
                    <span className="text-sm text-muted-foreground">{t('page_number').replace('{page}', page.toString())}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={reports.length < limit}
                    >
                        {t('page_next')}
                        {resolvedLanguage === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </div>
            )}

            {/* Report Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedReport?.type === 'lost' ? (
                                <FileSearch className="h-5 w-5 text-destructive" />
                            ) : (
                                <MapPin className="h-5 w-5 text-success" />
                            )}
                            {selectedReport?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {t('report_details_full')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6">
                            {/* Images & AI Descriptions */}
                            {selectedReport.images && selectedReport.images.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {selectedReport.images.map((img, idx) => (
                                            <div key={idx} className="space-y-2 flex-shrink-0">
                                                <img
                                                    src={img}
                                                    alt={t('report_image_alt').replace('{index}', (idx + 1).toString())}
                                                    className="h-32 w-32 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(img, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {selectedReport.image_descriptions && selectedReport.image_descriptions.length > 0 && (
                                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2 mb-2 text-primary">
                                                <Sparkles className="h-4 w-4" />
                                                {t('report_ai_analysis')}
                                            </h4>
                                            <ul className="space-y-2">
                                                {selectedReport.image_descriptions.map((desc, idx) => (
                                                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        {desc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('table_type')}</p>
                                    <Badge variant={selectedReport.type === 'lost' ? 'destructive' : 'success'} className="mt-1">
                                        {selectedReport.type === 'lost' ? t('lost_reports') : t('found_reports')}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('table_category')}</p>
                                    <p className="font-medium mt-1">{getCategoryLabel(t, selectedReport.category)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('report_color_label')}</p>
                                    <p className="font-medium mt-1">{selectedReport.color || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('table_date')}</p>
                                    <p className="font-medium mt-1">{new Date(selectedReport.date_occurred).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">{t('report_location_label')}</p>
                                    <p className="font-medium mt-1">
                                        {selectedReport.location_address}, {selectedReport.location_city}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">{t('report_description_label')}</p>
                                <p className="text-sm bg-muted/50 p-4 rounded-lg">{selectedReport.description}</p>
                            </div>

                            {/* Status Change */}
                            <div className="flex items-center gap-4 pt-4 border-t">
                                <p className="text-sm font-medium">{t('report_change_status')}</p>
                                <Select
                                    value={selectedReport.status}
                                    onValueChange={(value) => {
                                        handleStatusChange(selectedReport.id, value);
                                        setSelectedReport({ ...selectedReport, status: value as any });
                                    }}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.slice(1).map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <UserReportsDialog
                userId={historyUser?.id || null}
                userName={historyUser?.name || null}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                onViewDetails={handleViewHistoryReportDetails}
            />
        </AdminLayout>
    );
}
