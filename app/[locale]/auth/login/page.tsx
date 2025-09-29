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
import { Loader2, Shield, GraduationCap, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  useEffect(() => {
    // Fetch CSRF token on mount
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to fetch CSRF token:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || t('auth.invalidCredentials'));
      } else {
        // Login successful - redirect based on role
        const userRole = data.user.role;
        const dashboardPath = getDashboardPath(userRole);
        router.push(`/${locale}${dashboardPath}`);
      }
    } catch (error) {
      console.error('Login error:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
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
