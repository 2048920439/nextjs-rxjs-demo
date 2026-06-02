import "./globals.scss";

import { Metadata } from "next";
import { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "RxJS App",
  description: "RxJS Application",
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="zh-CN">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
