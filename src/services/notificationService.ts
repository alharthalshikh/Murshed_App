import { sql } from '@/lib/db';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'match' | 'status' | 'system' | 'admin';
    is_read: boolean;
    related_report_id?: string;
    related_match_id?: string;
    created_at: string;
    // Joined data
    user_name?: string;
    user_email?: string;
}

// ==================== إنشاء الإشعارات ====================

/**
 * إنشاء إشعار جديد
 */
export async function createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type: 'match' | 'status' | 'system' | 'admin';
    related_report_id?: string;
    related_match_id?: string;
}): Promise<Notification | null> {
    try {
        const result = await sql`
      INSERT INTO notifications (user_id, title, message, type, related_report_id, related_match_id)
      VALUES (${data.user_id}, ${data.title}, ${data.message}, ${data.type}, ${data.related_report_id || null}, ${data.related_match_id || null})
      RETURNING *
    `;
        console.log('✅ تم إنشاء إشعار جديد');
        return result[0] as Notification;
    } catch (error) {
        console.error('❌ خطأ في إنشاء الإشعار:', error);
        return null;
    }
}

/**
 * إرسال إشعار تطابق محتمل للأدمن
 */
export async function notifyAdminsOfMatch(matchId: string, lostReportTitle: string, foundReportTitle: string, score: number): Promise<void> {
    try {
        // جلب جميع المديرين
        const admins = await sql`
      SELECT id FROM users WHERE role = 'admin' OR role = 'moderator'
    `;

        const scorePercent = Math.round(score * 100);

        for (const admin of admins) {
            await createNotification({
                user_id: admin.id,
                title: 'notif_match_potential_title',
                message: JSON.stringify({
                    key: 'notif_match_potential_msg',
                    params: { score: scorePercent, lostTitle: lostReportTitle, foundTitle: foundReportTitle }
                }),
                type: 'match',
                related_match_id: matchId,
            });
        }

        console.log(`✅ Sent notification to ${admins.length} admins`);
    } catch (error) {
        console.error('❌ Error sending admin notifications:', error);
    }
}

/**
 * إرسال إشعار للمستخدم عند تأكيد التطابق
 */
export async function notifyUserOfConfirmedMatch(
    userId: string,
    reportTitle: string,
    matchedReportTitle: string,
    reportId: string,
    matchId: string
): Promise<void> {
    try {
        await createNotification({
            user_id: userId,
            title: 'notif_match_confirmed_title',
            message: JSON.stringify({
                key: 'notif_match_confirmed_msg',
                params: { reportTitle, matchedReportTitle }
            }),
            type: 'match',
            related_report_id: reportId,
            related_match_id: matchId,
        });
        console.log('✅ Sent confirmed match notification to user');
    } catch (error) {
        console.error('❌ Error sending confirmed match notification:', error);
    }
}

/**
 * إرسال إشعار تغيير حالة البلاغ
 */
export async function notifyUserOfStatusChange(
    userId: string,
    reportTitle: string,
    newStatus: string,
    reportId: string
): Promise<void> {
    try {
        await createNotification({
            user_id: userId,
            title: 'notif_status_change_title',
            message: JSON.stringify({
                key: 'notif_status_change_msg',
                params: { reportTitle, status: `stat_${newStatus}` }
            }),
            type: 'status',
            related_report_id: reportId,
        });
    } catch (error) {
        console.error('❌ Error sending status change notification:', error);
    }
}

// ==================== جلب الإشعارات ====================

/**
 * جلب إشعارات المستخدم
 */
export async function getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    try {
        const notifications = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
        return notifications as Notification[];
    } catch (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        return [];
    }
}

/**
 * جلب عدد الإشعارات غير المقروءة
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
        const result = await sql`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ${userId} AND is_read = false
    `;
        return Number(result[0]?.count || 0);
    } catch (error) {
        console.error('خطأ في جلب عدد الإشعارات:', error);
        return 0;
    }
}

/**
 * جلب جميع الإشعارات (للأدمن)
 */
export async function getAllNotifications(limit = 50): Promise<Notification[]> {
    try {
        const notifications = await sql`
      SELECT n.*, u.name as user_name, u.email as user_email
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT ${limit}
    `;
        return notifications as Notification[];
    } catch (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        return [];
    }
}

// ==================== إدارة الإشعارات ====================

/**
 * تحديث حالة القراءة
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
        await sql`
      UPDATE notifications SET is_read = true
      WHERE id = ${notificationId}
    `;
        return true;
    } catch (error) {
        console.error('خطأ في تحديث الإشعار:', error);
        return false;
    }
}

/**
 * تحديث جميع إشعارات المستخدم كمقروءة
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
        await sql`
      UPDATE notifications SET is_read = true
      WHERE user_id = ${userId}
    `;
        return true;
    } catch (error) {
        console.error('خطأ في تحديث الإشعارات:', error);
        return false;
    }
}

/**
 * حذف إشعار
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
        await sql`DELETE FROM notifications WHERE id = ${notificationId}`;
        return true;
    } catch (error) {
        console.error('خطأ في حذف الإشعار:', error);
        return false;
    }
}
