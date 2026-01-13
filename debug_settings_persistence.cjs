const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = "postgresql://neondb_owner:npg_lRrx0VFmoJD9@ep-falling-term-ahzt131h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function testPersistence() {
    try {
        console.log('Testing System Settings Persistence (CommonJS)...');

        // 1. Initial Read
        const initial = await sql`SELECT * FROM system_settings`;
        console.log('Initial Fetch Count:', initial.length);

        // 2. Insert/Update
        const key = 'test_key_cjs';
        const value = 'test_value_' + Date.now();
        console.log(`Inserting key: ${key}, value: ${value}`);

        await sql`
            INSERT INTO system_settings (key, value, updated_at)
            VALUES (${key}, ${value}, NOW())
            ON CONFLICT (key) 
            DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;

        // 3. Verify
        const afterUpdate = await sql`SELECT * FROM system_settings WHERE key = ${key}`;
        console.log('Fetch After Update:', afterUpdate);

        if (afterUpdate.length > 0 && afterUpdate[0].value === value) {
            console.log('✅ Persistence Test Passed!');
        } else {
            console.error('❌ Persistence Test Failed: Data mismatch or no data.');
        }

    } catch (error) {
        console.error('❌ Test Failed with Error:', error);
    }
}

testPersistence();
