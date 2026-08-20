"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CARPOOL_TYPE_LABELS, CarpoolTripDto, CarpoolType, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";

export default function CarpoolTripsPage() {
  const { t, locale } = useLocale();
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
        <div>
          <Link href="/carpool" className="text-sm text-brand-600 hover:underline">
            {t("carpool.backToBooking")}
          </Link>
          <h1 className="mt-1 text-xl font-bold">{t("carpool.browseTripsTitle")}</h1>
        </div>
        <Link href="/carpool/new" className="btn-primary text-sm">
          {t("carpool.imDriverPublish")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`btn-secondary text-sm ${type === "" ? "border-brand-500 text-brand-600" : ""}`}
          onClick={() => setType("")}
        >
          {t("common.all")}
        </button>
        {Object.entries(CARPOOL_TYPE_LABELS[locale]).map(([key, label]) => (
          <button
            key={key}
            className={`btn-secondary text-sm ${type === key ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setType(key as CarpoolType)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-neutral-500">{t("common.loading")}</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">{t("carpool.noTrips")}</p>}

      <div className="grid gap-3">
        {data?.items.map((trip) => (
          <Link key={trip.id} href={`/carpool/${trip.id}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {CARPOOL_TYPE_LABELS[locale][trip.type]}
                </span>
                <h3 className="mt-1 font-semibold">
                  {trip.origin.address} → {trip.destination.address}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("carpool.departureTime")}: {new Date(trip.departureTime).toLocaleString()}
                  {trip.flightNumber ? ` · ${t("carpool.flightPrefix")} ${trip.flightNumber}` : ""}
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-brand-600">
                {trip.currency} {trip.pricePerSeat}{t("carpool.perSeat")}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {t("carpool.seatsRemaining")}: {trip.seatsAvailable} / {trip.totalSeats}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
