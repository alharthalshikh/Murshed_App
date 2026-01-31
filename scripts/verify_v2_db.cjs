
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

// Mock Engine Logic for Verification (Since we can't import TS files directly in this CJS script without build)
// We will manually insert reports and then START the NextJS app or run checking logic if possible.
// Actually, since we changed the backend code, we can just insert reports via SQL, 
// BUT the backend code (reportService) runs in the browser/Next.js server context.
// Automation of "Application Code" from "Script" is hard without running the actual app.

// So this script will be a "Database State Verifier" after you manually create reports.
// OR it can verify the "Engine Logic" by re-implementing the core scoring check here to prove it WORKS math-wise.

console.log("⚠️ NOTE: This script validates that the DATABASE supports the new engine requirements.");

async function verify() {
    try {
        console.log("📡 Checking Database Tables...");

        // 1. Check ai_matches table columns
        // We added specific detailed scores in V2, let's make sure they are there or we need migration
        // In the previous matchingService, we had image_score etc. so it should be fine.

        const cols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ai_matches'
        `;

        const hasScore = cols.some(c => c.column_name === 'final_score');
        const hasImage = cols.some(c => c.column_name === 'image_score');

        if (hasScore && hasImage) {
            console.log("✅ Table 'ai_matches' has required columns.");
        } else {
            console.error("❌ Table 'ai_matches' looks missing columns!");
            console.table(cols);
        }

        // 2. Clear old test notifications to have a clean slate (optional)
        // await sql`DELETE FROM notifications WHERE title LIKE '%Test%'`;

        console.log("✅ Verification Script Ready. Please create reports in UI now.");

    } catch (e) {
        console.error(e);
    }
}

verify();
