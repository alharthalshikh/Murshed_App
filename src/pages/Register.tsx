import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User, Phone, CheckCircle2 } from 'lucide-react';
import { useLanguage, type TranslationKey } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { GoogleBackground } from '@/components/ui/GoogleBackground';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const { t, resolvedLanguage } = useLanguage();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error(t('err_name_required'));
            return false;
        }
        if (!formData.email.trim()) {
            toast.error(t('err_email_required'));
            return false;
        }
        if (!formData.password) {
            toast.error(t('err_password_required'));
            return false;
        }
        if (formData.password.length < 6) {
            toast.error(t('err_password_short'));
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error(t('err_password_mismatch'));
            return false;
        }
        if (!acceptTerms) {
            toast.error(t('err_terms_required'));
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
            });

            if (result.success) {
                toast.success(t('register_success_title'), {
                    description: t('register_success_desc'),
                });
                navigate('/');
            } else {
                toast.error(t((result.error as TranslationKey) || 'register_failed'));
            }
        } catch (error) {
            toast.error(t('err_unexpected'));
        } finally {
            setIsLoading(false);
        }
    };

    const passwordStrength = () => {
        const password = formData.password;
        if (!password) return { level: 0, text: '', color: '' };

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { level: 1, text: t('weak'), color: 'bg-destructive' };
        if (score <= 3) return { level: 2, text: t('medium'), color: 'bg-warning' };
        return { level: 3, text: t('strong'), color: 'bg-success' };
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-10">
            {/* Animated Background Particles */}
            <GoogleBackground count={600} className="opacity-40" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg group-hover:shadow-xl transition-shadow">
                            <Search className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div className={resolvedLanguage === 'ar' ? "text-right" : "text-left"}>
                            <h1 className="text-2xl font-bold text-foreground">{t('app_name')}</h1>
                            <p className="text-sm text-muted-foreground">{t('system_name')}</p>
                        </div>
                    </Link>
                </div>

                <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">{t('register_title')}</CardTitle>
                        <CardDescription>
                            {t('register_subtitle')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                                    <User className="h-4 w-4 text-primary" />
                                    {t('full_name')}
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder={t('full_name_placeholder')}
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={cn("h-12", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {t('email')}
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder={t('email_placeholder')}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={cn("h-12", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                                    dir="ltr"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                                    <Phone className="h-4 w-4 text-primary" />
                                    {t('phone_number')}
                                    <span className="text-xs text-muted-foreground mr-1 ml-1">{t('optional')}</span>
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder={t('phone_placeholder')}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={cn("h-12", resolvedLanguage === 'ar' ? "text-right" : "text-left")}
                                    dir="ltr"
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
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('password_placeholder')}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={cn("h-12", resolvedLanguage === 'ar' ? "pr-12 text-right" : "pl-12 text-left")}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", resolvedLanguage === 'ar' ? "left-3" : "right-3")}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {/* Password Strength */}
                                {formData.password && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${level <= strength.level ? strength.color : 'bg-muted'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('password_strength')} <span className="font-medium">{strength.text}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                                    <Lock className="h-4 w-4 text-primary" />
                                    {t('confirm_password')}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t('password_placeholder')}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={cn("h-12", resolvedLanguage === 'ar' ? "pr-12 text-right" : "pl-12 text-left")}
                                        required
                                    />
                                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                        <CheckCircle2 className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-success", resolvedLanguage === 'ar' ? "left-3" : "right-3")} />
                                    )}
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 pt-2">
                                <Checkbox
                                    id="terms"
                                    checked={acceptTerms}
                                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                                    className="mt-1"
                                />
                                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                                    {t('accept_terms')}{' '}
                                    <Link to="/terms" className="text-primary hover:underline">
                                        {t('terms_of_use')}
                                    </Link>
                                    {' '}{t('and')}{' '}
                                    <Link to="/privacy" className="text-primary hover:underline">
                                        {t('privacy_policy')}
                                    </Link>
                                </label>
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
                                        {t('creating_account')}
                                    </>
                                ) : (
                                    <>
                                        {t('create_account_btn')}
                                        <ArrowRight className={cn("h-5 w-5", resolvedLanguage === 'ar' && "rotate-180")} />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-muted-foreground">
                                {t('have_account')}{' '}
                                <Link to="/login" className="text-primary font-medium hover:underline">
                                    {t('login_now')}
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
