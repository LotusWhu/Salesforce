"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaginatedResult, ServiceCategory, ServiceListingDto, ServiceTier, SERVICE_CATEGORY_TIER } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";

const TIER_TABS: { key: ServiceTier; label: string; hint: string }[] = [
  { key: ServiceTier.IMMEDIATE, label: "即时/家政", hint: "保洁、美甲、理发等，支持最早可用时间快速下单" },
  { key: ServiceTier.BIDDING, label: "竞价/比价", hint: "钢琴教学、学科辅导等，货比三家再下单" },
];

export default function ServicesPage() {
  const [tier, setTier] = useState<ServiceTier>(ServiceTier.IMMEDIATE);
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const categoriesInTier = useMemo(
    () => Object.entries(SERVICE_CATEGORY_LABELS).filter(([key]) => SERVICE_CATEGORY_TIER[key as ServiceCategory] === tier),
    [tier],
  );

  useEffect(() => {
    setCategory("");
  }, [tier]);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(`/services${buildQuery({ category: category || undefined })}`)
      .then((res) => {
        // tier 是前端展示层的分组，服务端按 category 过滤后这里再按 tier 兜底过滤一次
        setData({ ...res, items: res.items.filter((s) => SERVICE_CATEGORY_TIER[s.category] === tier) });
      })
      .finally(() => setLoading(false));
  }, [category, tier]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">上门服务预约</h1>
        <Link href="/services/new" className="btn-primary text-sm">
          + 发布服务
        </Link>
      </div>

      <div className="mb-4 flex border-b border-neutral-200">
        {TIER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTier(t.key)}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
              tier === t.key ? "border-b-2 border-brand-500 text-brand-600" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-neutral-500">{TIER_TABS.find((t) => t.key === tier)?.hint}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
          onClick={() => setCategory("")}
        >
          全部
        </button>
        {categoriesInTier.map(([key, label]) => (
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
