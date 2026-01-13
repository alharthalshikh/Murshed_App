/**
 * خدمة إشعارات المتصفح (Browser Notifications)
 */

// حالة صلاحية الإشعارات
export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * التحقق من دعم المتصفح للإشعارات
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

/**
 * الحصول على حالة صلاحية الإشعارات الحالية
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) return 'denied';
    return Notification.permission as NotificationPermission;
}

/**
 * طلب صلاحية الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) {
        console.warn('Browser does not support notifications');
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        console.log('📢 Notification permission:', permission);

        // حفظ الحالة في localStorage
        localStorage.setItem('murshid_notification_permission', permission);

        return permission as NotificationPermission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

/**
 * إظهار إشعار في المتصفح
 */
export function showBrowserNotification(
    title: string,
    options?: {
        body?: string;
        icon?: string;
        tag?: string;
        onClick?: () => void;
        dir?: 'rtl' | 'ltr';
        lang?: string;
    }
): void {
    if (!isNotificationSupported()) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag,
        dir: options?.dir || 'rtl',
        lang: options?.lang || 'ar',
    });

    if (options?.onClick) {
        notification.onclick = () => {
            window.focus();
            options.onClick?.();
            notification.close();
        };
    }

    // إغلاق تلقائي بعد 5 ثواني
    setTimeout(() => notification.close(), 5000);
}

/**
 * التحقق مما إذا كان المستخدم قد رفض الإشعارات سابقاً
 */
export function hasUserDeniedNotifications(): boolean {
    return getNotificationPermission() === 'denied';
}

/**
 * التحقق مما إذا كان المستخدم قد قبل الإشعارات
 */
export function hasUserAcceptedNotifications(): boolean {
    return getNotificationPermission() === 'granted';
}

/**
 * التحقق مما إذا لم يُسأل المستخدم عن الإشعارات بعد
 */
export function shouldAskForNotifications(): boolean {
    return getNotificationPermission() === 'default';
}

/**
 * إظهار إشعار تطابق
 */
export function showMatchNotification(matchTitle: string, t?: (key: any, params?: any) => string, lang?: string): void {
    const title = t ? t('notif_new_match_title') : '🎉 تطابق جديد!';
    const body = t ? t('notif_new_match_body', { title: matchTitle }) : `تم العثور على تطابق: ${matchTitle}`;

    showBrowserNotification(title, {
        body: body,
        tag: 'match',
        dir: lang === 'en' ? 'ltr' : 'rtl',
        lang: lang || 'ar',
        onClick: () => {
            window.location.href = '/notifications';
        },
    });
}

/**
 * إظهار إشعار تحديث حالة البلاغ
 */
export function showStatusUpdateNotification(reportTitle: string, newStatus: string, t?: (key: any, params?: any) => string, lang?: string): void {
    const title = t ? t('notif_status_update_title') : '📋 تحديث البلاغ';
    const body = t ? t('notif_status_update_body', { title: reportTitle, status: newStatus }) : `تم تحديث حالة "${reportTitle}" إلى: ${newStatus}`;

    showBrowserNotification(title, {
        body: body,
        tag: 'status',
        dir: lang === 'en' ? 'ltr' : 'rtl',
        lang: lang || 'ar',
        onClick: () => {
            window.location.href = '/reports';
        },
    });
}
