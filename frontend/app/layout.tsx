import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Community Board",
  description: "Spring Boot API 기반 커뮤니티 게시판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
