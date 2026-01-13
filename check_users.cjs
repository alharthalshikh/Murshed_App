
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function fixAndCheck() {
    try {
        console.log('🔄 Fixing database schema...');

        // Add is_suspended if it doesn't exist
        try {
            await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false`;
            console.log('✅ Column is_suspended added/verified.');
        } catch (e) {
            console.error('⚠️ Could not add column:', e.message);
        }

        console.log('📡 Checking users table...');
        const users = await sql`SELECT id, email, name, role, is_active, is_suspended FROM users`;
        console.log('Users in database:');
        console.table(users);

        const admin = users.find(u => u.role === 'admin');
        if (admin) {
            console.log('Admin account found:', admin.email);
            console.log('is_active:', admin.is_active);
            console.log('is_suspended:', admin.is_suspended);

            // Check if admin is active
            if (!admin.is_active) {
                console.log('⚠️ Admin account is inactive! Reactivating...');
                await sql`UPDATE users SET is_active = true WHERE id = ${admin.id}`;
                console.log('✅ Admin account reactivated.');
            }
        } else {
            console.log('❌ No admin account found!');
            console.log('Creating default admin account...');
            await sql`
                INSERT INTO users (email, password_hash, name, role, is_active, is_suspended)
                VALUES ('alharth465117@gmail.com', '77927792', 'مدير النظام', 'admin', true, false)
            `;
            console.log('✅ Default admin account created.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixAndCheck();
