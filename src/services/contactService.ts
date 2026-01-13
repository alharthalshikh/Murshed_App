import { sql } from '@/lib/db';

export interface ContactInfo {
    admin_name?: string;
    admin_avatar?: string;
    whatsapp_number?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    whatsapp_group_url?: string;
}

/**
 * جلب معلومات التواصل
 */
export async function getContactInfo(): Promise<ContactInfo> {
    try {
        const result = await sql`
            SELECT key, value FROM system_settings 
            WHERE key IN ('admin_name', 'admin_avatar', 'whatsapp_number', 'facebook_url', 'instagram_url', 'youtube_url', 'whatsapp_group_url')
        `;

        const info: any = {};
        result.forEach((row: any) => {
            info[row.key] = row.value;
        });

        return info as ContactInfo;
    } catch (error) {
        console.error('Error fetching contact info:', error);
        return {};
    }
}

/**
 * تحديث معلومات التواصل
 */
export async function updateContactInfo(info: ContactInfo): Promise<boolean> {
    try {
        const promises = Object.entries(info).map(([key, value]) => {
            if (value === undefined) return Promise.resolve();
            return sql`
                INSERT INTO system_settings (key, value, updated_at)
                VALUES (${key}, ${value}, NOW())
                ON CONFLICT (key) 
                DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            `;
        });

        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error('Error updating contact info:', error);
        return false;
    }
}
