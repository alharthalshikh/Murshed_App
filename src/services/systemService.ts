import { sql } from '@/lib/db';

/**
 * إعادة ضبط المصنع للنظام
 * يقوم بحذف جميع المستخدمين ما عدا المدراء (Admins)
 * يعتمد على ON DELETE CASCADE لحذف البيانات المرتبطة تلقائياً
 */
export async function resetSystemData(): Promise<{ success: boolean; message: string }> {
    try {
        console.log('⚠️ Starting Comprehensive System Factory Reset...');

        // 1. حذف التطابقات (AI Matches)
        await sql`DELETE FROM ai_matches`;
        console.log('✅ AI Matches cleared.');

        // 2. حذف الإشعارات (Notifications)
        try {
            await sql`DELETE FROM notifications`;
            console.log('✅ Notifications cleared.');
        } catch (e) {
            console.warn('⚠️ Could not delete notifications');
        }

        // 3. حذف صور البلاغات (Report Images)
        await sql`DELETE FROM report_images`;
        console.log('✅ Report Images cleared.');

        // 4. حذف البلاغات (Reports)
        await sql`DELETE FROM reports`;
        console.log('✅ Reports cleared.');

        // 5. حذف جلسات المستخدمين (User Sessions)
        await sql`
            DELETE FROM user_sessions 
            WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')
        `;
        console.log('✅ Non-admin sessions cleared.');

        // 6. حذف المستخدمين (Users) - باستثناء المدراء
        await sql`
            DELETE FROM users 
            WHERE role != 'admin'
        `;
        console.log('✅ Non-admin users cleared.');

        // 7. تصفير إعدادات النظام (System Settings)
        await sql`TRUNCATE TABLE system_settings`;
        console.log('✅ System settings reset.');

        // 8. تصفير صور المدراء (Admin Avatars)
        await sql`
            UPDATE users 
            SET avatar_url = NULL 
            WHERE role = 'admin'
        `;
        console.log('✅ Admin avatars reset.');

        return {
            success: true,
            message: 'تم إعادة ضبط مصنع النظام بنجاح. تم مسح كافة البيانات والإعدادات.'
        };
    } catch (error) {
        console.error('Error resetting system data:', error);
        return {
            success: false,
            message: 'حدث خطأ أثناء محاولة إعادة ضبط المصنع.'
        };
    }
}
