"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreateServiceListingDto,
  PriceType,
  SERVICE_CATEGORY_LABELS,
  ServiceCategory,
  ServiceListingDto,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewServicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city } = useLocale();
  const WEEKDAYS = [
    t("services.weekdaySun"),
    t("services.weekdayMon"),
    t("services.weekdayTue"),
    t("services.weekdayWed"),
    t("services.weekdayThu"),
    t("services.weekdayFri"),
    t("services.weekdaySat"),
  ];
  const [form, setForm] = useState<CreateServiceListingDto>({
    category: ServiceCategory.HOUSE_CLEANING,
    title: "",
    description: "",
    priceType: PriceType.FIXED,
    price: 0,
    currency: "AUD",
    durationMinutes: 60,
    city: city ?? undefined,
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [activeDays, setActiveDays] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>{t("services.loginToPublish")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description || !form.price) {
      setError(t("services.fillRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ServiceListingDto>("/services", {
        ...form,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
      });
      const slots = Object.entries(activeDays)
        .filter(([, on]) => on)
        .map(([day]) => ({ dayOfWeek: Number(day), startTime, endTime }));
      if (slots.length > 0) {
        await api.post(`/services/${listing.id}/availability`, { slots });
      }
      router.push(`/services/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">{t("services.publish")}</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">{t("services.categoryLabel")}</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
          >
            {Object.entries(SERVICE_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("services.titleLabel")}</label>
          <input
            className="input"
            placeholder={t("services.titlePlaceholder")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t("services.descLabel")}</label>
          <textarea
            className="input min-h-24"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">{t("services.priceTypeLabel")}</label>
            <select
              className="input"
              value={form.priceType}
              onChange={(e) => setForm({ ...form, priceType: e.target.value as PriceType })}
            >
              <option value={PriceType.FIXED}>{t("services.priceTypeFixed")}</option>
              <option value={PriceType.HOURLY}>{t("services.priceTypeHourly")}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label">{t("services.priceLabel")}</label>
            <input
              type="number"
              className="input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="label">{t("services.durationLabel")}</label>
          <input
            type="number"
            className="input"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="label">{t("services.cityLabel")}</label>
          <input
            className="input"
            placeholder={t("services.cityPlaceholder")}
            value={form.city ?? ""}
            onChange={(e) => setForm({ ...form, city: e.target.value, serviceArea: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={form.supportsInstantBooking ?? false}
            onChange={(e) => setForm({ ...form, supportsInstantBooking: e.target.checked })}
          />
          {t("services.instantField")}
        </label>

        <div>
          <label className="label">{t("services.locationLabel")}</label>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        <div>
          <label className="label">{t("services.photosLabel")}</label>
          <ImageUploader urls={form.photos ?? []} onChange={(photos) => setForm({ ...form, photos })} />
        </div>

        <div>
          <label className="label">{t("services.availabilityLabel")}</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                className={`btn-secondary text-xs ${activeDays[idx] ? "border-brand-500 text-brand-600" : ""}`}
                onClick={() => setActiveDays({ ...activeDays, [idx]: !activeDays[idx] })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <span className="self-center">{t("services.to")}</span>
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? t("services.publishing") : t("services.publish")}
        </button>
      </div>
    </div>
  );
}
