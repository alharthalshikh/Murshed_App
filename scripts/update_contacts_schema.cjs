const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('Current working directory:', process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('.env file found and loaded.');
} else {
    console.error('.env file NOT found at:', envPath);
    // Try loading without path as fallback
    dotenv.config();
}

const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL or VITE_DATABASE_URL is not set.');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database...');

        // Add new columns if they don't exist
        console.log('Adding new columns to contacts table...');

        await client.query(`
            ALTER TABLE contacts 
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS facebook_url TEXT,
            ADD COLUMN IF NOT EXISTS instagram_url TEXT,
            ADD COLUMN IF NOT EXISTS youtube_url TEXT,
            ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;
        `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
