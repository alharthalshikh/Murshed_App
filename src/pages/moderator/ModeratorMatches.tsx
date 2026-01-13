import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeratorLayout } from '@/components/moderator/ModeratorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    getMatchesWithDetails,
    confirmMatch,
    rejectMatch,
    AIMatch
} from '@/services/matchingService';
import {
    GitCompare,
    FileSearch,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeftRight,
    Loader2,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    Eye,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { TranslationKey } from '@/i18n/translations';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ModeratorMatches() {
    const { t, resolvedLanguage } = useLanguage();

    const {
        data: matches = [],
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['moderator', 'matches'],
        queryFn: () => getMatchesWithDetails(),
        staleTime: 1000 * 60,
    });

    const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Deep link handling
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const matchId = urlParams.get('id');
        if (matchId && matches.length > 0) {
            const found = matches.find(m => m.id === matchId);
            if (found) {
                setSelectedMatch(found);
                setIsDetailOpen(true);
            }
        }
    }, [matches]);

    const handleConfirmMatch = async (matchId: string) => {
        setIsProcessing(true);
        try {
            const success = await confirmMatch(matchId);
            if (success) {
                toast.success(t('match_accept_success'));
                refetch();
                setIsDetailOpen(false);
            } else {
                toast.error(t('match_accept_err'));
            }
        } catch (error) {
            console.error('Confirm error:', error);
            toast.error(t('match_generic_err'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectMatch = async (matchId: string) => {
        setIsProcessing(true);
        try {
            const success = await rejectMatch(matchId);
            if (success) {
                toast.success(t('match_reject_success'));
                refetch();
                setIsDetailOpen(false);
            } else {
                toast.error(t('match_reject_err'));
            }
        } catch (error) {
            toast.error(t('match_reject_err'));
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'destructive' | 'success' | 'warning', icon: any, label: string }> = {
            pending: { variant: 'warning', icon: Clock, label: t('match_pending_review') },
            confirmed: { variant: 'success', icon: CheckCircle, label: t('match_confirmed_badge') },
            rejected: { variant: 'destructive', icon: XCircle, label: t('match_rejected_badge') },
        };
        const { variant, icon: Icon, label } = variants[status] || variants.pending;
        return (
            <Badge variant={variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-success';
        if (score >= 0.6) return 'text-warning';
        return 'text-destructive';
    };

    return (
        <ModeratorLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">{t('mgmt_matches_title')}</h1>
                <p className="text-muted-foreground mt-1">{t('mgmt_matches_subtitle')}</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{matches.filter(m => m.status === 'pending').length}</p>
                            <p className="text-sm text-muted-foreground">{t('match_pending_review')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{matches.filter(m => m.status === 'confirmed').length}</p>
                            <p className="text-sm text-muted-foreground">{t('match_confirmed_badge')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <GitCompare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{matches.length}</p>
                            <p className="text-sm text-muted-foreground">{t('match_total_count')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Matches List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-primary" />
                        {t('match_list_title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-xl border">
                                    <div className="flex items-center justify-between mb-4">
                                        <Skeleton className="h-6 w-24 rounded-lg" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                                            <Skeleton className="h-16 w-16 rounded-lg" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-16" />
                                                <Skeleton className="h-4 w-full" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                                            <Skeleton className="h-16 w-16 rounded-lg" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-16" />
                                                <Skeleton className="h-4 w-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t w-full">
                                        <div className="flex gap-2">
                                            <Skeleton className="h-9 w-24 rounded-full" />
                                            <Skeleton className="h-9 w-24 rounded-full" />
                                        </div>
                                        <Skeleton className="h-9 w-28 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-20">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">{t('no_results')}</p>
                            <p className="text-muted-foreground">{t('no_results_desc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                            {new Date(match.created_at).toLocaleDateString(resolvedLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                                        </span>
                                        <div className={`text-2xl font-bold ${getScoreColor(match.final_score)}`}>
                                            {Math.min(100, Math.round(match.final_score * 100))}%
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        {/* Lost Report */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-200/50">
                                            {match.lost_report?.images && match.lost_report.images[0] ? (
                                                <img src={match.lost_report.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                    <FileSearch className="h-6 w-6 text-red-500" />
                                                </div>
                                            )}
                                            <div>
                                                <Badge variant="destructive" className="mb-1">{t('stat_lost')}</Badge>
                                                <p className="font-medium text-sm">{match.lost_report?.title || t('report_not_found')}</p>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <ArrowLeftRight className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>

                                        {/* Found Report */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-200/50">
                                            {match.found_report?.images && match.found_report.images[0] ? (
                                                <img src={match.found_report.images[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                    <MapPin className="h-6 w-6 text-green-500" />
                                                </div>
                                            )}
                                            <div>
                                                <Badge variant="success" className="mb-1">{t('stat_found')}</Badge>
                                                <p className="font-medium text-sm">{match.found_report?.title || t('report_not_found')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions & Status Footer */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t w-full">
                                        <div className="flex items-center gap-2">
                                            {match.status === 'pending' ? (
                                                <>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-success hover:bg-success/90 h-9 px-4 rounded-full font-bold shadow-lg shadow-success/20 transition-all active:scale-95 relative z-10"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleConfirmMatch(match.id);
                                                                }}
                                                                disabled={isProcessing}
                                                            >
                                                                <CheckCircle className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "ml-1" : "mr-1")} />
                                                                {t('match_accept_btn')}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('match_accept_tooltip')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-destructive border-destructive/20 hover:bg-destructive/10 h-9 px-4 rounded-full relative z-10"
                                                                onClick={() => handleRejectMatch(match.id)}
                                                                disabled={isProcessing}
                                                            >
                                                                <ThumbsDown className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "ml-1" : "mr-1")} />
                                                                {t('match_reject_btn')}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('match_reject_tooltip')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                getStatusBadge(match.status)
                                            )}
                                        </div>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/10 h-9 px-4 rounded-full"
                                                    onClick={() => {
                                                        setSelectedMatch(match);
                                                        setIsDetailOpen(true);
                                                    }}
                                                >
                                                    <Eye className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "ml-1" : "mr-1")} />
                                                    {t('view_details_btn')}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('view_report_details_tooltip')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Match Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GitCompare className="h-5 w-5 text-primary" />
                            {t('match_details_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('match_details_subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMatch && (
                        <div className="space-y-6">
                            {/* Score Breakdown */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('match_score_image')}</span>
                                        <span className="font-bold">{Math.min(100, Math.round(selectedMatch.image_score * 100))}%</span>
                                    </div>
                                    <Progress value={selectedMatch.image_score * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('match_score_text')}</span>
                                        <span className="font-bold">{Math.min(100, Math.round(selectedMatch.text_score * 100))}%</span>
                                    </div>
                                    <Progress value={selectedMatch.text_score * 100} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('match_score_location')}</span>
                                        <span className="font-bold">{Math.min(100, Math.round(selectedMatch.location_score * 100))}%</span>
                                    </div>
                                    <Progress value={selectedMatch.location_score * 100} className="h-2" />
                                </div>
                            </div>

                            {/* Final Score */}
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                                <p className="text-sm text-muted-foreground">{t('match_score_final')}</p>
                                <p className={`text-4xl font-bold mt-1 ${getScoreColor(selectedMatch.final_score)}`}>
                                    {Math.min(100, Math.round(selectedMatch.final_score * 100))}%
                                </p>
                            </div>

                            {/* Actions */}
                            {selectedMatch.status === 'pending' && (
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 text-destructive hover:text-destructive"
                                        onClick={() => handleRejectMatch(selectedMatch.id)}
                                        disabled={isProcessing}
                                    >
                                        <ThumbsDown className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "ml-2" : "mr-2")} />
                                        {t('match_reject_btn')}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-success hover:bg-success/90"
                                        onClick={() => handleConfirmMatch(selectedMatch.id)}
                                        disabled={isProcessing}
                                    >
                                        <ThumbsUp className={cn("h-4 w-4", resolvedLanguage === 'ar' ? "ml-2" : "mr-2")} />
                                        {t('match_accept_btn')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </ModeratorLayout>
    );
}
