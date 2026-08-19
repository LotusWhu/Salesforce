import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "邻里帮 RenRenBang - 华人生活服务平台",
  description: "任务外包/跑腿代办、上门服务预约、拼车接送机、分类信息",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
