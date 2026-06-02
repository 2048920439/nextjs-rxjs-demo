import "./globals.css";

import type { Metadata } from "next";

import { ReactScanInit } from "./react-scan";

export const metadata: Metadata = {
  title: "RxJS App",
  description: "RxJS Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ReactScanInit />
        {children}
      </body>
    </html>
  );
}
