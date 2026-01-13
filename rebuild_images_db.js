import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function rebuild() {
    try {
        console.log('🗑️ Dropping report_images table...');
        await sql`DROP TABLE IF EXISTS report_images CASCADE`;

        console.log('🏗️ Recreating report_images table with debug columns...');
        await sql`
            CREATE TABLE report_images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
                image_url TEXT NOT NULL,
                raw_response TEXT,
                description_ai TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            )
        `;

        console.log('✅ Rebuild complete!');
    } catch (e) {
        console.error('❌ Rebuild failed:', e);
    }
}

rebuild();
