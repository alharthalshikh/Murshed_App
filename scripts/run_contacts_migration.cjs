require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.VITE_DATABASE_URL);

async function runContactsMigration() {
    console.log('Starting contacts migration...');

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS contacts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                note TEXT,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        console.log('✅ Contacts table created successfully.');
    } catch (error) {
        console.error('❌ Error creating contacts table:', error);
    }
}

runContactsMigration();
