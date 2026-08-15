import type { Metadata } from "next";
import { Noto_Serif, Space_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "BHXH PRO — Tính mức đóng & Lập bộ hồ sơ đăng ký",
  description: "Công cụ nội bộ hỗ trợ đại lý thuế/kế toán dịch vụ tính mức đóng BHXH và soạn bộ hồ sơ đăng ký tham gia",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${notoSerif.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-serif)] bg-paper text-ink">
        <header className="border-b-2 border-brown bg-paper-dark">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-brown-dark">BHXH PRO</span>
              <span className="text-xs text-ink/60 hidden sm:inline">Tính mức đóng &amp; Lập bộ hồ sơ đăng ký tham gia BHXH</span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:text-brown-dark">Đơn vị</Link>
              <Link href="/ledger" className="hover:text-brown-dark">Sổ theo dõi</Link>
              <Link href="/policy" className="hover:text-brown-dark">Cấu hình chính sách</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-brown/30 text-center text-xs text-ink/50 py-4">
          Công cụ hỗ trợ tính toán/soạn thảo — không thay thế xác nhận chính thức của cơ quan BHXH. Các mức tham chiếu, lương tối thiểu vùng, tỷ lệ đóng cần được xác minh lại theo văn bản hiện hành.
        </footer>
      </body>
    </html>
  );
}
