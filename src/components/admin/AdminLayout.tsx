import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    GitCompare,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    Shield,
    Trophy,
    Home,
    Phone,
    Bug,
} from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const { t, resolvedLanguage } = useLanguage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    const sidebarLinks = [
        { href: '/', label: t('sidebar_home'), icon: Home },
        { href: '/admin', label: t('sidebar_dashboard'), icon: LayoutDashboard },
        { href: '/admin/reports', label: t('sidebar_reports'), icon: FileText },
        { href: '/admin/users', label: t('sidebar_users'), icon: Users },
        { href: '/admin/matches', label: t('sidebar_matches'), icon: GitCompare },
        { href: '/achievements', label: t('sidebar_achievements'), icon: Trophy },
        { href: '/admin/notifications', label: t('sidebar_notifications'), icon: Bell },
        { href: '/admin/contact', label: t('sidebar_contact'), icon: Phone },
        { href: '/admin/debug', label: t('sidebar_debugger'), icon: Bug },
        { href: '/admin/settings', label: t('sidebar_settings'), icon: Settings },
    ];

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    const isRtl = resolvedLanguage === 'ar';

    return (
        <div className="min-h-screen bg-muted/30" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "fixed top-0 z-40 h-screen bg-card shadow-lg transition-all duration-300 hidden lg:flex flex-col",
                    isRtl ? "right-0 border-l" : "left-0 border-r",
                    isSidebarOpen ? "w-64" : "w-20"
                )}
            >
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
                            <Shield className="h-5 w-5 text-primary-foreground" />
                        </div>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <h1 className="text-lg font-bold text-foreground truncate">{t('admin_panel_title')}</h1>
                                <p className="text-xs text-muted-foreground truncate">{t('app_name')}</p>
                            </div>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden lg:flex"
                    >
                        <ChevronLeft className={cn(
                            "h-4 w-4 transition-transform",
                            isRtl ? (isSidebarOpen ? "" : "rotate-180") : (isSidebarOpen ? "rotate-180" : "")
                        )} />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                title={!isSidebarOpen ? link.label : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {isSidebarOpen && <span className="truncate">{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className={cn("flex-shrink-0 p-4 border-t bg-card mt-auto")}>
                    <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size={isSidebarOpen ? "default" : "icon"}
                        onClick={handleLogout}
                        className={cn(
                            "w-full mt-3 text-destructive hover:text-destructive hover:bg-destructive/10",
                            !isSidebarOpen && "mt-2"
                        )}
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        {isSidebarOpen && <span className={cn(isRtl ? "mr-2" : "ml-2")}>{t('logout_btn')}</span>}
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className={cn(
                "lg:hidden fixed top-0 right-0 left-0 z-50 h-16 bg-card border-b shadow-sm",
                isRtl ? "right-0" : "left-0"
            )}>
                <div className="flex items-center justify-between h-full px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                            <Shield className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold">{t('admin_panel_title')}</span>
                    </Link>

                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-foreground/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <aside
                        className={cn(
                            "fixed top-0 h-full w-72 bg-card shadow-xl transition-transform duration-300 flex flex-col",
                            isRtl ? "right-0" : "left-0",
                            isMobileMenuOpen ? "translate-x-0" : (isRtl ? "translate-x-full" : "-translate-x-full")
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex-shrink-0 flex items-center justify-between h-16 px-4 border-b">
                            <Link to="/admin" className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                                    <Shield className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <span className="font-bold">{t('admin_panel_title')}</span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {sidebarLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex-shrink-0 p-4 border-t mt-auto">
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className={cn(isRtl ? "mr-2" : "ml-2")}>{t('logout_btn')}</span>
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className={cn(
                "min-h-screen transition-all duration-300 pt-16 lg:pt-0",
                isSidebarOpen
                    ? (isRtl ? "lg:mr-64" : "lg:ml-64")
                    : (isRtl ? "lg:mr-20" : "lg:ml-20")
            )}>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
