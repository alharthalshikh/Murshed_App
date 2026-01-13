import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function debug() {
    try {
        const reports = await sql`
            SELECT 
                r.id, r.title,
                (SELECT array_agg(image_url) FROM report_images WHERE report_id = r.id) as images
            FROM reports r
            ORDER BY r.created_at DESC
            LIMIT 5
        `;
        console.log('--- DATA START ---');
        console.log(JSON.stringify(reports, null, 2));
        console.log('--- DATA END ---');
    } catch (e) {
        console.error(e);
    }
}

debug();
