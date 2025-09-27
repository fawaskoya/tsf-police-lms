'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Globe className="h-4 w-4 mr-2" />
          <span className="truncate">
            {languages.find(lang => lang.code === locale)?.name || locale}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
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
                <span>{language.name}</span>
              </div>
              {locale === language.code && (
                <Check className="h-4 w-4" />
              )}
            </button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
