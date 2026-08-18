"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CarpoolTripDto, CarpoolType, PaginatedResult } from "@renrenbang/shared-types";
import { api, buildQuery } from "@/lib/api";
import { CARPOOL_TYPE_LABELS } from "@/lib/labels";

export default function CarpoolPage() {
  const [type, setType] = useState<CarpoolType | "">("");
  const [data, setData] = useState<PaginatedResult<CarpoolTripDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<CarpoolTripDto>>(`/carpool/trips${buildQuery({ type: type || undefined })}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">拼车接送机</h1>
        <Link href="/carpool/new" className="btn-primary text-sm">
          + 发布行程
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`btn-secondary text-sm ${type === "" ? "border-brand-500 text-brand-600" : ""}`}
          onClick={() => setType("")}
        >
          全部
        </button>
        {Object.entries(CARPOOL_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`btn-secondary text-sm ${type === key ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setType(key as CarpoolType)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-neutral-500">加载中...</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">暂无行程，快来发布第一个吧</p>}

      <div className="grid gap-3">
        {data?.items.map((trip) => (
          <Link key={trip.id} href={`/carpool/${trip.id}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {CARPOOL_TYPE_LABELS[trip.type]}
                </span>
                <h3 className="mt-1 font-semibold">
                  {trip.origin.address} → {trip.destination.address}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  出发时间: {new Date(trip.departureTime).toLocaleString()}
                  {trip.flightNumber ? ` · 航班 ${trip.flightNumber}` : ""}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-brand-600">
                {trip.currency} {trip.pricePerSeat}/座
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">剩余座位: {trip.seatsAvailable} / {trip.totalSeats}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
