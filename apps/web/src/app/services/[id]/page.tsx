"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookingDto, NextAvailableSlotDto, ServiceCategory, ServiceTier, SERVICE_CATEGORY_TIER } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";

function toLocalDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ServiceDetail {
  id: string;
  providerId: string;
  category: keyof typeof SERVICE_CATEGORY_LABELS;
  title: string;
  description: string;
  priceType: string;
  price: string;
  currency: string;
  durationMinutes: number;
  serviceArea: string | null;
  provider: { id: string; name: string; ratingAvg: number };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickBooking, setQuickBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<ServiceDetail>(`/services/${id}`).then(setService);
  }, [id]);

  if (!service) return <p className="text-neutral-500">加载中...</p>;

  const isImmediateTier = SERVICE_CATEGORY_TIER[service.category as ServiceCategory] === ServiceTier.IMMEDIATE;

  const quickBookEarliest = async () => {
    setError(null);
    setMessage(null);
    setQuickBooking(true);
    try {
      const next = await api.get<NextAvailableSlotDto | null>(`/services/${service.id}/next-available`);
      if (!next) {
        setError("暂时没有可用时段，请手动选择日期时间");
        return;
      }
      const start = new Date(next.scheduledStart);
      setDate(toLocalDateInput(start));
      setStartTime(toLocalTimeInput(start));
      setMessage(`已为你自动选中最早可用时段: ${start.toLocaleString()}，请确认地址后提交预约`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取最早可用时段失败");
    } finally {
      setQuickBooking(false);
    }
  };

  const createBooking = async () => {
    setError(null);
    setMessage(null);
    if (!date || !startTime) {
      setError("请选择预约日期和时间");
      return;
    }
    setBusy(true);
    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);
      const created = await api.post<BookingDto>("/bookings", {
        serviceId: service.id,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        address: address ? { lat: 0, lng: 0, address } : undefined,
        notes: notes || undefined,
      });
      setBooking(created);
      setMessage("预约已提交，验证码已发送至你的手机，请输入验证码确认预约");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "预约失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!booking) return;
    setError(null);
    setBusy(true);
    try {
      const confirmed = await api.post<BookingDto>(`/bookings/${booking.id}/confirm-otp`, { code: otpCode });
      setBooking(confirmed);
      setMessage("预约已确认！已尝试同步到服务提供者的 Google 日历。");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "验证码校验失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
          {SERVICE_CATEGORY_LABELS[service.category]}
        </span>
        <h1 className="mt-2 text-xl font-bold">{service.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-neutral-700">{service.description}</p>
        <p className="mt-2 text-sm font-medium text-brand-600">
          {service.currency} {service.price} {service.priceType === "HOURLY" ? "/ 小时" : "/ 次"} · 约
          {service.durationMinutes}分钟
        </p>
        <p className="mt-1 text-sm text-neutral-500">服务者: {service.provider.name} · 服务区域: {service.serviceArea ?? "-"}</p>
        {service.availability.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            可预约: {service.availability.map((a) => `${WEEKDAYS[a.dayOfWeek]} ${a.startTime}-${a.endTime}`).join("; ")}
          </p>
        )}
      </div>

      {!user && (
        <div className="card">
          <p>请先登录后再预约。</p>
          <a href="/login" className="btn-primary mt-3 inline-block text-sm">
            去登录
          </a>
        </div>
      )}

      {user && !booking && isImmediateTier && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">即时/家政服务，可快速下单</h2>
              <p className="text-sm text-neutral-500">一键选中最早可用时段，确认地址即可提交</p>
            </div>
            <button className="btn-secondary text-sm" disabled={quickBooking} onClick={quickBookEarliest}>
              {quickBooking ? "查找中..." : "立即预约(最早可用)"}
            </button>
          </div>
        </div>
      )}

      {user && !booking && (
        <div className="card space-y-3">
          <h2 className="font-semibold">预约此服务</h2>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <div className="flex gap-3">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <input
            className="input"
            placeholder="服务地址"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <textarea
            className="input"
            placeholder="备注 (可选)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy} onClick={createBooking}>
            {busy ? "提交中..." : "提交预约"}
          </button>
        </div>
      )}

      {booking && booking.status === "PENDING_CONFIRMATION" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">输入短信验证码确认预约</h2>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <input
            className="input"
            placeholder="6位验证码"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy || otpCode.length !== 6} onClick={confirmOtp}>
            确认预约
          </button>
        </div>
      )}

      {booking && booking.status === "CONFIRMED" && (
        <div className="card">
          <p className="text-green-600">{message ?? "预约已确认"}</p>
        </div>
      )}
    </div>
  );
}
