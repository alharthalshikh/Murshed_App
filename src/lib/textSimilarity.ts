/**
 * خوارزمية تشابه النصوص المتقدمة
 * تدعم العربية والإنجليزية + TF-IDF + Jaccard Similarity
 */

// ==================== Stop Words ====================

const ARABIC_STOP_WORDS = new Set([
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
    'الذي', 'التي', 'الذين', 'اللواتي', 'ما', 'ماذا', 'كيف', 'متى', 'أين',
    'لماذا', 'أن', 'إن', 'كان', 'كانت', 'يكون', 'تكون', 'هو', 'هي', 'هم',
    'نحن', 'أنا', 'أنت', 'أنتم', 'و', 'أو', 'ثم', 'لكن', 'بل', 'حتى',
    'قد', 'لقد', 'سوف', 'لن', 'لم', 'لا', 'نعم', 'كل', 'بعض', 'كلا',
    'بين', 'فوق', 'تحت', 'أمام', 'خلف', 'داخل', 'خارج', 'عند', 'منذ',
    'الى', 'اذا', 'لو', 'او', 'ان', 'كانوا', 'يكونوا', 'هناك', 'هنا',
]);

const ENGLISH_STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
    'at', 'from', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'to', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
    'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those'
]);

const ARABIC_PREFIXES = ['ال', 'و', 'ب', 'ك', 'ل', 'ف'];
const ARABIC_SUFFIXES = ['ة', 'ات', 'ين', 'ون', 'ان', 'ها', 'هم', 'هن', 'ي', 'ك', 'نا'];

/**
 * تنظيف النص (يدعم العربية والإنجليزية)
 */
function cleanText(text: string): string {
    if (!text) return "";

    return text
        // إزالة التشكيل العربي
        .replace(/[\u064B-\u065F]/g, '')
        // تطبيع الألف
        .replace(/[أإآا]/g, 'ا')
        // تطبيع التاء المربوطة
        .replace(/ة/g, 'ه')
        // تطبيع الياء
        .replace(/ى/g, 'ي')
        // تحويل للحروف الصغيرة (للإنجليزية)
        .toLowerCase()
        // استبدال علامات الترقيم بمسافات (للحفاظ على الكلمات منفصلة)
        .replace(/[.,،؛:؟!()[\]{}"']/g, ' ')
        .trim();
}

/**
 * تجذير الكلمة (للعربية فقط)
 */
function stemWord(word: string): string {
    // إذا كانت الكلمة إنجليزية أو قصيرة جداً، لا نغيرها
    if (/[a-z]/.test(word) || word.length < 3) return word;

    let stemmed = word;
    for (const prefix of ARABIC_PREFIXES) {
        if (stemmed.startsWith(prefix) && stemmed.length > prefix.length + 2) {
            stemmed = stemmed.slice(prefix.length);
            break;
        }
    }
    for (const suffix of ARABIC_SUFFIXES) {
        if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
            stemmed = stemmed.slice(0, -suffix.length);
            break;
        }
    }
    return stemmed;
}

/**
 * تقسيم النص إلى كلمات مُعالجة
 */
function tokenize(text: string): string[] {
    const cleaned = cleanText(text);
    const words = cleaned.split(/\s+/).filter(w => w.length >= 1);

    return words
        .filter(word => !ARABIC_STOP_WORDS.has(word) && !ENGLISH_STOP_WORDS.has(word))
        .map(word => stemWord(word))
        .filter(word => word.length >= 1);
}

// ==================== TF-IDF Implementation ====================

function calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const total = tokens.length;
    if (total === 0) return tf;

    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
    }

    for (const [token, count] of tf) {
        tf.set(token, count / total);
    }
    return tf;
}

function calculateTFIDF(tokens1: string[], tokens2: string[]): { vec1: Map<string, number>; vec2: Map<string, number> } {
    const tf1 = calculateTF(tokens1);
    const tf2 = calculateTF(tokens2);
    const allTokens = new Set([...tokens1, ...tokens2]);

    const vec1 = new Map<string, number>();
    const vec2 = new Map<string, number>();

    for (const token of allTokens) {
        const df = (tokens1.includes(token) ? 1 : 0) + (tokens2.includes(token) ? 1 : 0);
        const idf = Math.log(2 / df) + 1;
        vec1.set(token, (tf1.get(token) || 0) * idf);
        vec2.set(token, (tf2.get(token) || 0) * idf);
    }
    return { vec1, vec2 };
}

function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    const allKeys = new Set([...vec1.keys(), ...vec2.keys()]);

    for (const key of allKeys) {
        const v1 = vec1.get(key) || 0;
        const v2 = vec2.get(key) || 0;
        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    }
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// ==================== Jaccard Similarity ====================

function jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

// ==================== N-gram Similarity ====================

function createNGrams(text: string, n: number): Set<string> {
    const ngrams = new Set<string>();
    const cleaned = cleanText(text).replace(/\s+/g, '');
    for (let i = 0; i <= cleaned.length - n; i++) {
        ngrams.add(cleaned.slice(i, i + n));
    }
    return ngrams;
}

function ngramSimilarity(text1: string, text2: string, n = 3): number {
    const ngrams1 = createNGrams(text1, n);
    const ngrams2 = createNGrams(text2, n);
    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

// ==================== Main Text Similarity Function ====================

export interface TextSimilarityResult {
    overall: number;
    tfidf: number;
    jaccard: number;
    ngram: number;
    exactMatch: boolean;
}

export function calculateTextSimilarity(text1: string, text2: string): TextSimilarityResult {
    if (!text1 || !text2) {
        return { overall: 0, tfidf: 0, jaccard: 0, ngram: 0, exactMatch: false };
    }

    if (cleanText(text1) === cleanText(text2)) {
        return { overall: 1, tfidf: 1, jaccard: 1, ngram: 1, exactMatch: true };
    }

    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);

    const { vec1, vec2 } = calculateTFIDF(tokens1, tokens2);
    const tfidf = cosineSimilarity(vec1, vec2);
    const jaccard = jaccardSimilarity(tokens1, tokens2);
    const ngram = ngramSimilarity(text1, text2, 3); // Changed to trigrams for better English accuracy

    // Improved weighting: TF-IDF is king for context, ngram captures small variations
    const overall = tfidf * 0.45 + jaccard * 0.25 + ngram * 0.3;

    return {
        overall: Math.round(overall * 100) / 100,
        tfidf: Math.round(tfidf * 100) / 100,
        jaccard: Math.round(jaccard * 100) / 100,
        ngram: Math.round(ngram * 100) / 100,
        exactMatch: false,
    };
}

/**
 * مقارنة سمات متعددة
 */
export function compareAttributes(
    item1: { title: string; description: string; color?: string; marks?: string; category: string },
    item2: { title: string; description: string; color?: string; marks?: string; category: string }
): number {
    // تشابه العنوان (وزن 30%)
    const titleSim = calculateTextSimilarity(item1.title, item2.title).overall;

    // تشابه الوصف (وزن 40%)
    const descSim = calculateTextSimilarity(item1.description, item2.description).overall;

    // تشابه اللون (وزن 15%)
    let colorSim = 0;
    if (item1.color && item2.color) {
        colorSim = calculateTextSimilarity(item1.color, item2.color).overall;
    }

    // تشابه العلامات المميزة (وزن 10%)
    let marksSim = 0;
    if (item1.marks && item2.marks) {
        marksSim = calculateTextSimilarity(item1.marks, item2.marks).overall;
    }

    // تطابق الفئة (وزن 5%)
    const categorySim = item1.category === item2.category ? 1 : 0;

    const total =
        titleSim * 0.30 +
        descSim * 0.40 +
        colorSim * 0.15 +
        marksSim * 0.10 +
        categorySim * 0.05;

    return Math.round(total * 100) / 100;
}
