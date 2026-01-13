import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import getCroppedImg from '@/lib/cropImage';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
    imageSrc: string | null;
    open: boolean;
    onClose: () => void;
    onCropComplete: (croppedImage: Blob) => void;
}

export default function ImageCropper({
    imageSrc,
    open,
    onClose,
    onCropComplete,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsLoading(true);
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImage) {
                onCropComplete(croppedImage);
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const { t, resolvedLanguage } = useLanguage();
    const isRtl = resolvedLanguage === 'ar';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[90vh] flex flex-col p-0 gap-0 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{t('edit_avatar_title')}</DialogTitle>
                </DialogHeader>

                <div className="relative flex-1 bg-black w-full overflow-hidden">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                            classes={{
                                containerClassName: 'h-full',
                            }}
                        />
                    )}
                </div>

                <div className="p-4 space-y-4 bg-background border-t">
                    <div className="space-y-2">
                        <span className="text-sm font-medium">{t('zoom_label')}</span>
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                        />
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:gap-0">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className={cn("w-4 h-4 animate-spin", isRtl ? "ml-2" : "mr-2")} /> : null}
                            {t('save_photo_btn')}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
