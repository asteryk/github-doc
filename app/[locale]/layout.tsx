import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { Inter } from 'next/font/google';
import '../globals.css';
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub Document Editor",
  description: "Simple GitHub document editor with manual sync",
  keywords: ["GitHub", "Document Editor", "Markdown", "Sync"],
  authors: [{ name: "GitHub Doc Editor" }],
  viewport: "width=device-width, initial-scale=1",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }
  console.log('locale: ', locale, locales.includes(locale as any));
  const messages = await getMessages({
      locale
  });
  console.log('messages, locale: ', messages, locale)
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}