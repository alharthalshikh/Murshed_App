import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getReportById, Report } from '@/services/reportService';
import { ReportForm } from '@/components/reports/ReportForm';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';

export default function EditReport() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, resolvedLanguage } = useLanguage();

    const [report, setReport] = useState<Report | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (!id) return;

            try {
                setIsLoading(true);
                const fetchedReport = await getReportById(id);

                if (!fetchedReport) {
                    setError(t('report_not_found'));
                    return;
                }

                // التحقق من الملكية
                if (fetchedReport.user_id !== user?.id && user?.role !== 'admin') {
                    setError(t('err_no_permission'));
                    toast.error(t('err_no_permission'));
                    navigate('/reports');
                    return;
                }

                setReport(fetchedReport);
            } catch (err) {
                console.error('Error fetching report:', err);
                setError(t('err_loading_report_details'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id, user, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t('loading_report_data')}</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">{error || t('unexpected_error')}</h2>
                    <p className="text-muted-foreground">{t('report_not_found_desc')}</p>
                </div>
                <Button onClick={() => navigate('/reports')} variant="outline" className="gap-2">
                    {resolvedLanguage === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
                    {t('back_to_reports')}
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{t('edit_report_title')}</h1>
                    <p className="text-muted-foreground">
                        {(t('edit_details_for') as string).replace('{title}', report.title)}
                    </p>
                </div>
                <Button onClick={() => navigate(-1)} variant="ghost" className="gap-2">
                    {resolvedLanguage === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rotate-180" />}
                    {t('back_btn')}
                </Button>
            </div>

            <ReportForm initialData={report} />
        </div>
    );
}
