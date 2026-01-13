import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getUnreadNotificationsCount } from '@/services/notificationService';
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  FileSearch,
  Plus,
  LayoutDashboard,
  LogOut,
  Shield,
  LogIn,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useQuery } from '@tanstack/react-query';
// ... imports

export function Header() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, isModerator, canModerate, logout } = useAuth();

  // React Query for unread notifications count
  // Poll every 30 seconds, or faster if desired.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: () => getUnreadNotificationsCount(user!.id),
    enabled: !!user?.id, // Only run if user is logged in
    refetchInterval: 30000,
    staleTime: 1000 * 30,
  });

  const navLinks = [
    { href: '/', label: t('nav_home'), icon: LayoutDashboard },
    { href: '/reports', label: t('nav_reports'), icon: FileSearch },
    { href: '/new-report', label: t('nav_new_report'), icon: Plus },
    { href: '/contact', label: t('nav_contact'), icon: Phone },
  ];

  // Note: Previous manual setInterval logic removed.

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
            <Search className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="block">
            <h1 className="text-lg font-bold text-foreground">{t('app_name')}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{t('system_name')}</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {/* Dashboard Link */}
          {canModerate && (
            <Link
              to={isAdmin ? "/admin" : "/moderator"}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isAdmin
                  ? (location.pathname.startsWith('/admin') ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-foreground hover:bg-muted')
                  : (location.pathname.startsWith('/moderator') ? 'bg-warning/10 text-warning' : 'text-muted-foreground hover:text-foreground hover:bg-muted')
              )}
            >
              <Shield className="h-4 w-4" />
              {isAdmin ? t('nav_admin') : t('nav_moderator')}
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="h-4 w-4 ml-2" />
                      {t('nav_admin')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="h-4 w-4 ml-2" />
                    {t('nav_profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="cursor-pointer">
                    <Bell className="h-4 w-4 ml-2" />
                    {t('nav_notifications')}
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="mr-auto text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 ml-2" />
                  {t('nav_logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="hidden md:block">
              <Button variant="outline" size="default">
                <LogIn className="h-4 w-4" />
                {t('nav_login')}
              </Button>
            </Link>
          )}

          <Link to="/new-report" className="hidden md:block">
            <Button variant="hero" size="default">
              <Plus className="h-4 w-4" />
              {t('nav_new_report')}
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {/* Notifications Link */}
            {isAuthenticated && (
              <Link
                to="/notifications"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Bell className="h-5 w-5" />
                {t('nav_notifications')}
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="mr-auto">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Shield className="h-5 w-5" />
                {t('nav_admin')}
              </Link>
            )}

            <div className="pt-2 border-t mt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    {t('nav_logout')}
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <LogIn className="h-5 w-5" />
                    {t('nav_login')}
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
