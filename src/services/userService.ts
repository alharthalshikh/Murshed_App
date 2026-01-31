import { sql } from '@/lib/db';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    cover_url?: string;
    role: 'admin' | 'moderator' | 'user';
    is_active: boolean;
    is_suspended: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * تحديث بيانات مستخدم (للأدمن)
 */
export async function updateUser(userId: string, data: { name?: string, email?: string, phone?: string, role?: string, password?: string }): Promise<boolean> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${i++}`);
            values.push(data.name);
        }
        if (data.email !== undefined) {
            fields.push(`email = $${i++}`);
            values.push(data.email);
        }
        if (data.phone !== undefined) {
            fields.push(`phone = $${i++}`);
            values.push(data.phone);
        }
        if (data.role !== undefined) {
            fields.push(`role = $${i++}`);
            values.push(data.role);
        }

        if (fields.length === 0) return true;

        values.push(userId);
        const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;

        // Since we are using neon serverless with tagged templates or regular queries
        // Let's adapt to how neon `sql` is used in this project.
        // The project uses `sql` from `@neondatabase/serverless` which is a tagged template literal.
        // Dynamic queries are a bit tricky with tagged templates if we don't know the exact structure.
        // However, looking at other files, they use simple template literals.

        // Alternative: simpler approach for this specific case
        if (data.name !== undefined && data.email !== undefined && data.phone !== undefined && data.password !== undefined) {
            await sql`
                UPDATE users 
                SET name = ${data.name}, email = ${data.email}, phone = ${data.phone}, password_hash = ${data.password}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        } else if (data.name !== undefined && data.email !== undefined && data.phone !== undefined) {
            await sql`
                UPDATE users 
                SET name = ${data.name}, email = ${data.email}, phone = ${data.phone}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        } else if (data.password !== undefined) {
            await sql`UPDATE users SET password_hash = ${data.password}, updated_at = NOW() WHERE id = ${userId}`;
        } else if (data.name !== undefined) {
            await sql`UPDATE users SET name = ${data.name}, updated_at = NOW() WHERE id = ${userId}`;
        } else if (data.email !== undefined) {
            await sql`UPDATE users SET email = ${data.email}, updated_at = NOW() WHERE id = ${userId}`;
        } else if (data.phone !== undefined) {
            await sql`UPDATE users SET phone = ${data.phone}, updated_at = NOW() WHERE id = ${userId}`;
        } else if (data.role !== undefined) {
            await sql`UPDATE users SET role = ${data.role}, updated_at = NOW() WHERE id = ${userId}`;
        }

        return true;
    } catch (error) {
        console.error('Error updating user:', error);
        return false;
    }
}

/**
 * تغيير حالة تعليق المستخدم (تعطيل/تفعيل النشر)
 */
export async function toggleUserSuspension(userId: string, currentSuspension: boolean): Promise<boolean> {
    try {
        await sql`
            UPDATE users 
            SET is_suspended = ${!currentSuspension}, updated_at = NOW() 
            WHERE id = ${userId}
        `;
        return true;
    } catch (error) {
        console.error('Error toggling user suspension:', error);
        return false;
    }
}

/**
 * تغيير حالة حظر المستخدم (منع تسجيل الدخول)
 */
export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<boolean> {
    try {
        await sql`
            UPDATE users 
            SET is_active = ${!currentStatus}, updated_at = NOW() 
            WHERE id = ${userId}
        `;
        return true;
    } catch (error) {
        console.error('Error toggling user status:', error);
        return false;
    }
}

/**
 * حذف مستخدم نهائياً
 */
export async function deleteUser(userId: string): Promise<boolean> {
    try {
        // سيقوم بحذف البلاغات والتعليقات والإشعارات المرتبطة بسبب ON DELETE CASCADE في قاعدة البيانات
        await sql`DELETE FROM users WHERE id = ${userId}`;
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

/**
 * جلب جميع المستخدمين مع الفلترة
 */
export async function getUsers(filters?: { role?: string, searchQuery?: string }): Promise<User[]> {
    try {
        let query;
        if (filters?.role && filters.role !== 'all') {
            query = sql`SELECT * FROM users WHERE role = ${filters.role} ORDER BY created_at DESC`;
        } else {
            query = sql`SELECT * FROM users ORDER BY created_at DESC`;
        }

        const users = await query;

        if (filters?.searchQuery) {
            const search = filters.searchQuery.toLowerCase();
            return (users as User[]).filter(u =>
                u.name.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search) ||
                (u.phone && u.phone.includes(search))
            );
        }

        return users as User[];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}
