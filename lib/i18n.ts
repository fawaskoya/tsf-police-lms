import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Can be imported from a shared config
const locales = ['ar', 'en'];
const defaultLocale = 'ar';

export default getRequestConfig(async ({ requestLocale }) => {
  // First try to get locale from request
  let locale = await requestLocale;

  // If no locale from request, check cookies for saved preference
  if (!locale || !locales.includes(locale)) {
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get('preferred-language')?.value;

    if (savedLocale && locales.includes(savedLocale)) {
      locale = savedLocale;
    } else {
      locale = defaultLocale;
    }
  }

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
