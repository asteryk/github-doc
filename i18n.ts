import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

export const locales = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt'] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async ({locale}) => {
  console.log('getRequestConfig called with locale:', locale);
  
  // 验证locale，如果无效则使用默认值
  if (!locale || !locales.includes(locale as any)) {
    console.log('Invalid locale, using default:', locale);
    locale = 'en';
  }

  try {
    const messages = await import(`./messages/${locale}.json`);
    return {
      locale,
      messages: messages.default
    };
  } catch (error) {
    console.log('Failed to load messages for locale:', locale, error);
    // 如果加载失败，尝试加载默认语言
    if (locale !== 'en') {
      try {
        const fallbackMessages = await import(`./messages/en.json`);
        return {
          locale: 'en',
          messages: fallbackMessages.default
        };
      } catch (fallbackError) {
        console.error('Failed to load fallback messages:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
});