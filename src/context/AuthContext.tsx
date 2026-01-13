import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    User,
    login as authLogin,
    logout as authLogout,
    register as authRegister,
    validateSession,
    getCurrentUser,
    LoginCredentials,
    RegisterData,
    AuthResult
} from '@/services/authService';
import { initializeDatabase } from '@/lib/db';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    canModerate: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<AuthResult>;
    register: (data: RegisterData) => Promise<AuthResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // قراءة المستخدم من localStorage فوراً (قبل أي async)
        const cachedUser = getCurrentUser();
        if (cachedUser) {
            setUser(cachedUser);
        }

        // ثم تهيئة التطبيق
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // تهيئة قاعدة البيانات (في الخلفية)
            // تهيئة قاعدة البيانات (في الخلفية)
            // initializeDatabase().catch(err =>
            //     console.error('خطأ في تهيئة قاعدة البيانات:', err)
            // );

            // التحقق من الجلسة الحالية
            const cachedUser = getCurrentUser();
            if (cachedUser) {
                // المستخدم موجود في الـ cache، نتحقق من الجلسة في الخلفية
                setIsLoading(false);
                setIsInitialized(true);

                // التحقق من صلاحية الجلسة بدون blocking
                validateSession().then(result => {
                    if (result.success && result.user) {
                        setUser(result.user);
                    } else {
                        // الجلسة منتهية
                        setUser(null);
                        localStorage.removeItem('murshid_user');
                        localStorage.removeItem('murshid_token');
                    }
                }).catch(err => {
                    console.error('خطأ في التحقق من الجلسة:', err);
                });
            } else {
                // لا يوجد مستخدم في الـ cache
                setIsLoading(false);
                setIsInitialized(true);
            }
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            setIsLoading(false);
            setIsInitialized(true);
        }
    };

    const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
        const result = await authLogin(credentials);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return result;
    };

    const logout = async () => {
        await authLogout();
        setUser(null);
    };

    const register = async (data: RegisterData): Promise<AuthResult> => {
        const result = await authRegister(data);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return result;
    };

    const refreshUser = async () => {
        const result = await validateSession();
        if (result.success && result.user) {
            setUser(result.user);
        } else {
            setUser(null);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isModerator: user?.role === 'moderator',
        canModerate: user?.role === 'admin' || user?.role === 'moderator',
        login,
        logout,
        register,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
