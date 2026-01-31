import { sql } from '@/lib/db';
import { calculateTextSimilarity, compareAttributes } from '@/lib/textSimilarity';
import { compareImageSets } from '@/lib/imageSimilarity';
import {
    notifyAdminsOfMatch,
    notifyUserOfConfirmedMatch,
    notifyUserOfStatusChange
} from './notificationService';

// ==================== Types ====================

export interface Report {
    id: string;
    user_id: string;
    type: 'lost' | 'found';
    title: string;
    description: string;
    category: string;
    color?: string;
    distinguishing_marks?: string;
    date_occurred: string;
    location_address?: string;
    location_city?: string;
    location_lat?: number;
    location_lng?: number;
    status: string;
    images?: string[];
    image_descriptions?: string[];
    user_name?: string;
    user_email?: string;
}

export interface AIMatch {
    id: string;
    lost_report_id: string;
    found_report_id: string;
    image_score: number;
    text_score: number;
    location_score: number;
    time_score: number;
    final_score: number;
    status: 'pending' | 'confirmed' | 'rejected';
    created_at: string;
    updated_at: string;
    // Joined data
    lost_report?: Report & { image_descriptions?: string[] };
    found_report?: Report & { image_descriptions?: string[] };
}

// ==================== Matching Algorithm Settings ====================

const MATCH_SETTINGS = {
    // أوزان الخوارزمية (المتوسط المرجح)
    TEXT_WEIGHT: 0.20,      // وزن تشابه النص والوصف والعلامات المميزة
    LOCATION_WEIGHT: 0.20,  // وزن تشابه الموقع (GPS + المدينة)
    TIME_WEIGHT: 0.10,      // وزن قرب التاريخ
    IMAGE_WEIGHT: 0.50,     // وزن تشابه وصف الصور (AI Description)

    // العتبات
    MIN_THRESHOLD: 0.60,    // الحد الأدنى للتطابق (تم الرفع بناءً على طلب المستخدم)
    HIGH_THRESHOLD: 0.85,   // تطابق عالي

    // إعدادات
    MAX_DATE_DIFF_DAYS: 45, // أقصى فرق بالأيام
    MAX_DISTANCE_KM: 50,    // أقصى مسافة بالكيلومتر للتطابق العالي
};

const AI_SERVICE_URL = 'http://localhost:8000/api/v1';

//Helper to convert Data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

async function getFileFromUrl(url: string, filename: string): Promise<File> {
    if (url.startsWith('data:')) {
        const blob = dataURItoBlob(url);
        return new File([blob], filename, { type: blob.type });
    } else {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type });
    }
}

/**
 * البحث عن تطابقات باستخدام خدمة الذكاء الاصطناعي (Python Microservice)
 */
async function findMatchesWithPythonService(report: Report): Promise<AIMatch[]> {
    try {
        if (!report.images || report.images.length === 0) {
            console.log('⚠️ لا توجد صور للبلاغ لاستخدام خدمة الذكاء الاصطناعي');
            return [];
        }

        // استخدام الصورة الأولى فقط للتطابق
        const imageUrl = report.images[0];
        const imageFile = await getFileFromUrl(imageUrl, 'query_image.jpg');

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('text_description',
            `${report.title} ${report.description} ${report.distinguishing_marks || ''} ${report.color || ''}`
        );
        formData.append('lat', (report.location_lat || 0).toString());
        formData.append('lng', (report.location_lng || 0).toString());
        // Category filter is optional but good for speed
        formData.append('category_filter', report.category);

        // 1. استدعاء خدمة المطابقة /match
        console.log('📡 الاتصال بخدمة الذكاء الاصطناعي (Match)...');
        const matchResponse = await fetch(`${AI_SERVICE_URL}/match`, {
            method: 'POST',
            body: formData, // fetch handles Content-Type for FormData
        });

        if (!matchResponse.ok) {
            console.error('❌ Python Service Match Error:', await matchResponse.text());
            return [];
        }

        const matchResult = await matchResponse.json();
        console.log(`✅ تم العثور على ${matchResult.matches.length} نتيجة من خدمة AI`);

        // 2. استدعاء خدمة التخزين /ingest (لإضافة البلاغ الحالي للفهرس للمستقبل)
        const ingestFormData = new FormData();
        ingestFormData.append('item_id', report.id);
        ingestFormData.append('image', imageFile);
        ingestFormData.append('text_description',
            `${report.title} ${report.description} ${report.distinguishing_marks || ''} ${report.color || ''}`
        );
        ingestFormData.append('lat', (report.location_lat || 0).toString());
        ingestFormData.append('lng', (report.location_lng || 0).toString());
        ingestFormData.append('category', report.category);

        console.log('📥 الاتصال بخدمة الذكاء الاصطناعي (Ingest)...');
        // لا ننتظر النتيجة (Fire & Forget) لتسريع الاستجابة
        fetch(`${AI_SERVICE_URL}/ingest`, { method: 'POST', body: ingestFormData })
            .catch(err => console.error('Ingest Error:', err));


        // 3. تحويل النتائج إلى تنسيق AIMatch
        const matches: AIMatch[] = [];

        for (const pyMatch of matchResult.matches) {
            // تحديد من المفقود ومن الموجود
            // if current report is 'lost', query was lost, match is 'found' (item_id)
            // if current report is 'found', query was found, match is 'lost' (item_id)

            // ملاحظة: خدمة Python ترجع item_id للبلاغ المطابق.
            // يجب أن نتأكد في قاعدة البيانات أن البلاغ المطابق هو من النوع المعاكس
            // (الخدمة حاليا ترشح بالفئة لكن لا ترشح بالنوع Lost/Found صراحة في الاستعلام البصري، 
            //  لكن logic التطبيق يفرض ذلك. سنفترض أن النتائج منطقية أو نفلترها)

            const candidateId = pyMatch.item_id;

            // تجاهل التطابق مع النفس
            if (candidateId === report.id) continue;

            // جلب بيانات المرشح للتأكد من النوع (Lost vs Found) والفئة
            const candidates = await sql`
                SELECT id, type, category FROM reports WHERE id = ${candidateId}
            `;

            if (candidates.length === 0) continue;
            const candidateInfo = candidates[0];

            // يجب أن يكون النوع معاكساً (مفقود مقابل موجود)
            if (candidateInfo.type === report.type) {
                console.log(`⏩ تجاهل تطابق من نفس النوع (${report.type}) للبلاغ ${candidateId}`);
                continue;
            }

            const match: AIMatch = {
                id: crypto.randomUUID(),
                lost_report_id: report.type === 'lost' ? report.id : candidateId,
                found_report_id: report.type === 'found' ? report.id : candidateId,
                image_score: pyMatch.breakdown.visual_similarity,
                text_score: pyMatch.breakdown.text_similarity,
                location_score: pyMatch.breakdown.location_score,
                time_score: pyMatch.breakdown.time_score || 0,
                final_score: pyMatch.final_score,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            matches.push(match);
        }

        return matches;

    } catch (error) {
        console.error('❌ خطأ في الاتصال بخدمة الذكاء الاصطناعي:', error);
        return []; // Fallback empty
    }
}

/**
 * حساب نقاط الموقع بناءً على المدينة والإحداثيات
 */
function calculateLocationScore(r1: Report, r2: Report): number {
    // 1. إذا كانت المدن مختلفة، نخفض النقاط بشكل كبير
    if (r1.location_city && r2.location_city && r1.location_city !== r2.location_city) {
        return 0.1;
    }

    // 2. إذا كانت هناك إحداثيات، نحسب المسافة
    if (r1.location_lat && r1.location_lng && r2.location_lat && r2.location_lng) {
        const dist = calculateDistance(
            r1.location_lat, r1.location_lng,
            r2.location_lat, r2.location_lng
        );

        if (dist <= 1) return 1.0;
        if (dist <= 5) return 0.8;
        if (dist <= 15) return 0.5;
        if (dist <= 50) return 0.2;
        return 0;
    }

    // 3. إذا كانت نفس المدينة ولكن لا توجد إحداثيات
    if (r1.location_city && r1.location_city === r2.location_city) {
        return 0.7;
    }

    return 0.4;
}

/**
 * حساب المسافة بين نقطتين (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * حساب نقاط الوقت بناءً على فرق التاريخ
 */
function calculateTimeScore(r1: Report, r2: Report): number {
    const d1 = new Date(r1.date_occurred);
    const d2 = new Date(r2.date_occurred);
    const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) return 1.0;
    if (diffDays <= 7) return 0.8;
    if (diffDays <= 15) return 0.5;
    if (diffDays <= 30) return 0.2;
    return 0;
}

/**
 * البحث عن تطابقات محلياً كبديل لخدمة Python
 */
async function findMatchesLocally(report: Report): Promise<AIMatch[]> {
    try {
        console.log('🏠 تشغيل خوارزمية التطابق المحلية...');

        const competitorType = report.type === 'lost' ? 'found' : 'lost';
        const candidates = await sql`
            SELECT r.*, 
                ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
            FROM reports r
            WHERE r.type = ${competitorType}
            AND r.status IN ('pending', 'processing')
            AND r.id != ${report.id}
        `;

        const matches: AIMatch[] = [];

        for (const candidate of candidates as any[]) {
            // تصفية أولية حسب الفئة
            if (candidate.category !== report.category) continue;

            // 1. تشابه النص (25%)
            const textScore = compareAttributes(
                {
                    title: report.title,
                    description: report.description,
                    color: report.color,
                    marks: report.distinguishing_marks,
                    category: report.category
                },
                {
                    title: candidate.title,
                    description: candidate.description,
                    color: candidate.color,
                    marks: candidate.distinguishing_marks,
                    category: candidate.category
                }
            );

            // 2. تشابه الصور (50%) - الأولوية لوصف الذكاء الاصطناعي
            let imageScore = 0;
            const rDesc = (report.image_descriptions || []).join(' ');
            const cDesc = (candidate.image_descriptions || []).join(' ');

            if (rDesc && cDesc) {
                // استخدام تشابه النص على الأوصاف المولدة بالذكاء الاصطناعي
                const descSimilarity = calculateTextSimilarity(rDesc, cDesc);
                imageScore = descSimilarity.overall;
                console.log(`🤖 AI-Image Match (${candidate.title}):`, imageScore);
            } else {
                // Fallback to visual similarity if descriptions are missing
                const reportImages = report.images || [];
                const candidateImages = candidate.images || [];
                if (reportImages.length > 0 && candidateImages.length > 0) {
                    imageScore = await compareImageSets(reportImages, candidateImages);
                    console.log(`📸 Visual-Image Match (${candidate.title}):`, imageScore);
                }
            }

            // 3. تشابه الموقع (20%)
            const locationScore = calculateLocationScore(report, candidate as Report);

            // 4. تشابه الوقت (10%)
            const timeScore = calculateTimeScore(report, candidate as Report);

            // 3. حساب النتيجة النهائية (المتوسط المرجح)
            const finalScore = (
                (imageScore * MATCH_SETTINGS.IMAGE_WEIGHT) +
                (textScore * MATCH_SETTINGS.TEXT_WEIGHT) +
                (locationScore * MATCH_SETTINGS.LOCATION_WEIGHT) +
                (timeScore * MATCH_SETTINGS.TIME_WEIGHT)
            );

            console.log(`🧐 Match Check: ${candidate.title}`, {
                image: imageScore,
                text: textScore,
                location: locationScore,
                time: timeScore,
                final: finalScore,
                threshold: MATCH_SETTINGS.MIN_THRESHOLD
            });

            if (finalScore >= MATCH_SETTINGS.MIN_THRESHOLD) {
                matches.push({
                    id: crypto.randomUUID(),
                    lost_report_id: report.type === 'lost' ? report.id : candidate.id,
                    found_report_id: report.type === 'found' ? report.id : candidate.id,
                    image_score: Math.min(100, Math.round(imageScore * 100)) / 100,
                    text_score: Math.min(100, Math.round(textScore * 100)) / 100,
                    location_score: Math.min(100, Math.round(locationScore * 100)) / 100,
                    time_score: Math.min(100, Math.round(timeScore * 100)) / 100,
                    final_score: Math.min(100, Math.round(finalScore * 100)) / 100,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            }
        }

        return matches.sort((a, b) => b.final_score - a.final_score);
    } catch (error) {
        console.error('❌ خطأ في المطابقة المحلية:', error);
        return [];
    }
}

/**
 * البحث عن تطابقات محتملة لبلاغ معين
 */
export async function findPotentialMatches(reportId: string): Promise<AIMatch[]> {
    try {
        console.log('🔍 بدء البحث عن تطابقات للبلاغ:', reportId);

        const reports = await sql`
            SELECT r.*, 
                ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
            FROM reports r 
            WHERE r.id = ${reportId}
        `;

        if (reports.length === 0) return [];
        const report = reports[0] as Report;

        let allMatches: AIMatch[] = [];

        // 1. محاولة استخدام خدمة Python أولاً (للدقة العالية في الـ Embeddings)
        try {
            const pyMatches = await findMatchesWithPythonService(report);
            if (pyMatches.length > 0) {
                allMatches = [...pyMatches];
                console.log(`🐍 خدمة Python وجدت ${pyMatches.length} تطابق`);
            }
        } catch (e) {
            console.warn('⚠️ خدمة Python غير متاحة، جاري الاعتماد على المطابقة المحلية...');
        }

        // 2. استخدام المنطق المحلي (دائماً) لضمان الدقة بناءً على أوصاف Gemini والعلامات المميزة
        const localMatches = await findMatchesLocally(report);
        console.log(`🏠 المطابقة المحلية وجدت ${localMatches.length} تطابق`);

        // دمج النتائج مع إزالة التكرار (الأولوية للـ ID)
        const mergedMatches = [...allMatches];
        const existingIdSet = new Set(mergedMatches.map(m =>
            report.type === 'lost' ? m.found_report_id : m.lost_report_id
        ));

        for (const lMatch of localMatches) {
            const competitorId = report.type === 'lost' ? lMatch.found_report_id : lMatch.lost_report_id;
            if (!existingIdSet.has(competitorId)) {
                mergedMatches.push(lMatch);
            } else {
                // إذا كان موجوداً، نحدث النتيجة لو كانت المحلية أعلى
                const idx = mergedMatches.findIndex(m =>
                    (report.type === 'lost' ? m.found_report_id : m.lost_report_id) === competitorId
                );
                if (idx !== -1 && lMatch.final_score > mergedMatches[idx].final_score) {
                    mergedMatches[idx] = lMatch;
                }
            }
        }

        return mergedMatches;

    } catch (error) {
        console.error('❌ خطأ في البحث عن التطابقات:', error);
        return [];
    }
}

/**
 * حفظ تطابق جديد في قاعدة البيانات وإرسال إشعار للأدمن
 */
export async function saveMatch(match: Omit<AIMatch, 'id' | 'created_at' | 'updated_at'>): Promise<AIMatch | null> {
    try {
        // التحقق من عدم وجود تطابق سابق
        const existing = await sql`
      SELECT id FROM ai_matches 
      WHERE lost_report_id = ${match.lost_report_id} 
      AND found_report_id = ${match.found_report_id}
    `;

        if (existing.length > 0) {
            console.log('⚠️ التطابق موجود مسبقاً');
            return null;
        }

        // حفظ التطابق
        const result = await sql`
      INSERT INTO ai_matches (
        lost_report_id, found_report_id, 
        image_score, text_score, location_score, time_score, final_score, status
      )
      VALUES (
        ${match.lost_report_id}, ${match.found_report_id},
        ${match.image_score}, ${match.text_score}, 
        ${match.location_score}, ${match.time_score}, ${match.final_score}, ${match.status}
      )
      RETURNING *
    `;

        const savedMatch = result[0] as AIMatch;

        // التحقق من نسبة التطابق لإرسال إشعار "تطابق محتمل" (60% أو أكثر)
        if (match.final_score >= MATCH_SETTINGS.MIN_THRESHOLD) {
            // جلب معلومات البلاغات لإرسال الإشعار
            const lostReport = await sql`SELECT title FROM reports WHERE id = ${match.lost_report_id}`;
            const foundReport = await sql`SELECT title FROM reports WHERE id = ${match.found_report_id}`;

            // إرسال إشعار للمديرين (Admin & Moderator/Supervisor)
            await notifyAdminsOfMatch(
                savedMatch.id,
                lostReport[0]?.title || 'بلاغ مفقود',
                foundReport[0]?.title || 'بلاغ موجود',
                match.final_score
            );
            console.log('✅ تم العثور على تطابق محتمل (>= 60%) وإرسال إشعار للمديرين');
        }

        console.log('✅ تم حفظ التطابق في قاعدة البيانات');
        return savedMatch;
    } catch (error) {
        console.error('❌ خطأ في حفظ التطابق:', error);
        return null;
    }
}

/**
 * جلب جميع التطابقات مع تفاصيل البلاغات
 */
export async function getMatchesWithDetails(status?: string): Promise<AIMatch[]> {
    try {
        let matches;

        if (status) {
            matches = await sql`
        SELECT m.*,
          lr.title as lost_title, lr.description as lost_description, 
          lr.category as lost_category, lr.location_city as lost_city,
          lr.user_id as lost_user_id,
          fr.title as found_title, fr.description as found_description,
          fr.category as found_category, fr.location_city as found_city,
          fr.user_id as found_user_id
        FROM ai_matches m
        LEFT JOIN reports lr ON m.lost_report_id = lr.id
        LEFT JOIN reports fr ON m.found_report_id = fr.id
        WHERE m.status = ${status}
        ORDER BY m.final_score DESC, m.created_at DESC
      `;
        } else {
            matches = await sql`
            SELECT
                m.*,
                lr.title as lost_title, lr.description as lost_description,
                lr.category as lost_category, lr.location_city as lost_city,
                lr.user_id as lost_user_id,
                fr.title as found_title, fr.description as found_description,
                fr.category as found_category, fr.location_city as found_city,
                fr.user_id as found_user_id
            FROM ai_matches m
            LEFT JOIN reports lr ON m.lost_report_id = lr.id
            LEFT JOIN reports fr ON m.found_report_id = fr.id
            WHERE m.final_score >= ${MATCH_SETTINGS.MIN_THRESHOLD}
            ORDER BY m.final_score DESC, m.created_at DESC
        `;
        }

        // جلب صور كل بلاغ
        for (const match of matches) {
            const lostImages = await sql`
        SELECT image_url, description_ai FROM report_images WHERE report_id = ${match.lost_report_id}
      `;
            const foundImages = await sql`
        SELECT image_url, description_ai FROM report_images WHERE report_id = ${match.found_report_id}
      `;

            match.lost_report = {
                id: match.lost_report_id,
                title: match.lost_title,
                description: match.lost_description,
                category: match.lost_category,
                location_city: match.lost_city,
                user_id: match.lost_user_id,
                images: lostImages.map((i: { image_url: string }) => i.image_url),
                image_descriptions: lostImages.map((i: { description_ai: string }) => i.description_ai).filter(Boolean),
            } as any;

            match.found_report = {
                id: match.found_report_id,
                title: match.found_title,
                description: match.found_description,
                category: match.found_category,
                location_city: match.found_city,
                user_id: match.found_user_id,
                images: foundImages.map((i: { image_url: string }) => i.image_url),
                image_descriptions: foundImages.map((i: { description_ai: string }) => i.description_ai).filter(Boolean),
            } as any;
        }

        return matches as AIMatch[];
    } catch (error) {
        console.error('خطأ في جلب التطابقات:', error);
        return [];
    }
}

/**
 * تأكيد التطابق وإرسال إشعار للمستخدم
 */
export async function confirmMatch(matchId: string): Promise<boolean> {
    try {
        console.log('🔄 جاري تأكيد التطابق:', matchId);

        // جلب معلومات التطابق
        const matchData = await sql`
      SELECT m.*, 
        lr.title as lost_title, lr.user_id as lost_user_id,
        fr.title as found_title, fr.user_id as found_user_id
      FROM ai_matches m
      LEFT JOIN reports lr ON m.lost_report_id = lr.id
      LEFT JOIN reports fr ON m.found_report_id = fr.id
      WHERE m.id = ${matchId}
    `;

        if (matchData.length === 0) {
            console.error('❌ التطابق غير موجود');
            return false;
        }

        const match = matchData[0];

        // تحديث حالة التطابق إلى "مؤكد" (بدون تغيير حالة البلاغ إلى "تم التسليم" تلقائياً)
        await sql`
      UPDATE ai_matches 
      SET status = 'confirmed', updated_at = NOW()
      WHERE id = ${matchId}
    `;

        // تحديت حالة كلا البلاغين إلى "تم التطابق" بدلاً من "تم التسليم"
        // هذا يسمح للمسؤول بمراجعة البلاغ وتغيير حالته يدوياً إلى "تم التسليم" لاحقاً
        await sql`
      UPDATE reports 
      SET status = 'matched', updated_at = NOW()
      WHERE id = ${match.lost_report_id} OR id = ${match.found_report_id}
    `;

        // إرسال إشعارات للطرفين
        try {
            // إرسال إشعار لصاحب بلاغ المفقود
            await notifyUserOfConfirmedMatch(
                match.lost_user_id,
                match.lost_title,
                match.found_title,
                match.lost_report_id,
                matchId
            );

            // إرسال إشعار لصاحب بلاغ الموجود
            await notifyUserOfConfirmedMatch(
                match.found_user_id,
                match.found_title,
                match.lost_title,
                match.found_report_id,
                matchId
            );
        } catch (notifyError) {
            console.warn('⚠️ فشل في إرسال بعض الإشعارات، ولكن تم تحديث الحالة بنجاح:', notifyError);
            // نستمر لأن تحديث الحالة أهم من الإشعار في هذه المرحلة
        }

        console.log('✅ تم تأكيد التطابق وتحديث حالة البلاغات بنجاح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في تأكيد التطابق:', error);
        return false;
    }
}

/**
 * رفض التطابق
 */
export async function rejectMatch(matchId: string): Promise<boolean> {
    try {
        await sql`
      UPDATE ai_matches 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ${matchId}
    `;
        console.log('✅ تم رفض التطابق');
        return true;
    } catch (error) {
        console.error('❌ خطأ في رفض التطابق:', error);
        return false;
    }
}

/**
 * تشغيل عملية التطابق التلقائي لبلاغ جديد
 */
export async function runAutoMatchForReport(reportId: string): Promise<number> {
    try {
        console.log('🚀 بدء التطابق التلقائي للبلاغ:', reportId);

        // البحث عن التطابقات
        const matches = await findPotentialMatches(reportId);

        let savedCount = 0;

        // حفظ التطابقات وإرسال الإشعارات
        for (const match of matches) {
            const saved = await saveMatch(match);
            if (saved) savedCount++;
        }

        // تحديث حالة البلاغ فقط بدون إشعار المستخدم
        // (المستخدم سيتلقى إشعار فقط عند تأكيد التطابق من قبل الأدمن)
        if (savedCount > 0) {
            await sql`
        UPDATE reports SET status = 'processing', updated_at = NOW()
        WHERE id = ${reportId}
      `;
        }

        console.log(`✅ تم العثور على ${savedCount} تطابق جديد`);
        return savedCount;
    } catch (error) {
        console.error('❌ خطأ في التطابق التلقائي:', error);
        return 0;
    }
}

/**
 * إعادة حساب التطابقات لبلاغ محدد (تحديث النقاط دون حذف)
 */
export async function reMatchReport(reportId: string): Promise<number> {
    try {
        console.log('🔄 إعادة حساب التطابق للبلاغ:', reportId);

        // 1. حساب التطابقات المحتملة الجديدة
        const matches = await findPotentialMatches(reportId);
        let updatedCount = 0;

        // 2. تحديث التطابقات الموجودة أو إنشاء جديد
        for (const match of matches) {
            // تحقق هل التطابق موجود
            const existing = await sql`
                SELECT id, status, final_score FROM ai_matches 
                WHERE lost_report_id = ${match.lost_report_id} 
                AND found_report_id = ${match.found_report_id}
            `;

            if (existing.length > 0) {
                // تحديث النقاط فقط إذا كان التطابق غير مؤكد
                // (نحتفظ بالحالة كما هي: rejected/pending)
                // أما لو كان confirmed، ربما لا نلمسه حتى لا نربك المستخدم؟
                // طلب المستخدم: "Old matches should be recalculated and updated"

                // سنحدث النقاط للكل، لكن لا نغير الحالة إلا لو كانت pending
                await sql`
                    UPDATE ai_matches SET
                        image_score = ${match.image_score},
                        text_score = ${match.text_score},
                        location_score = ${match.location_score},
                        time_score = ${match.time_score},
                        final_score = ${match.final_score},
                        updated_at = NOW()
                    WHERE id = ${existing[0].id}
                `;
                // إذا تحسنت النتيجة لتصبح محتملة (>= 60%) وكانت سابقاً أقل من ذلك، نرسل إشعاراً جديداً
                if (match.final_score >= MATCH_SETTINGS.MIN_THRESHOLD && (existing[0].final_score || 0) < MATCH_SETTINGS.MIN_THRESHOLD) {
                    const lostReport = await sql`SELECT title FROM reports WHERE id = ${match.lost_report_id}`;
                    const foundReport = await sql`SELECT title FROM reports WHERE id = ${match.found_report_id}`;

                    await notifyAdminsOfMatch(
                        existing[0].id,
                        lostReport[0]?.title || 'بلاغ مفقود',
                        foundReport[0]?.title || 'بلاغ موجود',
                        match.final_score
                    );
                    console.log(`📈 تحسنت النتيجة لتصبح تطابق محتمل (>= ${MATCH_SETTINGS.MIN_THRESHOLD * 100}%) - تم إرسال إشعار`);
                }
            } else {
                // تطابق جديد لم يكن موجوداً
                const saved = await saveMatch(match);
                if (saved) updatedCount++;
            }
        }

        if (updatedCount > 0) {
            await sql`
                UPDATE reports SET status = 'processing', updated_at = NOW()
                WHERE id = ${reportId}
            `;
        }

        console.log(`✅ تم تحديث/إنشاء ${updatedCount} تطابق`);
        return updatedCount;
    } catch (error) {
        console.error('❌ خطأ في إعادة المطابقة:', error);
        return 0;
    }
}

/**
 * مسح التطابقات القديمة وإعادة المطابقة من الصفر لبلاغ محدد
 */
export async function clearAndReMatchReport(reportId: string): Promise<number> {
    try {
        console.log('🗑️🧹 مسح وإعادة المطابقة الكاملة للبلاغ:', reportId);

        // 1. حذف جميع التطابقات غير المؤكدة لهذا البلاغ
        // (نحمي التطابقات المؤكدة 'confirmed' لأنها قد تكون مرتبطة بعمليات تسليم)
        await sql`
            DELETE FROM ai_matches 
            WHERE (lost_report_id = ${reportId} OR found_report_id = ${reportId})
            AND status != 'confirmed'
        `;

        // 2. تشغيل المطابقة التلقائية العادية
        return await runAutoMatchForReport(reportId);

    } catch (error) {
        console.error('❌ خطأ في المسح وإعادة المطابقة:', error);
        return 0;
    }
}

/**
 * حساب نقاط التطابق لبلاغين محددين (مقارنة زوجية)
 */
export async function calculateMatchScorePair(lostReportId: string, foundReportId: string): Promise<AIMatch | null> {
    try {
        console.log(`⚖️ مقارنة زوجية بين المفقود (${lostReportId}) والموجود (${foundReportId})`);

        // 1. جلب بيانات البلاغين
        const reports = await sql`
            SELECT r.*, 
                ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
            FROM reports r 
            WHERE r.id IN (${lostReportId}, ${foundReportId})
        `;

        if (reports.length !== 2) {
            console.error('❌ لم يتم العثور على أحد البلاغين');
            return null;
        }

        const lostReport = reports.find(r => r.id === lostReportId) as Report;
        const foundReport = reports.find(r => r.id === foundReportId) as Report;

        // Ensure image_descriptions are handled correctly if NULL
        lostReport.image_descriptions = (lostReport as any).image_descriptions || [];
        foundReport.image_descriptions = (foundReport as any).image_descriptions || [];

        // 2. حساب نقاط التشابه (Text, Image, Location, Time)

        // أ. تشابه النص
        const textScore = compareAttributes(
            {
                title: lostReport.title,
                description: lostReport.description,
                color: lostReport.color,
                marks: lostReport.distinguishing_marks,
                category: lostReport.category
            },
            {
                title: foundReport.title,
                description: foundReport.description,
                color: foundReport.color,
                marks: foundReport.distinguishing_marks,
                category: foundReport.category
            }
        );

        // ب. تشابه الصور (AI Descriptions preferred)
        let imageScore = 0;
        const lDesc = (lostReport.image_descriptions || []).join(' ');
        const fDesc = (foundReport.image_descriptions || []).join(' ');

        if (lDesc && fDesc) {
            const descSimilarity = calculateTextSimilarity(lDesc, fDesc);
            imageScore = descSimilarity.overall;
        } else {
            const lostImages = lostReport.images || [];
            const foundImages = foundReport.images || [];

            if (lostImages.length > 0 && foundImages.length > 0) {
                imageScore = await compareImageSets(lostImages, foundImages);
            }
        }

        // ج. تشابه الموقع
        const locationScore = calculateLocationScore(lostReport, foundReport);

        // د. تشابه الوقت
        const timeScore = calculateTimeScore(lostReport, foundReport);

        // 3. حساب النتيجة النهائية (المتوسط المرجح)
        const finalScore = (
            (imageScore * MATCH_SETTINGS.IMAGE_WEIGHT) +
            (textScore * MATCH_SETTINGS.TEXT_WEIGHT) +
            (locationScore * MATCH_SETTINGS.LOCATION_WEIGHT) +
            (timeScore * MATCH_SETTINGS.TIME_WEIGHT)
        );

        // 4. تحديث سجل التطابق الموجود
        const existing = await sql`
            SELECT id FROM ai_matches 
            WHERE lost_report_id = ${lostReportId} 
            AND found_report_id = ${foundReportId}
        `;

        let result;
        if (existing.length > 0) {
            result = await sql`
                UPDATE ai_matches SET
                    image_score = ${Math.min(100, Math.round(imageScore * 100)) / 100},
                    text_score = ${Math.min(100, Math.round(textScore * 100)) / 100},
                    location_score = ${Math.min(100, Math.round(locationScore * 100)) / 100},
                    time_score = ${Math.min(100, Math.round(timeScore * 100)) / 100},
                    final_score = ${Math.min(100, Math.round(finalScore * 100)) / 100},
                    updated_at = NOW()
                WHERE id = ${existing[0].id}
                RETURNING *
            `;
        } else {
            // إنشاء تطابق جديد إذا لم يكن موجوداً
            result = await sql`
                INSERT INTO ai_matches (
                    lost_report_id, found_report_id,
                    image_score, text_score, location_score, time_score, final_score, status
                ) VALUES (
                    ${lostReportId}, ${foundReportId},
                    ${Math.min(100, Math.round(imageScore * 100)) / 100},
                    ${Math.min(100, Math.round(textScore * 100)) / 100},
                    ${Math.min(100, Math.round(locationScore * 100)) / 100},
                    ${Math.min(100, Math.round(timeScore * 100)) / 100},
                    ${Math.min(100, Math.round(finalScore * 100)) / 100},
                    'pending'
                )
                RETURNING *
            `;
        }

        const savedMatch = result[0] as AIMatch;

        // إرسال إشعار إذا كان التطابق عالياً (Manual Link)
        if (finalScore >= MATCH_SETTINGS.MIN_THRESHOLD) {
            await notifyAdminsOfMatch(
                savedMatch.id,
                lostReport.title || 'بلاغ مفقود',
                foundReport.title || 'بلاغ موجود',
                finalScore
            );
            console.log(`✅ [ForceMatch] تم إرسال إشعار للتطابق (>= ${MATCH_SETTINGS.MIN_THRESHOLD * 100}%)`);
        }

        console.log(`✅ تمت إعادة حساب النتيجة: ${Math.min(100, Math.round(finalScore * 100))}%`);
        return savedMatch;

    } catch (error) {
        console.error('❌ خطأ في المقارنة الزوجية:', error);
        return null;
    }
}

/**
 * إلغاء تأكيد التطابق وإعادة البلاغات للحالة السابقة
 */
export async function undoMatchConfirmation(matchId: string): Promise<boolean> {
    try {
        console.log('🔄 جاري إلغاء تأكيد التطابق:', matchId);

        // جلب معلومات التطابق قبل الإلغاء
        const matchData = await sql`
            SELECT lost_report_id, found_report_id FROM ai_matches WHERE id = ${matchId}
        `;

        if (matchData.length === 0) return false;
        const match = matchData[0];

        // 1. إعادة حالة التطابق إلى "قيد المراجعة"
        await sql`
            UPDATE ai_matches 
            SET status = 'pending', updated_at = NOW()
            WHERE id = ${matchId}
        `;

        // 2. إعادة حالة البلاغات إلى "تم التطابق" بدلاً من "تم التسليم"
        await sql`
            UPDATE reports 
            SET status = 'matched', updated_at = NOW()
            WHERE id = ${match.lost_report_id} OR id = ${match.found_report_id}
        `;

        console.log('✅ تم إلغاء التأكيد وإعادة البلاغات بنجاح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في إلغاء تأكيد التطابق:', error);
        return false;
    }
}

/**
 * إلغاء التسليم باستخدام ID البلاغ
 */
export async function undoDeliveryByReportId(reportId: string): Promise<boolean> {
    try {
        console.log('🔄 جاري إلغاء التسليم للبلاغ:', reportId);

        // البحث عن التطابق المؤكد المرتبط بهذا البلاغ
        const matchData = await sql`
            SELECT id, lost_report_id, found_report_id FROM ai_matches 
            WHERE (lost_report_id = ${reportId} OR found_report_id = ${reportId})
            AND status = 'confirmed'
            LIMIT 1
        `;

        // إذا لم يوجد تطابق مؤكد، ولكن البلاغ كان في حالة 'delivered'، نعيده إلى حالته السابقة
        if (matchData.length === 0) {
            console.warn('⚠️ لم يتم العثور على تطابق مؤكد، جاري تحديث حالة البلاغ فقط.');
            await sql`
                UPDATE reports SET status = 'matched', updated_at = NOW()
                WHERE id = ${reportId}
            `;
            return true;
        }

        const match = matchData[0];

        // المطلوب: الحفاظ على حالة التطابق 'confirmed'
        // وإعادة حالة البلاغات فقط إلى 'matched' لكي يظهر زر "Mark as Delivered" مرة أخرى

        await sql`
            UPDATE reports 
            SET status = 'matched', updated_at = NOW()
            WHERE id = ${match.lost_report_id} OR id = ${match.found_report_id}
        `;

        console.log('✅ تم إلغاء التسليم وإعادة البلاغات إلى حالة "تم التطابق" (مع بقاء التطابق مؤكداً)');
        return true;
    } catch (error) {
        console.error('❌ خطأ في إلغاء التسليم:', error);
        return false;
    }
}

/**
 * إجراء فحص شامل ولإعادة التطابق لكل البلاغات المعلقة
 */
export async function runFullSystemMatching(): Promise<{ processed: number, matches: number }> {
    try {
        console.log('🔄 بدء الفحص الشامل للتطابقات...');

        // جلب كل البلاغات التي لا تزال قيد الانتظار أو المعالجة
        const reports = await sql`
            SELECT id, type, status FROM reports 
            WHERE status IN ('pending', 'processing')
            ORDER BY created_at DESC
        `;

        console.log(`📋 تم العثور على ${reports.length} بلاغ للفحص`);

        let totalMatchesFound = 0;

        for (const report of reports) {
            // تشغيل المطابقة لهذا البلاغ
            const matchesCount = await runAutoMatchForReport(report.id);
            if (matchesCount > 0) {
                totalMatchesFound += matchesCount;
            }
        }

        console.log(`✅ انتهى الفحص الشامل. تم العثور على ${totalMatchesFound} تطابق جديد`);
        return { processed: reports.length, matches: totalMatchesFound };

    } catch (error) {
        console.error('❌ خطأ في الفحص الشامل:', error);
        return { processed: 0, matches: 0 };
    }
}

// ==================== Debug Helper ====================

/**
 * دالة التحليل الدقيق للتطابق (للمطورين)
 * تعرض جميع المرشحين وتفاصيل درجاتهم حتى لو كانت منخفضة
 */
async function debugFindMatches(reportId: string) {
    console.log('🐞 Debugging matches for:', reportId);
    try {
        let reports;
        const isShortId = !isNaN(Number(reportId)) && !reportId.includes('-');

        if (isShortId) {
            reports = await sql`SELECT * FROM reports WHERE short_id = ${Number(reportId)}`;
        } else {
            reports = await sql`SELECT * FROM reports WHERE id = ${reportId}`;
        }

        if (reports.length === 0) return {
            error: `err_report_not_found_${isShortId ? 'short' : 'id'}`,
            params: { id: reportId }
        };

        const report = reports[0] as any;
        const actualId = report.id; // Always the UUID

        // جلب الصور أيضاً
        const reportImages = await sql`SELECT image_url FROM report_images WHERE report_id = ${actualId}`;
        report.images = reportImages.map((i: any) => i.image_url);

        const competitorType = report.type === 'lost' ? 'found' : 'lost';

        // جلب جميع المرشحين من النوع المعاكس
        const candidates = await sql`
            SELECT r.*, 
                ARRAY(SELECT image_url FROM report_images WHERE report_id = r.id) as images,
                ARRAY(SELECT description_ai FROM report_images WHERE report_id = r.id AND description_ai IS NOT NULL) as image_descriptions
            FROM reports r
            WHERE r.type = ${competitorType}
            AND r.id != ${actualId}
        `;

        const results = [];

        for (const candidate of candidates as any[]) {
            // 1. حساب تشابه النص (20%)
            const textScoreResult = await import('@/lib/textSimilarity').then(m => m.calculateTextSimilarity(
                `${report.title} ${report.description} ${report.color || ''} ${report.distinguishing_marks || ''}`,
                `${candidate.title} ${candidate.description} ${candidate.color || ''} ${candidate.distinguishing_marks || ''}`
            ));
            const textScore = textScoreResult.overall;

            // 2. حساب تشافة الصور (50%)
            let imageScore = 0;
            let imageDetails: any = { method: 'none' };

            const rImages = report.images || [];
            const cImages = candidate.images || [];
            const rDescs = (report as any).image_descriptions || [];
            const cDescs = (candidate as any).image_descriptions || [];

            if (rDescs.length > 0 && cDescs.length > 0) {
                const textSim = await import('@/lib/textSimilarity').then(m => m.calculateTextSimilarity(rDescs.join(' '), cDescs.join(' ')));
                imageScore = textSim.overall;
                imageDetails = { method: 'AI-Description', similarity: textSim };
            } else if (rImages.length > 0 && cImages.length > 0) {
                const simResult = await import('@/lib/imageSimilarity').then(m => m.calculateImageSimilarity(rImages[0], cImages[0]));
                imageDetails = { method: 'Visual-Hash', ...simResult };
                imageScore = simResult.overall;
            }

            // 3. تشابه الموقع (20%)
            const locationScore = calculateLocationScore(report, candidate as Report);

            // 4. تشابه الوقت (10%)
            const timeScore = calculateTimeScore(report, candidate as Report);

            // النتيجة النهائية (المتوسط المرجح)
            const finalScore = (
                (imageScore * MATCH_SETTINGS.IMAGE_WEIGHT) +
                (textScore * MATCH_SETTINGS.TEXT_WEIGHT) +
                (locationScore * MATCH_SETTINGS.LOCATION_WEIGHT) +
                (timeScore * MATCH_SETTINGS.TIME_WEIGHT)
            );

            results.push({
                candidateId: candidate.id,
                candidateTitle: candidate.title,
                candidateStatus: candidate.status,
                categoryMatch: report.category === candidate.category,
                scores: {
                    image: imageScore,
                    text: textScore,
                    location: locationScore,
                    time: timeScore,
                    final: finalScore
                },
                details: {
                    imageCalculation: imageDetails,
                    isPassThreshold: finalScore >= MATCH_SETTINGS.MIN_THRESHOLD
                }
            });
        }

        return {
            report: { id: report.id, title: report.title, type: report.type, category: report.category },
            candidatesFound: candidates.length,
            matchingSettings: MATCH_SETTINGS,
            analysis: results.sort((a, b) => b.scores.final - a.scores.final)
        };

    } catch (e: any) {
        console.error('Debug error:', e);
        return { error: e.message || String(e) };
    }
}

// Attach to window for easy access from console or UI
if (typeof window !== 'undefined') {
    (window as any).debugFindMatches = debugFindMatches;
    (window as any).forceMatchPair = async (lostId: string, foundId: string) => {
        const { calculateMatchScorePair } = await import('./matchingService');
        return await calculateMatchScorePair(lostId, foundId);
    };
}
