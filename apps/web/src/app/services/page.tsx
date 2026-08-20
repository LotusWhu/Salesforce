"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaginatedResult, SERVICE_CATEGORY_LABELS, ServiceCategory, ServiceListingDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import DynamicMapView from "@/components/DynamicMapView";

export default function ServicesPage() {
  const { t, locale, city } = useLocale();
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [instantOnly, setInstantOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<ServiceListingDto>>(
          `/services${buildQuery({
            category: category || undefined,
            instantOnly: instantOnly || undefined,
            keyword: keyword || undefined,
            city: city || undefined,
          })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, instantOnly, keyword, city]);

  const priceUnit = (priceType: string) => (priceType === "HOURLY" ? t("services.perHour") : t("services.perSession"));

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((s) => s.location)
        .map((s) => ({
          id: s.id,
          lat: s.location!.lat,
          lng: s.location!.lng,
          title: s.title,
          subtitle: `${s.currency} ${s.price} ${priceUnit(s.priceType)}`,
          href: `/services/${s.id}`,
        })),
    [data, t],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("nav.services")}</h1>
        <Link href="/services/new" className="btn-primary text-sm">
          + {t("services.publish")}
        </Link>
      </div>

      <input
        className="input mb-4"
        placeholder={t("services.searchPlaceholder")}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <label className="mb-4 flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={instantOnly} onChange={(e) => setInstantOnly(e.target.checked)} />
        {t("services.instantOnly")}
      </label>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory("")}
          >
            {t("common.all")}
          </button>
          {Object.entries(SERVICE_CATEGORY_LABELS[locale]).map(([key, label]) => (
            <button
              key={key}
              className={`btn-secondary text-sm ${category === key ? "border-brand-500 text-brand-600" : ""}`}
              onClick={() => setCategory(key as ServiceCategory)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${view === "list" ? "bg-brand-500 text-white" : "text-neutral-600"}`}
            onClick={() => setView("list")}
          >
            {t("common.listView")}
          </button>
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${view === "map" ? "bg-brand-500 text-white" : "text-neutral-600"}`}
            onClick={() => setView("map")}
          >
            {t("common.mapView")}
          </button>
        </div>
      </div>

      {loading && <p className="text-neutral-500">{t("common.loading")}</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">{t("services.noData")}</p>}

      {view === "map" && !loading && (
        <div className="mb-4">
          {markers.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("services.noMapResults")}</p>
          ) : (
            <DynamicMapView markers={markers} zoom={11} />
          )}
        </div>
      )}

      {view === "list" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((s) => (
            <Link key={s.id} href={`/services/${s.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {SERVICE_CATEGORY_LABELS[locale][s.category]}
                </span>
                {s.supportsInstantBooking && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                    {t("services.instantBadge")}
                  </span>
                )}
              </div>
              <h3 className="mt-1 font-semibold">{s.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{s.description}</p>
              <p className="mt-2 text-sm font-medium text-brand-600">
                {s.currency} {s.price} {priceUnit(s.priceType)} · {t("services.aboutMinutes")}
                {s.durationMinutes} {t("services.minutes")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
