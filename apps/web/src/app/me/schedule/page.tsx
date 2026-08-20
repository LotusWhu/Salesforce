"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BOOKING_STATUS_LABELS, BookingStatus } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

interface ScheduleBooking {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes: string | null;
  address: { lat: number; lng: number; address?: string } | null;
  service: { id: string; title: string; durationMinutes: number };
  customer: { id: string; name: string; avatarUrl: string | null };
}

function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MySchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const WEEKDAYS = [
    t("services.weekdaySun"),
    t("services.weekdayMon"),
    t("services.weekdayTue"),
    t("services.weekdayWed"),
    t("services.weekdayThu"),
    t("services.weekdayFri"),
    t("services.weekdaySat"),
  ];
  const formatDayLabel = (key: string) => {
    const d = new Date(`${key}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAYS[d.getDay()]}`;
  };
  const [bookings, setBookings] = useState<ScheduleBooking[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api.get<ScheduleBooking[]>("/bookings/mine?as=provider").then((items) =>
      setBookings([...items].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())),
    );

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return <p className="text-neutral-500">{t("common.loading")}</p>;

  if (!user) {
    return (
      <div className="card max-w-md">
        <p>{t("common.loginFirst")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setError(null);
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("schedule.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const groups = new Map<string, ScheduleBooking[]>();
  (bookings ?? []).forEach((b) => {
    const key = dateKey(b.scheduledStart);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });
  const sortedKeys = [...groups.keys()].sort();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("schedule.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("schedule.groupedDesc")}</p>
        </div>
        <Link href="/me" className="btn-secondary text-sm">
          {t("schedule.backToProfile")}
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {bookings === null && <p className="text-neutral-500">{t("common.loading")}</p>}
      {bookings !== null && bookings.length === 0 && (
        <div className="card">
          <p className="text-neutral-500">{t("schedule.noBookings")}</p>
        </div>
      )}

      {sortedKeys.map((key) => (
        <div key={key}>
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">{formatDayLabel(key)}</h2>
          <div className="space-y-2">
            {groups.get(key)!.map((b) => (
              <div key={b.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {formatTime(b.scheduledStart)} - {formatTime(b.scheduledEnd)} · {b.service.title}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {t("schedule.customer")}: {b.customer.name}
                    </p>
                    {b.address?.address && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {t("schedule.address")}: {b.address.address}
                      </p>
                    )}
                    {b.notes && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {t("schedule.notes")}: {b.notes}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                    {BOOKING_STATUS_LABELS[locale][b.status as BookingStatus] ?? b.status}
                  </span>
                </div>
                {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-primary text-sm"
                      disabled={busyId === b.id}
                      onClick={() => run(b.id, () => api.post(`/bookings/${b.id}/complete`))}
                    >
                      {t("schedule.complete")}
                    </button>
                    <button
                      className="btn-secondary text-sm"
                      disabled={busyId === b.id}
                      onClick={() => run(b.id, () => api.post(`/bookings/${b.id}/cancel`))}
                    >
                      {t("schedule.cancel")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
