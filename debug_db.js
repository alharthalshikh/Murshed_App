import { sql } from './src/lib/db';

async function debug() {
    try {
        console.log('Fetching last 5 reports with images...');
        const reports = await sql`
            SELECT 
                r.id, r.title,
                (SELECT array_agg(image_url) FROM report_images WHERE report_id = r.id) as images
            FROM reports r
            ORDER BY r.created_at DESC
            LIMIT 5
        `;
        console.log(JSON.stringify(reports, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debug();
