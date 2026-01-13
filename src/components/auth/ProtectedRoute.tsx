import { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children?: ReactNode;
    requireAdmin?: boolean;
    requireModerator?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireModerator = false }: ProtectedRouteProps) {
    const { isAuthenticated, isAdmin, canModerate, isLoading } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (requireModerator && !canModerate) {
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
