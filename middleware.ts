// middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed', // 或 'always'，按你习惯
});

export const config = {
  matcher: [
    // Match the root path
    '/',
    // Match all paths that start with a locale
    '/(en|zh|ja|ko|fr|de|es|pt)/:path*',
    // Match all other paths except Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ]
};
