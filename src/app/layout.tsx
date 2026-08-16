import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Công cụ hỗ trợ BHXH",
  description:
    "Quản lý đại lý, đơn vị, lao động và hồ sơ giao dịch điện tử BHXH",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
