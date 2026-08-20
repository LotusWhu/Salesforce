"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

export default function HomePage() {
  const { t } = useLocale();

  const MODULES = [
    { href: "/tasks", emoji: "🏃", title: t("nav.tasks"), desc: t("home.tasksDesc") },
    { href: "/services", emoji: "🧹", title: t("nav.services"), desc: t("home.servicesDesc") },
    { href: "/carpool", emoji: "🚗", title: t("nav.carpool"), desc: t("home.carpoolDesc") },
    { href: "/classifieds", emoji: "📋", title: t("nav.classifieds"), desc: t("home.classifiedsDesc") },
  ];

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("home.heroTitle")}</h1>
        <p className="mt-2 max-w-2xl text-brand-50">{t("home.heroSubtitle")}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="card flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="text-3xl">{m.emoji}</div>
            <div className="text-lg font-semibold">{m.title}</div>
            <p className="text-sm text-neutral-600">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
