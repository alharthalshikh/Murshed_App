const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function migrate() {
    try {
        console.log('Running Migration for system_settings table...');

        await sql`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            )
        `;

        console.log('✅ system_settings table created/verified.');

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    }
}

migrate();
