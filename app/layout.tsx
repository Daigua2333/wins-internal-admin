import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WINS Internal Admin",
  description: "Internal operations admin for WINS International Travel Group",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
