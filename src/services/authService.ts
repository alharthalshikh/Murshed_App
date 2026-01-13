import { sql } from '@/lib/db';

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    role: 'admin' | 'moderator' | 'user';
    is_active: boolean;
    is_suspended: boolean;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone?: string;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
}

const SESSION_KEY = 'murshid_session';

/**
 * تسجيل الدخول
 */
export async function login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
        console.log('🔄 Login attempt...');

        const users = await sql`
      SELECT id, email, name, phone, avatar_url, role, is_active, is_suspended, created_at
      FROM users
      WHERE email = ${credentials.email} AND password_hash = ${credentials.password}
    `;

        console.log('Search result:', users.length);

        if (users.length === 0) {
            return {
                success: false,
                error: 'err_invalid_credentials',
            };
        }

        const user = users[0] as User;

        if (!user.is_active) {
            return {
                success: false,
                error: 'err_account_banned',
            };
        }

        // إنشاء جلسة جديدة
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام

        await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

        // حفظ الجلسة في localStorage
        saveSession(token, user);

        console.log('✅ Login successful');
        return {
            success: true,
            user,
            token,
        };
    } catch (error) {
        console.error('❌ Login error:', error);
        return {
            success: false,
            error: 'err_login_failed_msg',
        };
    }
}

/**
 * إنشاء حساب جديد
 */
export async function register(data: RegisterData): Promise<AuthResult> {
    try {
        console.log('🔄 Register attempt...');

        // التحقق من عدم وجود حساب بنفس البريد
        const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${data.email}
    `;

        if (existingUsers.length > 0) {
            return {
                success: false,
                error: 'err_email_exists',
            };
        }

        // إنشاء المستخدم الجديد
        const newUsers = await sql`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (${data.email}, ${data.password}, ${data.name}, ${data.phone || null})
      RETURNING id, email, name, phone, avatar_url, role, is_active, is_suspended, created_at
    `;

        const user = newUsers[0] as User;

        // إنشاء جلسة جديدة
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
    `;

        saveSession(token, user);

        console.log('✅ Account created successfully');
        return {
            success: true,
            user,
            token,
        };
    } catch (error) {
        console.error('❌ Register error:', error);
        return {
            success: false,
            error: 'err_register_failed_msg',
        };
    }
}

/**
 * تحديث صورة المستخدم
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<User | null> {
    try {
        const users = await sql`
      UPDATE users 
      SET avatar_url = ${avatarUrl}
      WHERE id = ${userId}
      RETURNING id, email, name, phone, avatar_url, role, is_active, is_suspended, created_at
    `;

        if (users.length === 0) return null;

        const user = users[0] as User;

        // تحديث الجلسة الحالية
        const session = getSession();
        if (session && session.user.id === userId) {
            saveSession(session.token, user);
        }

        return user;
    } catch (error) {
        console.error('Error updating avatar:', error);
        return null;
    }
}

/**
 * تسجيل الخروج
 */
export async function logout(): Promise<void> {
    try {
        const session = getSession();
        if (session?.token) {
            await sql`
        DELETE FROM user_sessions WHERE token = ${session.token}
      `;
        }
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    } finally {
        clearSession();
    }
}

/**
 * التحقق من الجلسة الحالية
 */
export async function validateSession(): Promise<AuthResult> {
    try {
        const session = getSession();
        if (!session?.token) {
            return { success: false };
        }

        const sessions = await sql`
      SELECT u.id, u.email, u.name, u.phone, u.avatar_url, u.role, u.is_active, u.is_suspended, u.created_at
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${session.token} AND s.expires_at > NOW()
    `;

        if (sessions.length === 0) {
            clearSession();
            return { success: false };
        }

        const user = sessions[0] as User;

        if (!user.is_active) {
            clearSession();
            return {
                success: false,
                error: 'err_account_banned',
            };
        }

        return {
            success: true,
            user,
            token: session.token,
        };
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        return { success: false };
    }
}

/**
 * الحصول على المستخدم الحالي من الذاكرة المحلية
 */
export function getCurrentUser(): User | null {
    const session = getSession();
    return session?.user || null;
}

/**
 * التحقق من صلاحيات الأدمن
 */
export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.role === 'admin';
}

/**
 * التحقق من صلاحيات المشرف
 */
export function isModerator(): boolean {
    const user = getCurrentUser();
    return user?.role === 'moderator';
}

/**
 * التحقق من صلاحيات الإشراف (أدمن أو مشرف)
 */
export function canModerate(): boolean {
    const user = getCurrentUser();
    return user?.role === 'admin' || user?.role === 'moderator';
}

// ==================== Helper Functions ====================

function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

interface SessionData {
    token: string;
    user: User;
}

function saveSession(token: string, user: User): void {
    const session: SessionData = { token, user };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession(): SessionData | null {
    try {
        const data = localStorage.getItem(SESSION_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}
