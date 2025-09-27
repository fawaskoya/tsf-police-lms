import { Locale } from '@/types/i18n';

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getOppositeAlignment(locale: Locale): 'left' | 'right' {
  return isRTL(locale) ? 'left' : 'right';
}

export function getAlignment(locale: Locale): 'left' | 'right' {
  return isRTL(locale) ? 'right' : 'left';
}
