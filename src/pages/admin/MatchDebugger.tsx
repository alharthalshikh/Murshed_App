import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Bug, GitCompare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Import matchingService to ensure debugFindMatches is registered on window
import '@/services/matchingService';

export default function MatchDebugger() {
    const { t, resolvedLanguage } = useLanguage();
    const isRtl = resolvedLanguage === 'ar';
    const [reportId, setReportId] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!reportId.trim()) return;
        setLoading(true);
        try {
            const matches = await window.debugFindMatches(reportId);
            setResults(matches);
        } catch (error) {
            console.error(error);
            setResults({ error: t('err_unexpected') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {t('debugger_title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('debugger_subtitle')}
                    </p>
                </div>

                <div className="flex gap-4">
                    <Input
                        placeholder={t('report_id_placeholder')}
                        value={reportId}
                        onChange={(e) => setReportId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        className="max-w-md bg-card"
                    />
                    <Button onClick={handleAnalyze} disabled={loading} className="gradient-primary">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" /> : <Search className="h-4 w-4 ltr:mr-2 rtl:ml-2" />}
                        {loading ? t('analyzing_btn') : t('analyze_btn')}
                    </Button>
                </div>

                {results && results.error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center font-medium">
                        {typeof results.error === 'string' && results.error.startsWith('err_')
                            ? t(results.error as any).replace('{id}', results.params?.id || '')
                            : results.error}
                    </div>
                )}

                {results && results.analysis && (
                    <div className="space-y-4">
                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xl">
                                    <span>{t('results_title').replace('{count}', results.candidatesFound.toString())}</span>
                                    <Badge variant="outline" className="gap-2 py-1.5 px-4 bg-background/50 border-primary/20">
                                        <span className="text-muted-foreground">{t('target_label')}</span>
                                        <span className="font-bold text-primary">{results.report.title}</span>
                                        <Badge variant={results.report.type === 'found' ? 'success' : 'destructive'} className="text-[10px] h-5">
                                            {results.report.type === 'found' ? t('stat_found') : t('stat_lost')}
                                        </Badge>
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                {results.analysis.map((item: any) => (
                                    <div key={item.candidateId} className="flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl hover:bg-muted/40 transition-all duration-300 gap-4 group">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-bold text-lg">{item.candidateTitle}</span>
                                                <Badge className={item.scores.final >= 0.6 ? 'bg-success hover:bg-success text-white px-3' : 'bg-yellow-500 hover:bg-yellow-500 text-white px-3'}>
                                                    {Math.round(item.scores.final * 100)}% {t('match_percentage')}
                                                </Badge>
                                                <Badge variant="outline" className="text-[11px] h-6 bg-background/50">
                                                    {item.candidateStatus}
                                                </Badge>
                                                {!item.categoryMatch && (
                                                    <Badge variant="destructive" className="text-[11px] h-6">{t('category_mismatch')}</Badge>
                                                )}
                                            </div>
                                            <div className="text-[12px] text-muted-foreground mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 bg-muted/20 p-3 rounded-xl border border-muted-foreground/10">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-60">🖼️ {t('match_score_image')}</span>
                                                    <span className="font-semibold text-foreground">{Math.round(item.scores.image * 100)}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-60">📝 {t('match_score_text')}</span>
                                                    <span className="font-semibold text-foreground">{Math.round(item.scores.text * 100)}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-60">📍 {t('match_score_location')}</span>
                                                    <span className="font-semibold text-foreground">{Math.round(item.scores.location * 100)}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-60">📅 {t('TIME_WEIGHT' as any) || 'Time'}</span>
                                                    <span className="font-semibold text-foreground">{Math.round(item.scores.time * 100)}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1 border-l (rtl:border-r ltr:border-l) border-muted-foreground/20 (rtl:pr-3 ltr:pl-3)">
                                                    <span className="text-[10px] uppercase tracking-wider opacity-80 text-primary font-bold">{t('match_score_final')}</span>
                                                    <span className="text-lg font-bold text-primary">{Math.round(item.scores.final * 100)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="gap-2 shrink-0 border-primary/20 hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm"
                                            onClick={async () => {
                                                const lostId = results.report.type === 'lost' ? results.report.id : item.candidateId;
                                                const foundId = results.report.type === 'found' ? results.report.id : item.candidateId;
                                                try {
                                                    const res = await window.forceMatchPair(lostId, foundId);
                                                    if (res) alert(t('force_match_success'));
                                                    else alert(t('force_match_error'));
                                                } catch (e) {
                                                    alert('❌ Error: ' + e);
                                                }
                                            }}
                                        >
                                            <GitCompare className="h-4 w-4" />
                                            {t('force_match_btn')}
                                        </Button>
                                    </div>
                                ))}

                                {results.analysis.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10">
                                        <Bug className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">{t('no_candidates_msg')}</p>
                                    </div>
                                )}

                                <details className="mt-8 group/details">
                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors p-2 flex items-center gap-2 select-none list-none">
                                        <span className="rotate-0 group-open/details:rotate-90 transition-transform">▶</span>
                                        {t('raw_data_toggle')}
                                    </summary>
                                    <div className="mt-2 text-left" dir="ltr">
                                        <pre className="whitespace-pre-wrap text-[10px] bg-slate-950 text-green-400 p-6 rounded-2xl overflow-auto max-h-[400px] border border-slate-800 shadow-inner font-mono">
                                            {JSON.stringify(results, null, 2)}
                                        </pre>
                                    </div>
                                </details>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

// Add this to window type
declare global {
    interface Window {
        debugFindMatches: (id: string) => Promise<any>;
        forceMatchPair: (lostId: string, foundId: string) => Promise<any>;
    }
}
