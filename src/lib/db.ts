import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL;

// إنشاء اتصال بقاعدة البيانات
export const sql = neon(DATABASE_URL);

// التحقق من وجود الجداول وإنشائها إذا لم تكن موجودة
export async function initializeDatabase() {
  try {
    console.log('🔄 جاري تهيئة قاعدة البيانات...');
    console.log('📡 Connecting to:', DATABASE_URL?.split('@')[1] || 'URL not found');

    // إنشاء جدول المستخدمين
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        is_suspended BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    // التأكد من وجود عمود التعطيل (is_suspended) للجداول المنشأة مسبقاً
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false`;
    } catch (e) { }
    console.log('✅ جدول users تم إنشاؤه/تحديثه');

    // إنشاء جدول البلاغات
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_id SERIAL UNIQUE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        color TEXT,
        distinguishing_marks TEXT,
        date_occurred DATE NOT NULL,
        location_address TEXT,
        location_city TEXT,
        location_lat DOUBLE PRECISION,
        location_lng DOUBLE PRECISION,
        reward_amount NUMERIC DEFAULT 0,
        reward_currency TEXT DEFAULT 'YER',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;

    // التعديل للجداول الموجودة مسبقاً
    try {
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS short_id SERIAL UNIQUE`;
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS reward_amount NUMERIC DEFAULT 0`;
      await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS reward_currency TEXT DEFAULT 'YER'`;

      // تعيين قيمة بداية للـ SERIAL إذا كان جديداً
      await sql`SELECT setval(pg_get_serial_sequence('reports', 'short_id'), COALESCE((SELECT MAX(short_id) FROM reports), 5000), false)`;
    } catch (e) {
      console.warn('⚠️ تنبيه أثناء تحديث جدول البلاغات:', e);
    }
    console.log('✅ جدول reports تم إنشاؤه/تحديثه');

    // إنشاء جدول صور البلاغات
    await sql`
      CREATE TABLE IF NOT EXISTS report_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
        image_url TEXT NOT NULL,
        description_ai TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    // التأكد من وجود عمود الوصف الذكي (للجداول المنشأة مسبقاً)
    try {
      await sql`ALTER TABLE report_images ADD COLUMN IF NOT EXISTS description_ai TEXT`;
    } catch (e) {
      // تجاهل الخطأ إذا كان العمود موجوداً بالفعل
    }
    console.log('✅ جدول report_images تم إنشاؤه/تحديثه');

    // إنشاء جدول التطابقات
    await sql`
      CREATE TABLE IF NOT EXISTS ai_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lost_report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
        found_report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
        image_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        text_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        location_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        final_score DOUBLE PRECISION NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ جدول ai_matches تم إنشاؤه');

    // إنشاء جدول الإشعارات
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'system',
        is_read BOOLEAN NOT NULL DEFAULT false,
        related_report_id UUID,
        related_match_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    // التأكد من وجود الأعمدة الإضافية
    try {
      await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_report_id UUID`;
      await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_match_id UUID`;
    } catch (e) { }
    console.log('✅ جدول notifications تم إنشاؤه/تحديثه');

    // إنشاء جدول جلسات المستخدمين
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ جدول user_sessions تم إنشاؤه');

    // إنشاء جدول إعدادات النظام
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ جدول system_settings تم إنشاؤه');

    // إنشاء Indexes لتسريع الاستعلامات
    console.log('🚀 إنشاء Indexes لتحسين الأداء...');
    try {
      // Indexes for reports table
      await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC)`;

      // Indexes for report_images
      await sql`CREATE INDEX IF NOT EXISTS idx_report_images_report_id ON report_images(report_id)`;

      // Indexes for ai_matches
      await sql`CREATE INDEX IF NOT EXISTS idx_matches_status ON ai_matches(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_matches_lost_report ON ai_matches(lost_report_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_matches_found_report ON ai_matches(found_report_id)`;

      // Indexes for notifications
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`;

      console.log('✅ تم إنشاء Indexes بنجاح');
    } catch (e) {
      console.warn('⚠️ تنبيه أثناء إنشاء Indexes:', e);
    }

    // إنشاء حساب Admin افتراضي إذا لم يكن موجوداً
    const adminExists = await sql`
      SELECT id FROM users WHERE email = 'alharth465117@gmail.com'
    `;

    if (adminExists.length === 0) {
      await sql`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ('alharth465117@gmail.com', '77927792', 'مدير النظام', 'admin')
      `;
      console.log('✅ تم إنشاء حساب Admin الافتراضي');
    }

    console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
    return true;
  } catch (error) {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    return false;
  }
}

// دالة للحصول على إحصائيات النظام
export async function getSystemStats() {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'lost') as lost_count,
        COUNT(*) FILTER (WHERE type = 'found') as found_count,
        COUNT(*) FILTER (WHERE status = 'matched') as matched_count,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
        (SELECT COALESCE(SUM(final_score), 0) FROM ai_matches WHERE status = 'confirmed') as match_score_sum,
        (SELECT COUNT(*) FROM ai_matches WHERE status = 'confirmed') as confirmed_matches_count
      FROM reports
    `;

    const usersCount = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'user'`;

    const totalLostReports = Number(stats[0]?.lost_count || 0);
    const totalFoundReports = Number(stats[0]?.found_count || 0);
    const matchScoreSum = Number(stats[0]?.match_score_sum || 0);
    const confirmedMatchesCount = Number(stats[0]?.confirmed_matches_count || 0);
    const successfulMatches = Number(stats[0]?.matched_count || 0) + Number(stats[0]?.delivered_count || 0);

    // حساب نسبة التطابق بناءً على (مجموع نسب تطابق البلاغ) / عدد التطابقات
    // كما طلب المستخدم: (sum of scores / count of matches) * 100
    const matchRate = confirmedMatchesCount > 0
      ? ((matchScoreSum / confirmedMatchesCount) * 100).toFixed(1)
      : 0;

    return {
      totalLostReports,
      totalFoundReports,
      successfulMatches: successfulMatches,
      deliveredCount: Number(stats[0]?.delivered_count || 0),
      totalUsers: Number(usersCount[0]?.count || 0),
      matchRate: Number(matchRate),
    };
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return {
      totalLostReports: 0,
      totalFoundReports: 0,
      successfulMatches: 0,
      totalUsers: 0,
      matchRate: 0,
    };
  }
}


