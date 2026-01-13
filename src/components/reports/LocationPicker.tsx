import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Navigation,
    Search,
    Loader2,
    Check,
    Target,
    Maximize2,
    Minimize2,
    ExternalLink,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Map as MapIcon
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';
import { cn } from '@/lib/utils';

// إصلاح أيقونة Leaflet الافتراضية
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// مكون مساعد للتحكم في الخريطة وتفاعل النقرات
function MapEvents({ onClick, center, zoom }: { onClick: (lat: number, lng: number) => void, center: [number, number], zoom: number }) {
    const map = useMap();

    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        map.setView(center, zoom);
        // تأخير بسيط للتأكد من أن الحاوية أخذت حجمها النهائي
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [center, zoom, map]);

    return null;
}

interface LocationPickerProps {
    onLocationSelect: (location: {
        lat: number;
        lng: number;
        address?: string;
    }) => void;
    initialLat?: number;
    initialLng?: number;
    autoGPS?: boolean;
}

// إحداثيات المدن اليمنية
const YEMEN_CITIES: Record<string, { lat: number; lng: number }> = {
    'sanaa': { lat: 15.3694, lng: 44.1910 },
    'aden': { lat: 12.7855, lng: 45.0187 },
    'taiz': { lat: 13.5789, lng: 44.0219 },
    'hodiedah': { lat: 14.7979, lng: 42.9540 },
    'ibb': { lat: 13.9759, lng: 44.1709 },
    'mukalla': { lat: 14.5422, lng: 49.1255 },
    'dhamar': { lat: 14.5425, lng: 44.4019 },
    'amran': { lat: 15.6594, lng: 43.9439 },
    'saada': { lat: 16.9400, lng: 43.7600 },
    'hajjah': { lat: 15.6914, lng: 43.6031 },
    'bayda': { lat: 13.9870, lng: 45.5700 },
    'lahj': { lat: 13.0570, lng: 44.8871 },
    'marib': { lat: 15.4681, lng: 45.3220 },
    'shabwah': { lat: 14.7722, lng: 47.0122 },
};

export function LocationPicker({ onLocationSelect, initialLat, initialLng, autoGPS = false }: LocationPickerProps) {
    const [lat, setLat] = useState<number>(initialLat || 15.3694);
    const [lng, setLng] = useState<number>(initialLng || 44.1910);
    const [zoom, setZoom] = useState(15);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { t, resolvedLanguage } = useLanguage();
    const [hasAttemptedAutoGPS, setHasAttemptedAutoGPS] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    // جلب العنوان من الإحداثيات (Reverse Geocoding)
    const fetchAddress = async (newLat: number, newLng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=${resolvedLanguage === 'ar' ? 'ar' : 'en'}`
            );
            const data = await response.json();
            if (data && data.address) {
                // استخراج المكونات لتحسين الدقة
                const addr = data.address;
                const road = addr.road || addr.suburb || addr.neighbourhood || '';
                const city = addr.city || addr.town || addr.village || '';
                const state = addr.state || ''; // Governorate in Yemen

                let simplified = '';
                const parts = [];
                if (road) parts.push(road);
                if (city) parts.push(city);
                if (state && !city.includes(state)) parts.push(state); // إضافة المحافظة إذا لم تكن موجودة في اسم المدينة

                simplified = parts.join(', ') || data.display_name;

                setSearchQuery(simplified);
                return simplified;
            }
        } catch (error) {
            console.warn('⚠️ فشل جلب العنوان من الخريطة:', error);
        }
        return null;
    };

    // فلترة المدن
    const filteredCities = Object.keys(YEMEN_CITIES).filter(cityKey => {
        const translatedCity = t(`city_${cityKey}` as TranslationKey).toLowerCase();
        return translatedCity.includes(searchQuery.toLowerCase()) || cityKey.includes(searchQuery);
    });

    // الحصول على الموقع الحالي بـ GPS
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error(t('browser_no_gps'));
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                setLat(newLat);
                setLng(newLng);

                // تحسين مستوى التقريب بناءً على الدقة
                if (accuracy < 100) setZoom(18);
                else if (accuracy < 500) setZoom(16);
                else setZoom(14);

                setIsConfirmed(false);

                if (accuracy > 500) {
                    toast.warning(t('gps_accuracy_warning').replace('{accuracy}', Math.round(accuracy).toString()));
                } else {
                    toast.success(t('gps_success'));
                }

                setIsLoading(false);
                fetchAddress(newLat, newLng);
            },
            (error) => {
                let errorMsg = t('gps_failed');
                if (error.code === 1) errorMsg = t('gps_permission_denied');
                else if (error.code === 2) errorMsg = t('gps_unavailable');
                toast.error(errorMsg);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }, [t]);

    // تشغيل GPS تلقائياً إذا طلب البلاغ ذلك
    useEffect(() => {
        if (autoGPS && !initialLat && !initialLng && !hasAttemptedAutoGPS) {
            setHasAttemptedAutoGPS(true);
            getCurrentLocation();
        }
    }, [autoGPS, initialLat, initialLng, hasAttemptedAutoGPS, getCurrentLocation]);

    // تحديث العنوان تلقائياً عند تغيير الإحداثيات (بانتظار استقرار الموقع لثانية واحدة)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isConfirmed) {
                fetchAddress(lat, lng);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [lat, lng, isConfirmed]);

    // اختيار مدينة
    const selectCity = async (cityName: string) => {
        const city = YEMEN_CITIES[cityName];
        if (city) {
            setLat(city.lat);
            setLng(city.lng);
            setZoom(14);
            const translatedName = t(`city_${cityName}` as TranslationKey);
            setSearchQuery(translatedName);
            setShowSuggestions(false);
            setIsConfirmed(false);
            // جلب تفاصيل أكثر للمدينة
            fetchAddress(city.lat, city.lng);
        }
    };

    // تأكيد الموقع
    const confirmLocation = async () => {
        setIsLoading(true);
        // محاولة جلب العنوان الأخير إذا لم يكن موجوداً
        let finalAddress = searchQuery;
        if (!finalAddress || finalAddress.includes('°')) {
            const fetched = await fetchAddress(lat, lng);
            if (fetched) finalAddress = fetched;
        }

        onLocationSelect({ lat, lng, address: finalAddress || undefined });
        setIsConfirmed(true);
        setIsLoading(false);
        toast.success(t('confirm_location_success'));
    };

    // تقريب/إبعاد الخريطة
    const zoomIn = () => setZoom(prev => Math.min(prev + 1, 19));
    const zoomOut = () => setZoom(prev => Math.max(prev - 1, 5));

    // رابط خرائط جوجل للتأكد الخارجي
    const openInGoogleMaps = () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    };

    // تحريك الموقع بالأسهم (للدقة العالية لمن يفضلها)
    const moveLocation = (direction: 'up' | 'down' | 'left' | 'right') => {
        const step = 0.0001 / (zoom / 15); // خطوة صغيرة جداً
        setIsConfirmed(false);
        let newLat = lat;
        let newLng = lng;
        switch (direction) {
            case 'up': newLat += step; break;
            case 'down': newLat -= step; break;
            case 'left': newLng -= step; break;
            case 'right': newLng += step; break;
        }
        setLat(newLat);
        setLng(newLng);
    };

    const handleMapClick = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);
        setIsConfirmed(false);
        fetchAddress(newLat, newLng);
    };

    const MapView = ({ isFull }: { isFull?: boolean }) => (
        <div className={cn("relative w-full h-full", !isFull && "h-56")}>
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} />
                <MapEvents onClick={handleMapClick} center={[lat, lng]} zoom={zoom} />
            </MapContainer>

            {/* Target overlay if needed, or stick to Marker */}
            {/* أزرار التحكم في الحركة (للدقة العالية) */}
            <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1 pointer-events-auto">
                <div className="flex justify-center">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveLocation('up')}>
                        <ChevronUp className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveLocation('left')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveLocation('down')}>
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => moveLocation('right')}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* أزرار التكبير */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md font-bold" onClick={zoomIn}>+</Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md font-bold" onClick={zoomOut}>-</Button>
            </div>

            <div className="absolute top-4 left-4 z-[1000] bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] shadow-sm pointer-events-none">
                {t('move_map_hint')}
            </div>
        </div>
    );

    return (
        <Card className="overflow-hidden border-2 border-primary/20">
            <CardContent className="p-0">
                {/* البحث */}
                <div className="p-3 border-b bg-muted/30">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", resolvedLanguage === 'ar' ? "right-3" : "left-3")} />
                            <Input
                                placeholder={t('search_city_placeholder')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className={cn(resolvedLanguage === 'ar' ? "pr-10" : "pl-10")}
                            />

                            {showSuggestions && filteredCities.length > 0 && (
                                <div className="absolute top-full right-0 left-0 z-50 mt-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-auto">
                                    {filteredCities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => selectCity(city)}
                                            className={cn("w-full px-3 py-2 text-sm hover:bg-primary/10 flex items-center gap-2", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                                        >
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {t(`city_${city}` as TranslationKey)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={getCurrentLocation}
                            disabled={isLoading}
                            title={t('my_location_title')}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Navigation className="h-4 w-4" />
                            )}
                        </Button>

                        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    title={t('fullscreen_map_btn')}
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
                                <DialogHeader className="p-4 border-b bg-muted/30">
                                    <DialogTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            {t('select_this_location')}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={openInGoogleMaps} className="gap-2">
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="hidden sm:inline">{t('open_google_maps_btn')}</span>
                                            </Button>
                                        </div>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 relative bg-muted min-h-0">
                                    {isFullscreen && <MapView isFull={true} />}
                                </div>
                                <div className="p-4 border-t bg-background flex flex-col gap-3">
                                    <div className="bg-muted/50 p-2 rounded-lg text-sm flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                                        <span className="truncate">{searchQuery}</span>
                                    </div>
                                    <Button onClick={() => { confirmLocation(); setIsFullscreen(false); }} className="w-full py-6 text-lg">
                                        {t('confirm_location_btn')}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* الخريطة */}
                {!isFullscreen && <MapView />}

                {/* الإحداثيات والتأكيد */}
                <div className="p-3 border-t bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                            {lat.toFixed(5)}, {lng.toFixed(5)}
                        </span>
                        {isConfirmed && (
                            <Badge variant="success" className="gap-1 text-xs">
                                <Check className="h-3 w-3" />
                                {t('location_confirmed_badge')}
                            </Badge>
                        )}
                    </div>

                    <Button
                        onClick={confirmLocation}
                        className={`w-full gap-2 ${isConfirmed ? 'bg-success hover:bg-success/90' : ''}`}
                        size="sm"
                    >
                        {isConfirmed ? (
                            <>
                                <Check className="h-4 w-4" />
                                {t('location_confirmed_btn')}
                            </>
                        ) : (
                            <>
                                <MapPin className="h-4 w-4" />
                                {t('confirm_location_btn')}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
