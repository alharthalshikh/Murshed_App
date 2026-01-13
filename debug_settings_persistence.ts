import { sql } from './src/lib/db';

async function testPersistence() {
    try {
        console.log('Testing System Settings Persistence...');

        // 1. Initial Read
        const initial = await sql`SELECT * FROM system_settings`;
        console.log('Initial Fetch:', initial);

        // 2. Insert/Update
        const key = 'test_key';
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
