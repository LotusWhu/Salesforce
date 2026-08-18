"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginatedResult, ServiceCategory, ServiceListingDto } from "@renrenbang/shared-types";
import { api, buildQuery } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";

export default function ServicesPage() {
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(`/services${buildQuery({ category: category || undefined })}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">上门服务预约</h1>
        <Link href="/services/new" className="btn-primary text-sm">
          + 发布服务
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
          onClick={() => setCategory("")}
        >
          全部
        </button>
        {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`btn-secondary text-sm ${category === key ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory(key as ServiceCategory)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-neutral-500">加载中...</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">暂无服务，快来发布第一个吧</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.items.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`} className="card hover:shadow-md transition-shadow">
            <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
              {SERVICE_CATEGORY_LABELS[s.category]}
            </span>
            <h3 className="mt-1 font-semibold">{s.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{s.description}</p>
            <p className="mt-2 text-sm font-medium text-brand-600">
              {s.currency} {s.price} {s.priceType === "HOURLY" ? "/ 小时" : "/ 次"} · 约{s.durationMinutes}分钟
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
