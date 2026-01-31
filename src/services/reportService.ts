import { sql } from '@/lib/db';
import { uploadMultipleImages } from './imageService';
import { MatchingEngine } from './matchingEngine';
import { generateImageDescriptionWithGemini } from './geminiService';

export interface Report {
    id: string;
    short_id?: number;
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
    reward_amount?: number;
    reward_currency?: 'YER' | 'USD';
    status: 'pending' | 'processing' | 'matched' | 'contacted' | 'delivered' | 'closed';
    created_at: string;
    updated_at: string;
    images?: string[];
    image_descriptions?: string[];
    user_name?: string;
    user_email?: string;
    user_phone?: string;
}

export interface CreateReportData {
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
    reward_amount?: number;
    reward_currency?: 'YER' | 'USD';
}

export interface ReportFilters {
    type?: 'lost' | 'found';
    status?: string;
    category?: string;
    city?: string;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

/**
 * إنشاء بلاغ جديد مع تشغيل التطابق التلقائي
 */
export async function createReport(data: CreateReportData, imageFiles?: File[]): Promise<{ success: boolean; report?: Report; matchesFound?: number; error?: string }> {
    try {
        console.log('📝 إنشاء بلاغ جديد...');

        // إنشاء البلاغ
        const reports = await sql`
      INSERT INTO reports (
        user_id, type, title, description, category, color,
        distinguishing_marks, date_occurred, location_address,
        location_city, location_lat, location_lng,
        reward_amount, reward_currency
      )
      VALUES (
        ${data.user_id}, ${data.type}, ${data.title}, ${data.description},
        ${data.category}, ${data.color || null}, ${data.distinguishing_marks || null},
        ${data.date_occurred}, ${data.location_address || null},
        ${data.location_city || null}, ${data.location_lat || null}, ${data.location_lng || null},
        ${data.reward_amount || 0}, ${data.reward_currency || 'YER'}
      )
      RETURNING *
    `;

        const report = reports[0] as Report;
        console.log('✅ تم إنشاء البلاغ:', report.id);

        // رفع الصور إذا وجدت - معالجة متوازية بدون Gemini (لتسريع العملية)
        if (imageFiles && imageFiles.length > 0) {
            console.log('📷 رفع الصور بشكل متوازي (بدون تحليل AI للسرعة)...');

            // معالجة جميع الصور بشكل متوازي
            const imagePromises = imageFiles.map(async (file) => {
                try {
                    // رفع الصورة مباشرة بدون Gemini (تحسين السرعة)
                    const uploadResult = await uploadMultipleImages([file]);

                    if (uploadResult.success && uploadResult.urls.length > 0) {
                        const url = uploadResult.urls[0];
                        const rawResponse = uploadResult.rawResponses ? uploadResult.rawResponses[0] : null;

                        await sql`
                            INSERT INTO report_images (report_id, image_url, raw_response, description_ai)
                            VALUES (${report.id}, ${url}, ${rawResponse}, ${null})
                        `;

                        return url;
                    }
                } catch (error) {
                    console.error('Failed to process image:', file.name, error);
                }
                return null;
            });

            const uploadedUrls = (await Promise.all(imagePromises)).filter(Boolean) as string[];
            report.images = uploadedUrls;

            console.log(`✅ تم رفع ${uploadedUrls.length} صور بنجاح`);
        }

        // 🔍 تشغيل خوارزمية التطابق الذكي والذكاء الاصطناعي في الخلفية
        const autoMatchEnabled = import.meta.env.VITE_AI_AUTO_MATCH_ON_CREATE !== 'false';

        if (autoMatchEnabled) {
            console.log('🧠 [V2] Triggering Matching Engine...');
            // Robust Fire & Forget
            MatchingEngine.run(report.id).catch(err => {
                console.error("BG Matching Failed:", err);
            });
            // Also process images, and when they are done, MatchingEngine will be called again (see processReportImagesWithAI)
            processReportImagesWithAI(report.id).catch(error => {
                console.error('❌ AI Processing Error:', error);
            });
        }

        return { success: true, report, matchesFound: 0 }; // نرجع فوراً
    } catch (error) {
        console.error('❌ خطأ في إنشاء البلاغ:', error);
        return {
            success: false,
            error: 'حدث خطأ أثناء إنشاء البلاغ',
        };
    }
}

/**
 * جلب البلاغات مع الفلترة
 */
export async function getReports(filters: ReportFilters = {}): Promise<Report[]> {
    try {
        console.log('🔄 جاري جلب البلاغات من قاعدة البيانات...');

        // بناء استعلام SQL ديناميكي
        let whereClause = sql``;
        const conditions = [];

        if (filters.userId) conditions.push(sql`r.user_id = ${filters.userId}`);
        if (filters.type) conditions.push(sql`r.type = ${filters.type}`);
        if (filters.status) conditions.push(sql`r.status = ${filters.status}`);

        if (conditions.length > 0) {
            whereClause = sql`WHERE ${conditions.reduce((acc, curr, i) => i === 0 ? curr : sql`${acc} AND ${curr}`, sql``)}`;
        }

        const reports = await sql`
            SELECT 
                r.*, 
                u.name as user_name, 
                u.email as user_email,
                u.phone as user_phone,
                ARRAY(
                    SELECT image_url 
                    FROM report_images 
                    WHERE report_id = r.id 
                    ORDER BY created_at ASC
                ) as images
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT ${filters.limit || 10}
            OFFSET ${filters.offset || 0}
        `;

        console.log(`✅ تم جلب ${reports.length} بلاغ`);

        // التأكد من أن الصور مصفوفة نظيفة وموجودة
        const processedReports = reports.map(report => ({
            ...report,
            images: Array.isArray(report.images) ? report.images : []
        }));

        return processedReports as Report[];
    } catch (error) {
        console.error('❌ خطأ في جلب البلاغات:', error);
        return [];
    }
}

/**
 * جلب بلاغ واحد بالتفصيل
 */
export async function getReportById(id: string): Promise<Report | null> {
    try {
        const reports = await sql`
            SELECT 
                r.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
                ARRAY(
                    SELECT image_url FROM report_images WHERE report_id = ${id} ORDER BY created_at ASC
                ) as images
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ${id}
        `;

        if (reports.length === 0) return null;

        const report = reports[0] as Report;
        report.images = Array.isArray(report.images) ? report.images : [];

        // Fetch descriptions separately if needed, or stick to this
        const imageMetadata = await sql`
            SELECT description_ai FROM report_images WHERE report_id = ${id} ORDER BY created_at ASC
        `;
        report.image_descriptions = imageMetadata.map((img: { description_ai: string }) => img.description_ai).filter(Boolean);

        return report;
    } catch (error) {
        console.error('خطأ في جلب البلاغ:', error);
        return null;
    }
}

/**
 * تحديث حالة البلاغ
 */
export async function updateReportStatus(id: string, status: string): Promise<boolean> {
    try {
        const report = await getReportById(id);
        if (!report) return false;

        // تحديث البلاغ الحالي
        await sql`
      UPDATE reports SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;

        // إذا تم التوصيف كـ "مسلم"، نقوم بتحديث التطابق والبلاغ الآخر المرتبط به
        if (status === 'delivered') {
            // 1. تحديث حالة التطابق إلى "مؤكد" (إن وجد وكان غير مرفوض)
            await sql`
                UPDATE ai_matches 
                SET status = 'confirmed', updated_at = NOW()
                WHERE (lost_report_id = ${id} OR found_report_id = ${id})
                AND status != 'rejected'
            `;

            // 2. تحديث البلاغ الآخر في التطابق ليصبح "مسلم" أيضاً لضمان التزامن
            await sql`
                UPDATE reports 
                SET status = 'delivered', updated_at = NOW()
                WHERE id IN (
                    SELECT CASE 
                        WHEN lost_report_id = ${id} THEN found_report_id 
                        ELSE lost_report_id 
                    END
                    FROM ai_matches 
                    WHERE (lost_report_id = ${id} OR found_report_id = ${id})
                    AND status = 'confirmed'
                )
            `;
        }

        // إرسال إشعار للمستخدم بتغيير الحالة
        import('@/services/notificationService').then(service => {
            service.notifyUserOfStatusChange(report.user_id, report.title, status, id);
        });

        return true;
    } catch (error) {
        console.error('خطأ في تحديث حالة البلاغ:', error);
        return false;
    }
}

/**
 * حذف بلاغ
 */
export async function deleteReport(id: string): Promise<boolean> {
    try {
        await sql`DELETE FROM reports WHERE id = ${id}`;
        return true;
    } catch (error) {
        console.error('خطأ في حذف البلاغ:', error);
        return false;
    }
}

/**
 * جلب عدد البلاغات
 */
export async function getReportsCount(filters: ReportFilters = {}): Promise<number> {
    try {
        let result;
        if (filters.type && filters.status && filters.userId) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE type = ${filters.type} AND status = ${filters.status} AND user_id = ${filters.userId}`;
        } else if (filters.type && filters.status) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE type = ${filters.type} AND status = ${filters.status}`;
        } else if (filters.type && filters.userId) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE type = ${filters.type} AND user_id = ${filters.userId}`;
        } else if (filters.status && filters.userId) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE status = ${filters.status} AND user_id = ${filters.userId}`;
        } else if (filters.type) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE type = ${filters.type}`;
        } else if (filters.status) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE status = ${filters.status}`;
        } else if (filters.userId) {
            result = await sql`SELECT COUNT(*) as count FROM reports WHERE user_id = ${filters.userId}`;
        } else {
            result = await sql`SELECT COUNT(*) as count FROM reports`;
        }
        return Number(result[0].count);
    } catch (error) {
        console.error('خطأ في جلب عدد البلاغات:', error);
        return 0;
    }
}
/**
 * تحديث بلاغ موجود
 */
export async function updateReport(
    reportId: string,
    userId: string,
    data: Partial<CreateReportData>,
    newImages?: File[],
    removedImageUrls?: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`🔄 تحديث البلاغ: ${reportId}`);

        // التحقق من الملكية
        const existingReports = await sql`
            SELECT user_id FROM reports WHERE id = ${reportId}
        `;

        if (existingReports.length === 0) {
            return { success: false, error: 'البلاغ غير موجود' };
        }

        if (existingReports[0].user_id !== userId) {
            return { success: false, error: 'ليس لديك صلاحية لتعديل هذا البلاغ' };
        }

        // تحديث بيانات البلاغ
        await sql`
            UPDATE reports SET
                type = COALESCE(${data.type}, type),
                title = COALESCE(${data.title}, title),
                description = COALESCE(${data.description}, description),
                category = COALESCE(${data.category}, category),
                color = ${data.color ?? null},
                distinguishing_marks = ${data.distinguishing_marks ?? null},
                date_occurred = COALESCE(${data.date_occurred}, date_occurred),
                location_address = COALESCE(${data.location_address}, location_address),
                location_city = COALESCE(${data.location_city}, location_city),
                location_lat = ${data.location_lat ?? null},
                location_lng = ${data.location_lng ?? null},
                reward_amount = ${data.reward_amount ?? 0},
                reward_currency = ${data.reward_currency ?? 'YER'},
                updated_at = NOW()
            WHERE id = ${reportId}
        `;

        // حذف الصور المحددة للحذف
        if (removedImageUrls && removedImageUrls.length > 0) {
            console.log(`🗑️ حذف ${removedImageUrls.length} صور...`);
            for (const url of removedImageUrls) {
                await sql`
                    DELETE FROM report_images 
                    WHERE report_id = ${reportId} AND image_url = ${url}
                `;
            }
        }

        // إضافة الصور الجديدة - معالجة متوازية بدون Gemini
        if (newImages && newImages.length > 0) {
            console.log(`📷 إضافة ${newImages.length} صور جديدة بشكل سريع...`);

            const imagePromises = newImages.map(async (file) => {
                try {
                    // رفع مباشر بدون Gemini
                    const uploadResult = await uploadMultipleImages([file]);

                    if (uploadResult.success && uploadResult.urls.length > 0) {
                        const url = uploadResult.urls[0];
                        const rawResponse = uploadResult.rawResponses ? uploadResult.rawResponses[0] : null;

                        await sql`
                            INSERT INTO report_images (report_id, image_url, raw_response, description_ai)
                            VALUES (${reportId}, ${url}, ${rawResponse}, ${null})
                        `;
                    }
                } catch (error) {
                    console.error('Failed to process new image:', error);
                }
            });

            await Promise.all(imagePromises);
        }

        console.log('✅ تم تحديث البلاغ بنجاح');

        // 4. Trigger Matching Engine
        MatchingEngine.run(reportId);
        processReportImagesWithAI(reportId).catch(err => console.error('Error in AI processing after update:', err));

        return { success: true };
    } catch (error) {
        console.error('❌ خطأ في تحديث البلاغ:', error);
        return { success: false, error: 'حدث خطأ أثناء تحديث البلاغ' };
    }
}

/**
 * معالجة صور البلاغ باستخدام الذكاء الاصطناعي (Gemini) وإعادة المطابقة
 */
export async function processReportImagesWithAI(reportId: string): Promise<void> {
    try {
        console.log(`🤖 البدء في تحليل بلاغ ${reportId} بالذكاء الاصطناعي...`);

        // 1. جلب الصور التي ليس لها وصف
        const imagesToProcess = await sql`
            SELECT id, image_url FROM report_images 
            WHERE report_id = ${reportId} 
            AND (description_ai IS NULL OR description_ai = 'AI description failed')
        `;

        if (imagesToProcess.length === 0) {
            console.log('⏩ لا توجد صور جديدة للتحليل أو تم تحليلها مسبقاً');
            // مع ذلك، نشغل المطابقة للتأكد من تحديث النتائج بناءً على النص أو الموقع
            await MatchingEngine.run(reportId);
            return;
        }

        console.log(`📸 جاري تحليل ${imagesToProcess.length} صور باستخدام ذكاء Gemini...`);

        // 2. تحليل كل صورة باستخدام Gemini وتحديث قاعدة البيانات
        for (const img of imagesToProcess) {
            try {
                console.log(`📡 جاري إرسال الصورة للتحليل...`);
                // جلب الملف من URL (Base64 أو رابط)
                const response = await fetch(img.image_url);
                const blob = await response.blob();

                // توليد الوصف
                const description = await generateImageDescriptionWithGemini(blob);

                if (description && !description.includes('AI description failed')) {
                    await sql`
                        UPDATE report_images 
                        SET description_ai = ${description} 
                        WHERE id = ${img.id}
                    `;
                    console.log(`✅ تم تحديث وصف الصورة بنجاح: ${description.substring(0, 30)}...`);
                } else {
                    console.warn(`⚠️ فشل تحليل الصورة أو الوصف غير متاح: ${description}`);
                }
            } catch (imgError) {
                console.error(`❌ فشل تحليل الصورة ${img.id}:`, imgError);
            }
        }

        console.log('✅ اكتمل تحليل الصور بالذكاء الاصطناعي، جاري إعادة حساب التطابقات...');

        // 3. Re-run V2 Matching Engine
        await MatchingEngine.run(reportId);

    } catch (error) {
        console.error('❌ خطأ في معالجة الصور بالذكاء الاصطناعي:', error);
    }
}
