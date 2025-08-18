import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

export const locales = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async ({locale}) => {
  let finalLocale = 'en';
  console.log('getRequestConfig called with locale:', locale);
  
  // 验证locale
  if (!locale || !locales.includes(locale as any)) {
    console.log('Invalid locale:', locale);
  } else {
    finalLocale = locale
  }

  try {
    const messages = await import(`./messages/${finalLocale}.json`);
    return {
      locale: finalLocale,
      messages: messages.default
    };
  } catch (error) {
    console.log('Failed to load messages for locale:', finalLocale, error);
    throw error;
  }
});