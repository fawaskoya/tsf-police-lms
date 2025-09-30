'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';

interface WelcomeHeaderProps {
  userName: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const router = useRouter();
  const locale = useLocale();

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

  const translatedName = translateUserName(userName);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === 'ar' ? 'مرحباً' : 'Welcome'}, {translatedName}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar' ? 'نظرة عامة' : 'Overview'}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={() => router.push(`/${locale}/admin/courses/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          {locale === 'ar' ? 'دورة جديدة' : 'New Course'}
        </Button>
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/sessions/new`)}>
          <Calendar className="mr-2 h-4 w-4" />
          {locale === 'ar' ? 'جلسة جديدة' : 'New Session'}
        </Button>
      </div>
    </div>
  );
}
