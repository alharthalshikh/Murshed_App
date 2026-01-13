import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Languages, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleBackground } from '@/components/ui/GoogleBackground';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const { setLanguage, resolvedLanguage, t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error(t('err_enter_email_password'));
            return;
        }

        setIsLoading(true);

        try {
            const result = await login({ email, password });

            if (result.success) {
                toast.success(t('login_success'), {
                    description: t('login_success_msg').replace('{name}', result.user?.name || ''),
                });
                navigate(from, { replace: true });
            } else {
                toast.error(t((result.error as TranslationKey) || 'login_error'));
            }
        } catch (error) {
            toast.error(t('err_unexpected'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <GoogleBackground count={1500} className="z-0" />

            {/* Language Toggle Fixed */}
            <div className="absolute top-4 right-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/50 backdrop-blur border-0 shadow-sm gap-2"
                    onClick={() => setLanguage(resolvedLanguage === 'ar' ? 'en' : 'ar')}
                >
                    <Languages className="w-4 h-4" />
                    {resolvedLanguage === 'ar' ? 'English' : 'العربية'}
                </Button>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg group-hover:shadow-xl transition-shadow">
                            <Search className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className={resolvedLanguage === 'ar' ? "text-right" : "text-left"}>
                            <h1 className="text-2xl font-bold text-foreground">
                                {t('app_name')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t('system_name')}
                            </p>
                        </div>
                    </Link>
                </div>

                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">
                            {t('login')}
                        </CardTitle>
                        <CardDescription>
                            {t('login_subtitle')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {t('email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('email_placeholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={cn("h-12", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                                    dir="ltr"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                                    <Lock className="h-4 w-4 text-primary" />
                                    {t('password')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('password_placeholder')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={cn("h-12", resolvedLanguage === 'ar' ? "pr-12 text-right" : "pl-12 text-left")}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
                                            resolvedLanguage === 'ar' ? "right-3" : "right-3"
                                        )}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className={resolvedLanguage === 'ar' ? "text-left" : "text-right"}>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t('forgot_password')}
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="hero"
                                size="xl"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        {t('loading')}
                                    </>
                                ) : (
                                    <>
                                        {t('login')}
                                        <ArrowRight className={cn("h-5 w-5", resolvedLanguage === 'ar' && "rotate-180")} />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    {t('or')}
                                </span>
                            </div>
                        </div>

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                {t('no_account')}{' '}
                                <Link to="/register" className="text-primary font-medium hover:underline">
                                    {t('register_now')}
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowRight className={cn("h-4 w-4", resolvedLanguage === 'ar' && "rotate-180")} />
                        {t('back_to_home')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
