import { sql } from '../src/lib/db';

/**
 * Script to clean old notifications with hardcoded Arabic text
 * Run this once to remove old notifications before the localization update
 */
async function cleanOldNotifications() {
    try {
        console.log('🧹 Starting cleanup of old notifications...');

        // Delete all existing notifications (they contain hardcoded Arabic text)
        const result = await sql`
            DELETE FROM notifications
            WHERE created_at < NOW()
        `;

        console.log(`✅ Cleaned up old notifications successfully`);
        console.log(`📊 Total notifications removed: ${result.count || 0}`);
        console.log('');
        console.log('ℹ️  New notifications will be created with localization keys');
        console.log('ℹ️  Users will see notifications in their selected language');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning notifications:', error);
        process.exit(1);
    }
}

cleanOldNotifications();
