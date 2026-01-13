/**
 * خوارزمية تشابه الصور المتقدمة
 * تستخدم Perceptual Hash (pHash) وColor Histogram
 */

// ==================== Perceptual Hash (pHash) ====================

/**
 * تحميل صورة وتحويلها إلى ImageData
 */
async function loadImage(url: string): Promise<ImageData | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(null);
                return;
            }

            // تصغير الصورة لـ 32x32 للـ pHash
            canvas.width = 32;
            canvas.height = 32;
            ctx.drawImage(img, 0, 0, 32, 32);

            resolve(ctx.getImageData(0, 0, 32, 32));
        };

        img.onerror = () => {
            console.error('خطأ في تحميل الصورة:', url);
            resolve(null);
        };

        img.src = url;
    });
}

/**
 * تحويل الصورة إلى grayscale
 */
function toGrayscale(imageData: ImageData): number[] {
    const gray: number[] = [];
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
        // استخدام معادلة Luminosity للحصول على grayscale
        const grayValue = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        gray.push(grayValue);
    }

    return gray;
}

/**
 * تطبيق DCT (Discrete Cosine Transform) مبسط
 */
function simpleDCT(matrix: number[], size: number): number[] {
    const dct: number[] = [];

    for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
            let sum = 0;
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const idx = i * size + j;
                    sum += matrix[idx] *
                        Math.cos((2 * i + 1) * u * Math.PI / (2 * size)) *
                        Math.cos((2 * j + 1) * v * Math.PI / (2 * size));
                }
            }

            const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
            const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
            dct.push(cu * cv * sum * 2 / size);
        }
    }

    return dct;
}

/**
 * حساب pHash للصورة
 */
export async function calculatePHash(imageUrl: string): Promise<string | null> {
    try {
        const imageData = await loadImage(imageUrl);
        if (!imageData) return null;

        // تحويل إلى grayscale
        const gray = toGrayscale(imageData);

        // تطبيق DCT
        const dct = simpleDCT(gray, 32);

        // أخذ أول 64 قيمة (8x8) بعد القيمة الأولى
        const dctLowFreq = dct.slice(1, 65);

        // حساب المتوسط
        const avg = dctLowFreq.reduce((a, b) => a + b, 0) / dctLowFreq.length;

        // إنشاء البصمة (hash)
        let hash = '';
        for (const val of dctLowFreq) {
            hash += val > avg ? '1' : '0';
        }

        return hash;
    } catch (error) {
        console.error('خطأ في حساب pHash:', error);
        return null;
    }
}

/**
 * حساب مسافة Hamming بين بصمتين
 */
export function hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) return 64; // أقصى مسافة

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) distance++;
    }

    return distance;
}

/**
 * تحويل مسافة Hamming إلى نسبة تشابه
 */
export function hashSimilarity(hash1: string, hash2: string): number {
    const distance = hammingDistance(hash1, hash2);
    return 1 - distance / 64;
}

// ==================== Color Histogram ====================

/**
 * حساب Color Histogram للصورة
 */
async function calculateColorHistogram(imageUrl: string): Promise<number[] | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(null);
                return;
            }

            // تصغير لـ 64x64 للسرعة
            canvas.width = 64;
            canvas.height = 64;
            ctx.drawImage(img, 0, 0, 64, 64);

            const imageData = ctx.getImageData(0, 0, 64, 64);
            const { data } = imageData;

            // Histogram لكل قناة لون (8 bins لكل قناة)
            const bins = 8;
            const histR = new Array(bins).fill(0);
            const histG = new Array(bins).fill(0);
            const histB = new Array(bins).fill(0);

            for (let i = 0; i < data.length; i += 4) {
                const binR = Math.floor(data[i] / 32);
                const binG = Math.floor(data[i + 1] / 32);
                const binB = Math.floor(data[i + 2] / 32);

                histR[binR]++;
                histG[binG]++;
                histB[binB]++;
            }

            // تطبيع
            const total = 64 * 64;
            const histogram = [
                ...histR.map(v => v / total),
                ...histG.map(v => v / total),
                ...histB.map(v => v / total),
            ];

            resolve(histogram);
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}

/**
 * حساب تشابه الـ Histogram باستخدام Cosine Similarity
 */
function histogramSimilarity(hist1: number[], hist2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < hist1.length; i++) {
        dotProduct += hist1[i] * hist2[i];
        norm1 += hist1[i] * hist1[i];
        norm2 += hist2[i] * hist2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// ==================== Average Hash (aHash) - Simpler Alternative ====================

/**
 * حساب aHash (بسيط وسريع)
 */
export async function calculateAHash(imageUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(null);
                return;
            }

            // تصغير لـ 8x8
            canvas.width = 8;
            canvas.height = 8;
            ctx.drawImage(img, 0, 0, 8, 8);

            const imageData = ctx.getImageData(0, 0, 8, 8);
            const { data } = imageData;

            // تحويل إلى grayscale وحساب المتوسط
            const gray: number[] = [];
            for (let i = 0; i < data.length; i += 4) {
                gray.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            }

            const avg = gray.reduce((a, b) => a + b, 0) / gray.length;

            // إنشاء البصمة
            let hash = '';
            for (const val of gray) {
                hash += val > avg ? '1' : '0';
            }

            resolve(hash);
        };

        img.onerror = () => resolve(null);
        img.src = imageUrl;
    });
}

// ==================== Main Image Similarity Function ====================

export interface ImageSimilarityResult {
    overall: number;
    pHashScore: number;
    colorScore: number;
    hasImages: boolean;
}

/**
 * حساب التشابه بين صورتين
 */
export async function calculateImageSimilarity(
    imageUrl1: string,
    imageUrl2: string
): Promise<ImageSimilarityResult> {
    if (!imageUrl1 || !imageUrl2) {
        return { overall: 0, pHashScore: 0, colorScore: 0, hasImages: false };
    }

    // Short-circuit: If URLs are identical, it's a perfect match
    if (imageUrl1 === imageUrl2) {
        return { overall: 1, pHashScore: 1, colorScore: 1, hasImages: true };
    }

    try {
        // حساب pHash لكلا الصورتين (نستخدم aHash لأنه أسرع)
        const [hash1, hash2, hist1, hist2] = await Promise.all([
            calculateAHash(imageUrl1),
            calculateAHash(imageUrl2),
            calculateColorHistogram(imageUrl1),
            calculateColorHistogram(imageUrl2),
        ]);

        // حساب تشابه pHash
        let pHashScore = 0;
        if (hash1 && hash2) {
            pHashScore = hashSimilarity(hash1, hash2);
        }

        // حساب تشابه الألوان
        let colorScore = 0;
        if (hist1 && hist2) {
            colorScore = histogramSimilarity(hist1, hist2);
        }

        // الدرجة الإجمالية
        const overall = pHashScore * 0.6 + colorScore * 0.4;

        return {
            overall: Math.round(overall * 100) / 100,
            pHashScore: Math.round(pHashScore * 100) / 100,
            colorScore: Math.round(colorScore * 100) / 100,
            hasImages: true,
        };
    } catch (error) {
        console.error('خطأ في حساب تشابه الصور:', error);
        return { overall: 0, pHashScore: 0, colorScore: 0, hasImages: false };
    }
}

/**
 * مقارنة مجموعات صور
 */
export async function compareImageSets(
    images1: string[],
    images2: string[]
): Promise<number> {
    if (!images1.length || !images2.length) return 0;

    let maxScore = 0;

    // مقارنة كل صورة من المجموعة الأولى مع كل صورة من الثانية
    for (const img1 of images1.slice(0, 3)) { // أول 3 صور فقط للسرعة
        for (const img2 of images2.slice(0, 3)) {
            const result = await calculateImageSimilarity(img1, img2);
            maxScore = Math.max(maxScore, result.overall);
        }
    }

    return maxScore;
}
