import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileSearch, Plus, Bell, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export function BottomNavigation() {
    const { t } = useLanguage();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    const navItems = [
        {
            label: t('nav_home'),
            icon: LayoutDashboard,
            path: '/',
        },
        {
            label: t('nav_reports'),
            icon: FileSearch,
            path: '/reports',
        },
        {
            label: t('nav_add'),
            icon: Plus,
            path: '/new-report',
            isPrimary: true,
        },
        {
            label: t('nav_achievements'),
            icon: Trophy,
            path: '/achievements',
        },
        {
            label: t('nav_notifications'),
            icon: Bell,
            path: '/notifications',
        },
        {
            label: t('nav_profile'),
            icon: User,
            path: isAuthenticated ? '/profile' : '/login',
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t md:hidden pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    if (item.isPrimary) {
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative -top-6"
                            >
                                <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center shadow-lg border-4 border-background transform transition-transform active:scale-95">
                                    <Icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs font-medium transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
