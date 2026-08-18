"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/tasks", label: "跑腿代办" },
  { href: "/services", label: "上门服务" },
  { href: "/carpool", label: "拼车接送机" },
  { href: "/classifieds", label: "分类信息" },
];

export function NavBar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-500">
          邻里帮 RenRenBang
        </Link>
        <nav className="hidden gap-4 sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium ${
                pathname?.startsWith(item.href) ? "text-brand-500" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div>
          {!loading && !user && (
            <Link href="/login" className="btn-primary text-sm">
              登录 / 注册
            </Link>
          )}
          {!loading && user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600">{user.name}</span>
              <button onClick={logout} className="btn-secondary text-sm">
                退出
              </button>
            </div>
          )}
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap text-sm font-medium ${
              pathname?.startsWith(item.href) ? "text-brand-500" : "text-neutral-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
