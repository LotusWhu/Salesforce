"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUPPORTED_CITIES } from "@localhub/shared-types";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

export function NavBar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { locale, setLocale, city, setCity, t } = useLocale();

  const NAV_ITEMS = [
    { href: "/tasks", label: t("nav.tasks") },
    { href: "/services", label: t("nav.services") },
    { href: "/carpool", label: t("nav.carpool") },
    { href: "/classifieds", label: t("nav.classifieds") },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-500">
          {t("app.name")}
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
        <div className="flex items-center gap-2">
          <select
            aria-label={t("city.switcherTitle")}
            className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600"
            value={city ?? ""}
            onChange={(e) => setCity(e.target.value || null)}
          >
            <option value="">{t("city.all")}</option>
            {SUPPORTED_CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c[locale]}
              </option>
            ))}
          </select>
          <select
            aria-label={t("lang.label")}
            className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "zh" | "en")}
          >
            <option value="zh">{t("lang.zh")}</option>
            <option value="en">{t("lang.en")}</option>
          </select>
          {!loading && !user && (
            <Link href="/login" className="btn-primary text-sm">
              {t("nav.login")}
            </Link>
          )}
          {!loading && user && (
            <div className="flex items-center gap-3">
              <Link href="/me" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                {user.name}
              </Link>
              <button onClick={logout} className="btn-secondary text-sm">
                {t("nav.logout")}
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
