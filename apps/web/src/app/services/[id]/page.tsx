"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BookingDto,
  ConversationContextType,
  NextAvailableSlotDto,
  SERVICE_CATEGORY_LABELS,
  ServiceCategory,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import PhotoGallery from "@/components/PhotoGallery";
import MessageThread from "@/components/MessageThread";

function toLocalDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ServiceDetail {
  id: string;
  providerId: string;
  category: ServiceCategory;
  title: string;
  description: string;
  priceType: string;
  price: string;
  currency: string;
  durationMinutes: number;
  serviceArea: string | null;
  supportsInstantBooking: boolean;
  photos: string[];
  provider: { id: string; name: string; ratingAvg: number };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  if (!service) return <p className="text-neutral-500">{t("common.loading")}</p>;

  const priceUnit = service.priceType === "HOURLY" ? t("services.perHour") : t("services.perSession");

  const quickBookEarliest = async () => {
    setError(null);
    setMessage(null);
    setQuickBooking(true);
    try {
      const next = await api.get<NextAvailableSlotDto | null>(`/services/${service.id}/next-available`);
      if (!next) {
        setError(t("services.noSlotsAvailable"));
        return;
      }
      const start = new Date(next.scheduledStart);
      setDate(toLocalDateInput(start));
      setStartTime(toLocalTimeInput(start));
      setMessage(`${t("services.quickBookPicked")}: ${start.toLocaleString()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.fetchSlotFailed"));
    } finally {
      setQuickBooking(false);
    }
  };

  const createBooking = async () => {
    setError(null);
    setMessage(null);
    if (!date || !startTime) {
      setError(t("services.selectDateTime"));
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
      setMessage(t("services.bookingSubmitted"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.bookingFailed"));
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
      setMessage(t("services.bookingConfirmed"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.otpFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
          {SERVICE_CATEGORY_LABELS[locale][service.category]}
        </span>
        <h1 className="mt-2 text-xl font-bold">{service.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-neutral-700">{service.description}</p>
        <p className="mt-2 text-sm font-medium text-brand-600">
          {service.currency} {service.price} {priceUnit} · {t("services.aboutMinutes")}
          {service.durationMinutes} {t("services.minutes")}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {t("services.provider")}: {service.provider.name} · {t("services.serviceArea")}: {service.serviceArea ?? "-"}
        </p>
        {service.availability.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            {t("services.availableTimes")}: {service.availability.map((a) => `${WEEKDAYS[a.dayOfWeek]} ${a.startTime}-${a.endTime}`).join("; ")}
          </p>
        )}
        <PhotoGallery urls={service.photos} />
      </div>

      {!user && (
        <div className="card">
          <p>{t("services.loginToBook")}</p>
          <a href="/login" className="btn-primary mt-3 inline-block text-sm">
            {t("common.goLogin")}
          </a>
        </div>
      )}

      {user && !booking && service.supportsInstantBooking && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{t("services.instantSupport")}</h2>
              <p className="text-sm text-neutral-500">{t("services.instantSupportDesc")}</p>
            </div>
            <button className="btn-secondary text-sm" disabled={quickBooking} onClick={quickBookEarliest}>
              {quickBooking ? t("services.searching") : t("services.bookNowEarliest")}
            </button>
          </div>
        </div>
      )}

      {user && !booking && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{t("services.bookThisService")}</h2>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <div className="flex gap-3">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <input
            className="input"
            placeholder={t("services.addressLabel")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <textarea
            className="input"
            placeholder={t("services.notesLabel")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy} onClick={createBooking}>
            {busy ? t("services.submitting") : t("services.submitBooking")}
          </button>
        </div>
      )}

      {booking && booking.status === "PENDING_CONFIRMATION" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{t("services.enterOtpTitle")}</h2>
          {message && <p className="text-sm text-green-600">{message}</p>}
          <input
            className="input"
            placeholder={t("services.otpPlaceholder")}
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy || otpCode.length !== 6} onClick={confirmOtp}>
            {t("services.confirmBooking")}
          </button>
        </div>
      )}

      {booking && booking.status === "CONFIRMED" && (
        <div className="card">
          <p className="text-green-600">{message ?? t("services.bookingConfirmedFallback")}</p>
        </div>
      )}

      {booking && <MessageThread contextType={ConversationContextType.BOOKING} contextId={booking.id} />}
    </div>
  );
}
