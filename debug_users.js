import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function debug() {
    try {
        const users = await sql`SELECT id, name, email, avatar_url FROM users LIMIT 10`;
        console.log('--- USERS DATA ---');
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debug();
