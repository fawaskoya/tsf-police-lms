'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
// UserRole import removed - using normalized Role from lib/roles
import { isSuperAdmin, prismaRoleToRole } from '@/lib/roles';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  Award, 
  Users, 
  Settings, 
  Shield,
  GraduationCap,
  Target,
  Menu,
  X,
  Globe,
  Check,
  Tag,
  Archive,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// LanguageSwitch import removed - now integrated into profile menu
import { NotificationDropdown } from './NotificationDropdown';
import { cn, getInitials } from '@/lib/utils';
import { getDirection } from '@/lib/rtl';
import type { Locale } from '@/types/i18n';

interface ShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  {
    href: '',
    label: 'navigation.dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'instructor', 'commander', 'trainee'],
  },
  {
    href: '/courses',
    label: 'navigation.courses',
    icon: BookOpen,
    roles: ['super_admin', 'admin', 'instructor', 'trainee'],
  },
  {
    href: '/exams',
    label: 'navigation.exams',
    icon: FileText,
    roles: ['super_admin', 'admin', 'instructor', 'trainee'],
  },
  {
    href: '/sessions',
    label: 'navigation.sessions',
    icon: Calendar,
    roles: ['super_admin', 'admin', 'instructor', 'commander', 'trainee'],
  },
  {
    href: '/reports',
    label: 'navigation.reports',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'commander'],
  },
  {
    href: '/certificates',
    label: 'navigation.certificates',
    icon: Award,
    roles: ['super_admin', 'admin', 'commander', 'trainee'],
  },
  {
    href: '/users',
    label: 'navigation.users',
    icon: Users,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/settings',
    label: 'navigation.settings',
    icon: Settings,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/audit-log',
    label: 'navigation.auditLog',
    icon: Shield,
    roles: ['super_admin'],
  },
  {
    href: '/my-learning',
    label: 'navigation.myLearning',
    icon: GraduationCap,
    roles: ['trainee'],
  },
  {
    href: '/compliance',
    label: 'navigation.compliance',
    icon: Target,
    roles: ['commander'],
  },
  {
    href: '/training-programs',
    label: 'dashboard.trainingPrograms',
    icon: GraduationCap,
    roles: ['super_admin', 'admin', 'commander'],
  },
  {
    href: '/tags',
    label: 'dashboard.tags',
    icon: Tag,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/archive',
    label: 'dashboard.archives',
    icon: Archive,
    roles: ['super_admin', 'admin'],
  },
  {
    href: '/files',
    label: 'dashboard.fileManagement',
    icon: FolderOpen,
    roles: ['super_admin', 'admin', 'instructor'],
  },
];

export function Shell({ children }: ShellProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const locale = useLocale() as 'ar' | 'en';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRTL = getDirection(locale) === 'rtl';
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇶🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const getLocalizedPath = (newLocale: string) => {
    // If pathname starts with current locale, replace it
    if (pathname.startsWith(`/${locale}`)) {
      return pathname.replace(`/${locale}`, `/${newLocale}`);
    }
    // If pathname doesn't start with locale, prepend the new locale
    return `/${newLocale}${pathname}`;
  };

  const handleLanguageChange = async (newLocale: string) => {
    // Prevent switching to the same locale
    if (newLocale === locale) return;

    // Save language preference to localStorage
    localStorage.setItem('preferred-language', newLocale);

    // Set cookie via API call for server-side persistence
    try {
      await fetch('/api/language', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: newLocale }),
      });
    } catch (error) {
      console.warn('Failed to save language preference to server:', error);
    }

    // Navigate to the new locale
    const newPath = getLocalizedPath(newLocale);
    router.push(newPath);
  };

  // Translate user names based on locale
  const translateUserName = (name: string) => {
    const nameTranslations: Record<string, { ar: string; en: string }> = {
      'أحمد الكبير': { ar: 'أحمد الكبير', en: 'Ahmed Al-Kabeer' },
      'محمد العبدالله': { ar: 'محمد العبدالله', en: 'Mohammed Al-Abdullah' },
      'فاطمة الزهراء': { ar: 'فاطمة الزهراء', en: 'Fatima Al-Zahra' },
      'خالد الراشد': { ar: 'خالد الراشد', en: 'Khalid Al-Rashid' },
      'عمر الحمد': { ar: 'عمر الحمد', en: 'Omar Al-Hamad' },
      'سارة المحمود': { ar: 'سارة المحمود', en: 'Sara Al-Mahmoud' },
      'محمد الخليفة': { ar: 'محمد الخليفة', en: 'Mohammed Al-Khalifa' },
      'نور السليطي': { ar: 'نور السليطي', en: 'Noor Al-Sulaiti' },
      'علي الثاني': { ar: 'علي الثاني', en: 'Ali Al-Thani' },
      'أحمد المنصوري': { ar: 'أحمد المنصوري', en: 'Ahmed Al-Mansoori' },
    };

    const translation = nameTranslations[name];
    if (translation) {
      return translation[locale as 'ar' | 'en'];
    }
    
    // Fallback: if no translation found, return original name
    return name;
  };

  useEffect(() => {
    // Fetch current session
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSession(data.user ? { user: data.user } : null);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch session:', error);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setSession(null);
      router.push(`/${locale}/auth/login`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <>{children}</>;
  }

  if (!session?.user) {
    return <>{children}</>;
  }

  const userRole = session.user.role;
  const normalizedRole = prismaRoleToRole(userRole);

  // Get the role-based route prefix
  const getRolePrefix = (role: string) => {
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

  const rolePrefix = getRolePrefix(normalizedRole);

  // Filter navigation items for this role and add proper prefixes
  const filteredNavigation = navigationItems
    .filter(item => item.roles.includes(normalizedRole))
    .map(item => ({
      ...item,
      href: item.href === '' ? rolePrefix : `${rolePrefix}${item.href}`,
    }));


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'instructor':
        return 'accent';
      case 'commander':
        return 'secondary';
      case 'trainee':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleTranslationKey = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'users.super_admin';
      case 'admin':
        return 'users.admin';
      case 'instructor':
        return 'users.instructor';
      case 'commander':
        return 'users.commander';
      case 'trainee':
        return 'users.trainee';
      default:
        return 'users.trainee';
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
        isRTL ? 'right-0' : 'left-0',
        sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and title */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">TSF</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">TSF Learning</h1>
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? 'نظام التعلم' : 'Learning Management System'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User profile - moved to top */}
          {session && (
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || undefined} />
                        <AvatarFallback>
                          {(() => {
                            const translatedName = translateUserName(session.user.name);
                            const nameParts = translatedName.split(' ');
                            return getInitials(nameParts[0], nameParts[1] || '');
                          })()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{translateUserName(session.user.name)}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Language Switcher in Profile Menu */}
                    <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-2" />
                        Language
                      </div>
                    </DropdownMenuLabel>
                    {languages.map((language) => (
                      <DropdownMenuItem
                        key={language.code}
                        className="p-0"
                      >
                        <button
                          onClick={() => handleLanguageChange(language.code)}
                          className="flex items-center justify-between w-full text-left hover:bg-accent hover:text-accent-foreground px-2 py-1.5 rounded-sm"
                        >
                          <div className="flex items-center">
                            <span className="mr-2">{language.flag}</span>
                            <span className="text-xs">{language.name}</span>
                          </div>
                          {locale === language.code && (
                            <Check className="h-3 w-3" />
                          )}
                        </button>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      {t('navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{translateUserName(session.user.name)}</p>
                  <Badge variant={getRoleBadgeVariant(normalizedRole)} className="text-xs">
                    {t(getRoleTranslationKey(normalizedRole))}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setSidebarOpen(false);
                    router.push(`/${locale}${item.href}`);
                  }}
                >
                  <Icon className={cn(
                    'h-4 w-4 mr-3',
                    isRTL && 'ml-3 mr-0'
                  )} />
                  <span>{t(item.label)}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile menu button - floating */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-40 bg-background/80 backdrop-blur-sm border shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Notification dropdown - floating */}
        <div className="fixed top-4 right-4 z-40 lg:hidden">
          <NotificationDropdown />
        </div>

        {/* Page content */}
        <main className="flex-1 px-6 pt-3 pb-6 overflow-auto lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
