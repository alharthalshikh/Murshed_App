import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
            toast.success('جاري تثبيت التطبيق...');
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <Card className="border-primary/20 shadow-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <Download className="h-4 w-4 text-primary" />
                                </span>
                                تثبيت تطبيق مُرشد
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                قم بتثبيت التطبيق للحصول على تجربة أفضل وإشعارات فورية وسرعة أعلى.
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleInstallClick} className="w-full">
                                    تثبيت الآن
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowPrompt(false)}
                                >
                                    لاحقاً
                                </Button>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
