const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
    rawResponse?: string;
}

export interface UploadMultipleResult {
    success: boolean;
    urls: string[];
    errors: string[];
    rawResponses?: string[];
}

import { compressImage } from '@/lib/imageCompression';

export async function uploadImage(file: File): Promise<UploadResult> {
    try {
        console.log(`📸 Processing image for local storage: ${file.name}`);

        // ضغط الصورة قبل التحويل
        const compressedFile = await compressImage(file);

        // تحويل الصورة المضغوطة إلى Base64
        const base64 = await fileToBase64(compressedFile);

        // للصور الكبيرة، قد نرغب في تصغيرها هنا مستقبلاً،
        // ولكن حالياً سنخزنها مباشرة في قاعدة البيانات كمصفوفة نصية نصية
        // تم إضافة الضغط الآن!

        console.log('✅ Image converted successfully for direct storage');

        return {
            success: true,
            url: base64, // الرابط الآن هو البيانات نفسها (Data URI)
            rawResponse: JSON.stringify({ type: 'local_base64', size: compressedFile.size })
        };
    } catch (error) {
        console.error('❌ Error processing image:', error);
        return {
            success: false,
            error: 'err_image_processing',
        };
    }
}

/**
 * رفع عدة صور إلى ImgBB
 */
export async function uploadMultipleImages(files: File[]): Promise<UploadMultipleResult> {
    const urls: string[] = [];
    const errors: string[] = [];
    const rawResponses: string[] = [];

    for (const file of files) {
        const result = await uploadImage(file);
        if (result.success && result.url) {
            urls.push(result.url);
            if (result.rawResponse) rawResponses.push(result.rawResponse);
        } else {
            errors.push(result.error || 'err_unexpected');
        }
    }

    return {
        success: errors.length === 0,
        urls,
        errors,
        rawResponses
    };
}

/**
 * تحويل ملف إلى Base64
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * رفع صورة من URL
 */
export async function uploadImageFromUrl(imageUrl: string): Promise<UploadResult> {
    try {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', imageUrl);

        const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                url: data.data.url,
            };
        } else {
            return {
                success: false,
                error: 'err_image_upload',
            };
        }
    } catch (error) {
        console.error('Error uploading image from URL:', error);
        return {
            success: false,
            error: 'err_image_upload_url',
        };
    }
}
