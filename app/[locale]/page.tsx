import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Users,
  Shield,
  Award,
  ArrowLeft,
  LogIn,
  ChevronRight
} from 'lucide-react';
import { LanguageSwitch } from '@/components/LanguageSwitch';

interface HomePageProps {
  params: {
    locale: string;
  };
}

export default async function HomePage({ params: { locale } }: HomePageProps) {
  const session = await getServerSession();
  const t = await getTranslations();

  if (session) {
    // Redirect authenticated users to their dashboard
    const userRole = session.user.role;
    const dashboardPath = getDashboardPath(userRole);
    redirect(`/${locale}${dashboardPath}`);
  } else {
    // Redirect unauthenticated users to login
    redirect(`/${locale}/auth/login`);
  }

  // Public landing page for unauthenticated users
  const features = locale === 'ar' ? [
    {
      icon: 'GraduationCap',
      title: 'التعلم الإلكتروني',
      description: 'دورات تفاعلية متطورة مصممة خصيصاً لقوات الأمن',
    },
    {
      icon: 'Users',
      title: 'الدورات الصفية',
      description: 'جلسات تدريبية مباشرة مع المدربين المحترفين',
    },
    {
      icon: 'Shield',
      title: 'الاختبارات المؤمنة',
      description: 'نظام اختبارات متقدم مع إجراءات أمنية صارمة',
    },
    {
      icon: 'Award',
      title: 'الشهادات الرقمية',
      description: 'شهادات معتمدة ورقمية قابلة للتحقق',
    },
  ] : [
    {
      icon: 'GraduationCap',
      title: 'E-Learning',
      description: 'Interactive courses designed specifically for security forces',
    },
    {
      icon: 'Users',
      title: 'Classroom Sessions',
      description: 'Live training sessions with professional instructors',
    },
    {
      icon: 'Shield',
      title: 'Secure Exams',
      description: 'Advanced examination system with strict security measures',
    },
    {
      icon: 'Award',
      title: 'Digital Certificates',
      description: 'Verified and verifiable digital certificates',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">TSF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">TSF Learning</h1>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'نظام التعلم الإلكتروني' : 'Learning Management System'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <LanguageSwitch />
              <Link href={`/${locale}/auth/login`}>
                <Button className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
            {locale === 'ar' ? (
              <>
                منصة التعلم المتطورة
                <br />
                <span className="text-accent">لقوات الأمن الخاصة</span>
              </>
            ) : (
              <>
                Advanced Learning Platform
                <br />
                <span className="text-accent">for Special Security Forces</span>
              </>
            )}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {locale === 'ar'
              ? 'نظام تعلم إلكتروني شامل مصمم خصيصاً لتدريب وتطوير قوات الأمن الخاصة في قطر. يوفر منصة متكاملة للدورات التدريبية والاختبارات والشهادات الرقمية.'
              : 'A comprehensive e-learning system designed specifically for training and developing Qatar\'s Special Security Forces. It provides an integrated platform for training courses, examinations, and digital certificates.'
            }
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/auth/login`}>
                <Button size="lg" className="flex items-center gap-2 text-lg px-8 py-6">
                  {locale === 'ar' ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                {locale === 'ar' ? 'تعرف على المزيد' : 'Learn More'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">
              {locale === 'ar' ? 'مميزات النظام' : 'System Features'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {locale === 'ar'
                ? 'نقدم حلول تعلم متطورة تلبي احتياجات قوات الأمن الخاصة'
                : 'We provide advanced learning solutions that meet the needs of special security forces'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = getIconComponent(feature.icon);
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,247</div>
              <div className="text-muted-foreground">
                {locale === 'ar' ? 'متدرب نشط' : 'Active Trainees'}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">87.5%</div>
              <div className="text-muted-foreground">
                {locale === 'ar' ? 'معدل الإكمال' : 'Completion Rate'}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-muted-foreground">
                {locale === 'ar' ? 'دورة تدريبية' : 'Training Courses'}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">92.3%</div>
              <div className="text-muted-foreground">
                {locale === 'ar' ? 'نجاح الاختبارات' : 'Exam Success'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            {locale === 'ar' ? 'ابدأ رحلتك التدريبية اليوم' : 'Start Your Training Journey Today'}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {locale === 'ar'
              ? 'انضم إلى آلاف المتدربين في قوات الأمن الخاصة الذين يطورون مهاراتهم من خلال منصتنا'
              : 'Join thousands of trainees in the Special Security Forces who are developing their skills through our platform'
            }
          </p>
          <Link href={`/${locale}/auth/login`}>
            <Button size="lg" variant="secondary" className="flex items-center gap-2 text-lg px-8 py-6 mx-auto">
              <LogIn className="h-5 w-5" />
              {locale === 'ar' ? 'دخول النظام' : 'Access System'}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">TSF</span>
                </div>
                <div>
                  <h3 className="font-bold">TSF Learning</h3>
                  <p className="text-sm opacity-80">
                    {locale === 'ar' ? 'نظام التعلم الإلكتروني' : 'Learning Management System'}
                  </p>
                </div>
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                {locale === 'ar'
                  ? 'منصة تعلم إلكتروني متطورة لقوات الأمن الخاصة في قطر، توفر أفضل الحلول التدريبية.'
                  : 'An advanced e-learning platform for Qatar\'s Special Security Forces, providing the best training solutions.'
                }
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
              </h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link href={`/${locale}/auth/login`} className="hover:opacity-100 transition-opacity">
                  {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </Link></li>
                <li><a href="#features" className="hover:opacity-100 transition-opacity">
                  {locale === 'ar' ? 'المميزات' : 'Features'}
                </a></li>
                <li><a href="#about" className="hover:opacity-100 transition-opacity">
                  {locale === 'ar' ? 'حول النظام' : 'About'}
                </a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </h4>
              <div className="text-sm opacity-80 space-y-2">
                <p>{locale === 'ar' ? 'قوات الأمن الخاصة' : 'Special Security Forces'}</p>
                <p>{locale === 'ar' ? 'دولة قطر' : 'State of Qatar'}</p>
                <p>support@tsf.qatar.gov.qa</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-sm opacity-80">
              {locale === 'ar'
                ? '© 2024 نظام التعلم الإلكتروني لقوات الأمن الخاصة. جميع الحقوق محفوظة.'
                : '© 2024 TSF Police Learning Management System. All rights reserved.'
              }
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function getDashboardPath(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'COMMANDER':
      return '/commander';
    case 'TRAINEE':
      return '/trainee';
    default:
      return '/admin';
  }
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    GraduationCap,
    Users,
    Shield,
    Award,
  };
  return icons[iconName] || GraduationCap;
}
