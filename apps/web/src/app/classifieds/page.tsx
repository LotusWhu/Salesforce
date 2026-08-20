"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedCategory, ClassifiedListingDto, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import DynamicMapView from "@/components/DynamicMapView";

export default function ClassifiedsPage() {
  const { t, locale, city } = useLocale();
  const [category, setCategory] = useState<ClassifiedCategory | "">("");
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<ClassifiedListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<ClassifiedListingDto>>(
          `/classifieds${buildQuery({ category: category || undefined, keyword: keyword || undefined, city: city || undefined })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, keyword, city]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.location)
        .map((item) => ({
          id: item.id,
          lat: item.location!.lat,
          lng: item.location!.lng,
          title: item.title,
          subtitle: item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable"),
          href: `/classifieds/${item.id}`,
        })),
    [data, t],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("nav.classifieds")}</h1>
        <Link href="/classifieds/new" className="btn-primary text-sm">
          + {t("classifieds.publish")}
        </Link>
      </div>

      <input
        className="input mb-4"
        placeholder={t("classifieds.searchPlaceholder")}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory("")}
          >
            {t("common.all")}
          </button>
          {Object.entries(CLASSIFIED_CATEGORY_LABELS[locale]).map(([key, label]) => (
            <button
              key={key}
              className={`btn-secondary text-sm ${category === key ? "border-brand-500 text-brand-600" : ""}`}
              onClick={() => setCategory(key as ClassifiedCategory)}
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
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">{t("classifieds.noData")}</p>}

      {view === "map" && !loading && (
        <div className="mb-4">
          {markers.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("classifieds.noMapResults")}</p>
          ) : (
            <DynamicMapView markers={markers} zoom={11} />
          )}
        </div>
      )}

      {view === "list" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((item) => (
            <Link key={item.id} href={`/classifieds/${item.id}`} className="card hover:shadow-md transition-shadow">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                {CLASSIFIED_CATEGORY_LABELS[locale][item.category]}
              </span>
              <h3 className="mt-1 font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{item.description}</p>
              <p className="mt-2 text-sm font-medium text-brand-600">
                {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
