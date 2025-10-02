'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, GraduationCap, Users, Award, Home, Info, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoginPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  useEffect(() => {
    console.log('🚀 Login page mounted');
    // Fetch CSRF token on mount
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => {
        console.log('CSRF response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('CSRF token received:', !!data.csrfToken);
        setCsrfToken(data.csrfToken);
      })
      .catch(err => console.error('❌ Failed to fetch CSRF token:', err));
  }, []);

  useEffect(() => {
    console.log('🔍 Checking existing session...');
    // Check if already logged in
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => {
        console.log('Session check status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Session data:', data);
        if (data.user) {
          console.log('✅ User already logged in, redirecting...');
          const userRole = data.user.role;
          const dashboardPath = getDashboardPath(userRole);
          console.log('Redirect to:', `/${locale}${dashboardPath}`);
          router.push(`/${locale}${dashboardPath}`);
        } else {
          console.log('No active session');
          setIsCheckingAuth(false);
        }
      })
      .catch(err => {
        // User not logged in, stay on login page
        console.log('❌ Session check error:', err);
        setIsCheckingAuth(false);
      });
  }, [router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('📝 Login form submitted:', { email });

    try {
      console.log('🌐 Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok || !data.success) {
        console.log('❌ Login failed:', data.error);
        setError(data.error || t('auth.invalidCredentials'));
      } else {
        // Login successful - redirect based on role
        console.log('✅ Login successful!');
        const userRole = data.user.role;
        const dashboardPath = getDashboardPath(userRole);
        console.log('Redirecting to:', `/${locale}${dashboardPath}`);
        router.push(`/${locale}${dashboardPath}`);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role: string): string => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return '/admin';
      case 'instructor':
        return '/instructor';
      case 'commander':
        return '/commander';
      case 'trainee':
        return '/trainee';
      default:
        return '/admin';
    }
  };

  const features = locale === 'ar' ? [
    {
      icon: GraduationCap,
      title: 'التعلم الإلكتروني',
      description: 'دورات تفاعلية متطورة مصممة خصيصاً لقوات الأمن',
    },
    {
      icon: Users,
      title: 'الدورات الصفية',
      description: 'جلسات تدريبية مباشرة مع المدربين المحترفين',
    },
    {
      icon: Shield,
      title: 'الاختبارات المؤمنة',
      description: 'نظام اختبارات متقدم مع إجراءات أمنية صارمة',
    },
    {
      icon: Award,
      title: 'الشهادات الرقمية',
      description: 'شهادات معتمدة ورقمية قابلة للتحقق',
    },
  ] : [
    {
      icon: GraduationCap,
      title: 'E-Learning',
      description: 'Interactive courses designed specifically for security forces',
    },
    {
      icon: Users,
      title: 'Classroom Sessions',
      description: 'Live training sessions with professional instructors',
    },
    {
      icon: Shield,
      title: 'Secure Exams',
      description: 'Advanced examination system with strict security measures',
    },
    {
      icon: Award,
      title: 'Digital Certificates',
      description: 'Verified and verifiable digital certificates',
    },
  ];

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">TSF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">TSF Learning</h1>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? 'نظام التعلم الإلكتروني' : 'Learning Management System'}
                </p>
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
              <Link href={`/${locale}`}>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t('navigation.home')}
                </Button>
              </Link>
              <Link href={`/${locale}/about`}>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {t('navigation.about')}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('navigation.contact')}
                </Button>
              </Link>
              <LanguageSwitch />
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2 rtl:space-x-reverse">
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mr-4">
              <span className="text-primary font-bold text-2xl">TSF</span>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold">TSF Learning</h1>
              <p className="text-primary-foreground/80">
                {locale === 'ar' ? 'نظام التعلم الإلكتروني' : 'Learning Management System'}
              </p>
            </div>
          </div>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'منصة التعلم المتطورة لقوات الأمن الخاصة في قطر'
              : 'Advanced Learning Platform for Qatar Special Security Forces'
            }
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Login Form */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('auth.login')}</CardTitle>
              <CardDescription>
                {t('auth.loginDescription')}
              </CardDescription>
              <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                <p className="font-semibold mb-1">
                  {locale === 'ar' ? '🔐 حسابات تجريبية:' : '🔐 Demo Accounts:'}
                </p>
                <p>admin@kbn.local / Passw0rd!</p>
                <p>super@kbn.local / Passw0rd!</p>
                <p>instructor@kbn.local / Passw0rd!</p>
                <p>trainee@kbn.local / Passw0rd!</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kbn.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {locale === 'ar' ? 'جاري التحقق...' : 'Signing in...'}
                    </>
                  ) : (
                    t('auth.loginButton')
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <LanguageSwitch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">
            {locale === 'ar'
              ? '© 2024 نظام إدارة التعلم لشرطة TSF. جميع الحقوق محفوظة.'
              : '© 2024 TSF Police Learning Management System. All rights reserved.'
            }
          </p>
        </div>
      </footer>
    </div>
  );
}
