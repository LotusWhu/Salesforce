"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClassifiedCategory, ClassifiedListingDto, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { CLASSIFIED_CATEGORY_LABELS } from "@/lib/labels";
import DynamicMapView from "@/components/DynamicMapView";

export default function ClassifiedsPage() {
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
          `/classifieds${buildQuery({ category: category || undefined, keyword: keyword || undefined })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, keyword]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.location)
        .map((item) => ({
          id: item.id,
          lat: item.location!.lat,
          lng: item.location!.lng,
          title: item.title,
          subtitle: item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : "价格面议/免费",
          href: `/classifieds/${item.id}`,
        })),
    [data],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">分类信息</h1>
        <Link href="/classifieds/new" className="btn-primary text-sm">
          + 发布信息
        </Link>
      </div>

      <input
        className="input mb-4"
        placeholder="搜索标题或描述..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory("")}
          >
            全部
          </button>
          {Object.entries(CLASSIFIED_CATEGORY_LABELS).map(([key, label]) => (
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
            列表
          </button>
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${view === "map" ? "bg-brand-500 text-white" : "text-neutral-600"}`}
            onClick={() => setView("map")}
          >
            地图
          </button>
        </div>
      </div>

      {loading && <p className="text-neutral-500">加载中...</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">暂无信息</p>}

      {view === "map" && !loading && (
        <div className="mb-4">
          {markers.length === 0 ? (
            <p className="text-sm text-neutral-500">当前筛选结果中没有带地图位置的信息</p>
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
                {CLASSIFIED_CATEGORY_LABELS[item.category]}
              </span>
              <h3 className="mt-1 font-semibold">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{item.description}</p>
              <p className="mt-2 text-sm font-medium text-brand-600">
                {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : "价格面议/免费"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
