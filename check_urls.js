import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function checkUrls() {
    try {
        const rows = await sql`SELECT image_url FROM report_images ORDER BY created_at DESC LIMIT 5`;
        for (const row of rows) {
            const url = row.image_url;
            try {
                // Using global fetch
                const res = await fetch(url, { method: 'HEAD' });
                console.log(`URL: ${url} - Status: ${res.status}`);
            } catch (e) {
                console.log(`URL: ${url} - Error: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

checkUrls();
