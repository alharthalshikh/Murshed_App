import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Search,
  MapPin,
  Upload,
  Calendar,
  Tag,
  Palette,
  FileText,
  Sparkles,
  CheckCircle,
  X,
  Loader2,
  Building2,
  Coins,
  Banknote,
  Camera,
  Image as ImageIcon,
  Bell,
  Map as MapIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReportType, ItemCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Report, createReport, updateReport } from '@/services/reportService';
import { LocationPicker } from './LocationPicker';
import {
  shouldAskForNotifications,
  requestNotificationPermission,
  hasUserAcceptedNotifications,
} from '@/services/browserNotificationService';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationKey } from '@/i18n/translations';

const categories: { value: ItemCategory }[] = [
  { value: 'electronics' },
  { value: 'documents' },
  { value: 'jewelry' },
  { value: 'bags' },
  { value: 'keys' },
  { value: 'pets' },
  { value: 'clothing' },
  { value: 'other' },
];

const cities = [
  'sanaa',
  'aden',
  'taiz',
  'hodiedah',
  'ibb',
  'mukalla',
  'dhamar',
  'amran',
  'saada',
  'hajjah',
  'bayda',
  'lahj',
  'mahweet',
  'marib',
  'shabwah',
  'abyan',
  'dhale',
  'raymah',
  'hadramout',
  'socotra',
  'other',
];

interface ReportFormProps {
  initialData?: Report;
}

export function ReportForm({ initialData }: ReportFormProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, resolvedLanguage } = useLanguage();
  const queryClient = useQueryClient();

  const isEditing = !!initialData;
  const initialType = isEditing ? (initialData.type as ReportType) : ((searchParams.get('type') as ReportType) || 'lost');

  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<number>(0); // 0: none, 1: images, 2: analysis, 3: saving

  // States for images
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<ItemCategory | ''>(initialData?.category as ItemCategory || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [distinguishingMarks, setDistinguishingMarks] = useState(initialData?.distinguishing_marks || '');
  const [locationAddress, setLocationAddress] = useState(initialData?.location_address || '');
  const [locationCity, setLocationCity] = useState(initialData?.location_city || '');
  const [locationLat, setLocationLat] = useState<number | undefined>(initialData?.location_lat);
  const [locationLng, setLocationLng] = useState<number | undefined>(initialData?.location_lng);
  const [dateOccurred, setDateOccurred] = useState(initialData?.date_occurred ? new Date(initialData.date_occurred).toISOString().split('T')[0] : '');
  const [rewardAmount, setRewardAmount] = useState(initialData?.reward_amount?.toString() || '');
  const [rewardCurrency, setRewardCurrency] = useState<'YER' | 'USD'>(initialData?.reward_currency || 'YER');
  const [showReward, setShowReward] = useState(Number(initialData?.reward_amount || 0) > 0);
  const [showMap, setShowMap] = useState(false);

  // ... (keeping notifications logic)
  useEffect(() => {
    setNotificationsEnabled(hasUserAcceptedNotifications());
    setShowNotificationPrompt(shouldAskForNotifications());
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationsEnabled(permission === 'granted');
    setShowNotificationPrompt(false);
    if (permission === 'granted') {
      toast.success(t('notif_success_msg'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const totalImages = uploadedFiles.length + existingImages.length;
      const newFiles = Array.from(files).slice(0, 5 - totalImages);
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };

  const removeNewImage = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error(t('err_enter_title'));
      return false;
    }
    if (!category) {
      toast.error(t('err_select_category'));
      return false;
    }
    if (!description.trim()) {
      toast.error(t('err_enter_description'));
      return false;
    }
    if (!locationAddress.trim()) {
      toast.error(t('err_enter_location'));
      return false;
    }
    if (!locationCity) {
      toast.error(t('err_select_city'));
      return false;
    }
    if (!dateOccurred) {
      toast.error(t('err_select_date'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!user) {
      toast.error(t('err_auth_required'));
      navigate('/login');
      return;
    }

    if (user.is_suspended) {
      toast.error(t('err_account_suspended_post'));
      return;
    }

    setIsSubmitting(true);
    setSubmissionStep(1); // Starting upload

    try {
      const reportData = {
        user_id: user.id,
        type: reportType,
        title,
        description,
        category: category as string,
        color: color || undefined,
        distinguishing_marks: distinguishingMarks || undefined,
        date_occurred: dateOccurred,
        location_address: locationAddress,
        location_city: locationCity,
        location_lat: locationLat,
        location_lng: locationLng,
        reward_amount: showReward ? Number(rewardAmount) : 0,
        reward_currency: rewardCurrency,
      };

      let result;
      if (isEditing && initialData) {
        setSubmissionStep(2); // Updating
        result = await updateReport(
          initialData.id,
          user.id,
          reportData,
          uploadedFiles,
          removedImages
        );
      } else {
        // We know images might take time, we can update step if we have files
        if (uploadedFiles.length > 0) setSubmissionStep(1);
        result = await createReport(reportData, uploadedFiles);
      }

      setSubmissionStep(3); // Result ready

      if (result.success) {
        // Invalidate queries to ensure fresh data on next fetch
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'recent_reports'] });
        queryClient.invalidateQueries({ queryKey: ['my_reports'] });

        toast.success(isEditing ? t('success_update_report') : t('success_create_report'));

        // Final UX touch: Short delay before redirect to let user see success state
        setTimeout(() => {
          navigate(isEditing ? `/reports/${initialData?.id}` : '/reports');
        }, 500);
      } else {
        toast.error(result.error || t('error_occurred'));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('خطأ:', error);
      toast.error(t('err_unexpected'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-20 md:pb-0">
      <Card className="border-0 shadow-none md:border md:shadow-sm bg-transparent md:bg-card">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">
            {isEditing ? t('edit_report_title') : t('submit_new_report')}
          </CardTitle>
          <CardDescription>
            {isEditing ? t('edit_report_desc') : t('new_report_desc')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Notification Permission Alert */}
          {showNotificationPrompt && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <Bell className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {t('notif_prompt')}
                </span>
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  className={cn(resolvedLanguage === 'ar' ? "mr-4" : "ml-4")}
                >
                  {t('enable_btn')}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {notificationsEnabled && (
            <div className="mb-4 text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {t('notif_enabled_msg')}
            </div>
          )}

          {/* Report Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <Button
              type="button"
              variant={reportType === 'lost' ? 'default' : 'ghost'}
              className={cn(
                'flex-1 gap-2',
                reportType === 'lost' && 'bg-destructive hover:bg-destructive/90'
              )}
              onClick={() => setReportType('lost')}
            >
              <Search className="h-4 w-4" />
              {t('lost_btn')}
            </Button>
            <Button
              type="button"
              variant={reportType === 'found' ? 'default' : 'ghost'}
              className={cn(
                'flex-1 gap-2',
                reportType === 'found' && 'bg-success hover:bg-success/90'
              )}
              onClick={() => setReportType('found')}
            >
              <MapPin className="h-4 w-4" />
              {t('found_btn')}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {t('report_title_label')}
              </Label>
              <Input
                id="title"
                placeholder={t('report_title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t('item_type_label')}
              </Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('item_type_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {t(`cat_${cat.value}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color" className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                {t('color_label')}
              </Label>
              <Input
                id="color"
                placeholder={t('color_placeholder')}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t('description_label')}
              </Label>
              <Textarea
                id="description"
                placeholder={t('description_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className={cn("min-h-[120px] resize-none", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />
            </div>

            {/* Distinguishing Marks */}
            <div className="space-y-2">
              <Label htmlFor="marks" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('distinguishing_marks_label')}
                <span className="text-xs text-muted-foreground">{t('marks_optional')}</span>
              </Label>
              <Input
                id="marks"
                placeholder={t('marks_placeholder')}
                value={distinguishingMarks}
                onChange={(e) => setDistinguishingMarks(e.target.value)}
                className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                {t('images_label')}
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setIsSourceDialogOpen(true)}
              >
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('upload_hint')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('upload_limit')}
                  </p>
                </div>
              </div>

              {/* Source Selection Dialog */}
              <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('upload_source_title')}</DialogTitle>
                    <DialogDescription>
                      <span className="block mb-1">{t('upload_multi_capture_hint')}</span>
                      <span className="block text-[11px] text-muted-foreground/80 italic border-t pt-1 mt-1">
                        {t('camera_mobile_hint')}
                      </span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                      onClick={() => {
                        document.getElementById('gallery-input')?.click();
                        setIsSourceDialogOpen(false);
                      }}
                    >
                      <ImageIcon className="h-8 w-8 text-primary" />
                      {t('upload_source_gallery')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 flex flex-col gap-2"
                      onClick={() => {
                        document.getElementById('camera-input')?.click();
                        // For camera, we might want to keep capturing if the user wants multiple, 
                        // but standard file input with capture usually closes after one.
                        // We close dialog to let the native UI take over.
                        setIsSourceDialogOpen(false);
                      }}
                    >
                      <Camera className="h-8 w-8 text-primary" />
                      {t('upload_source_camera')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Hidden Inputs */}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="gallery-input"
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                id="camera-input"
              />

              {/* Uploaded & Existing Images Preview */}
              {(previewUrls.length > 0 || existingImages.length > 0) && (
                <div className="flex gap-2 flex-wrap mt-3">
                  {/* Existing Images */}
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`صورة قديمة ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/10 text-[8px] text-center rounded-b-lg">{t('existing_badge')}</div>
                    </div>
                  ))}

                  {/* New Previews */}
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`صورة جديدة ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-success/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-success/10 text-[8px] text-center rounded-b-lg">{t('new_badge')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {t('city_label')}
              </Label>
              <Select value={locationCity} onValueChange={setLocationCity}>
                <SelectTrigger>
                  <SelectValue placeholder={t('city_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {t(`city_${city}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('approx_location_label')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="gap-1 text-xs"
                >
                  <MapIcon className="h-3 w-3" />
                  {showMap ? t('hide_map_btn') : t('show_map_btn')}
                </Button>
              </Label>
              <Input
                id="location"
                placeholder={t('address_placeholder')}
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                required
                className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />

              {/* GPS Indicator */}
              {locationLat && locationLng && (
                <div className="text-xs text-success flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('gps_fixed').replace('{lat}', locationLat.toFixed(4)).replace('{lng}', locationLng.toFixed(4))}
                </div>
              )}

              {/* Map */}
              {showMap && (
                <LocationPicker
                  initialLat={locationLat}
                  initialLng={locationLng}
                  autoGPS={true}
                  onLocationSelect={(loc) => {
                    setLocationLat(loc.lat);
                    setLocationLng(loc.lng);
                    if (loc.address) {
                      setLocationAddress(loc.address);
                      // إذا كانت هناك مدينة مستخلصة في العنوان، حاول مطابقتها مع القائمة
                      const cityMatch = cities.find(c => loc.address?.toLowerCase().includes(t(`city_${c}` as TranslationKey).toLowerCase()));
                      if (cityMatch) setLocationCity(cityMatch);
                    }
                    setShowMap(false);
                  }}
                />
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {reportType === 'lost' ? t('lost_date_label') : t('found_date_label')}
              </Label>
              <Input
                id="date"
                type="date"
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                required
                className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
              />
            </div>

            {/* Reward Section */}
            <div className="space-y-4 pt-2 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <Coins className="h-4 w-4 text-primary" />
                  {t('reward_money')}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{showReward ? t('yes') : t('no')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReward(!showReward)}
                    className={cn("h-7 w-12 p-0 rounded-full", showReward ? "bg-primary text-white" : "bg-muted")}
                  >
                    <div className={cn("h-5 w-5 rounded-full transition-all", showReward ? (resolvedLanguage === 'ar' ? "mr-6 bg-white" : "ml-6 bg-white") : (resolvedLanguage === 'ar' ? "mr-1 bg-muted-foreground" : "ml-1 bg-muted-foreground"))} />
                  </Button>
                </div>
              </div>

              {showReward && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="rewardAmount" className="text-xs">{t('amount_label')}</Label>
                    <Input
                      id="rewardAmount"
                      type="number"
                      placeholder="0.00"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className={cn(resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('currency_label')}</Label>
                    <Select value={rewardCurrency} onValueChange={(v) => setRewardCurrency(v as 'YER' | 'USD')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YER">{t('yer_currency_label')}</SelectItem>
                        <SelectItem value="USD">{t('usd_currency_label')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* AI Notice */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('ai_analysis_title')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('ai_analysis_desc')}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full relative overflow-hidden"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {submissionStep === 1 ? t('uploading_images_btn') :
                        submissionStep === 2 ? t('saving_report_btn') :
                          submissionStep === 3 ? t('finalizing_btn') :
                            t('submitting_btn')}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-500"
                      style={{ width: `${(submissionStep / 3) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {t('submit_btn')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
