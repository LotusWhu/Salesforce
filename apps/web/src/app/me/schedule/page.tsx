"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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

const STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "待客户确认",
  CONFIRMED: "已确认",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  NO_SHOW: "未到场",
};

function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(key: string) {
  const d = new Date(`${key}T00:00:00`);
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekday}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MySchedulePage() {
  const { user, loading: authLoading } = useAuth();
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

  if (authLoading) return <p className="text-neutral-500">加载中...</p>;

  if (!user) {
    return (
      <div className="card max-w-md">
        <p>请先登录。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
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
      setError(e instanceof ApiError ? e.message : "操作失败");
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
          <h1 className="text-xl font-bold">我的预约日程</h1>
          <p className="mt-1 text-sm text-neutral-500">按日期分组展示客户预约你服务的时间安排，类似日历日程表</p>
        </div>
        <Link href="/me" className="btn-secondary text-sm">
          返回个人中心
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {bookings === null && <p className="text-neutral-500">加载中...</p>}
      {bookings !== null && bookings.length === 0 && (
        <div className="card">
          <p className="text-neutral-500">暂时没有客户预约你的服务</p>
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
                    <p className="mt-1 text-sm text-neutral-500">客户: {b.customer.name}</p>
                    {b.address?.address && <p className="mt-1 text-sm text-neutral-500">地址: {b.address.address}</p>}
                    {b.notes && <p className="mt-1 text-sm text-neutral-500">备注: {b.notes}</p>}
                  </div>
                  <span className="whitespace-nowrap rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </div>
                {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-primary text-sm"
                      disabled={busyId === b.id}
                      onClick={() => run(b.id, () => api.post(`/bookings/${b.id}/complete`))}
                    >
                      标记完成
                    </button>
                    <button
                      className="btn-secondary text-sm"
                      disabled={busyId === b.id}
                      onClick={() => run(b.id, () => api.post(`/bookings/${b.id}/cancel`))}
                    >
                      取消预约
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
