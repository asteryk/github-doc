import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub 文档编辑器",
  description: "简单的GitHub文档编辑器，支持手动同步",
  keywords: ["GitHub", "文档编辑", "Markdown", "同步"],
  authors: [{ name: "GitHub Doc Editor" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
