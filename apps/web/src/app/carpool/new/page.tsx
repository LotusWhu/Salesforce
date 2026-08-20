"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARPOOL_TYPE_LABELS, CarpoolTripDto, CarpoolType } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

export default function NewCarpoolTripPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city: globalCity } = useLocale();
  const [type, setType] = useState<CarpoolType>(CarpoolType.AIRPORT_PICKUP);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(20);
  const [city, setCity] = useState(globalCity ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>{t("carpool.loginToPublish")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!originAddress || !destinationAddress || !departureTime) {
      setError(t("carpool.fillOriginDest"));
      return;
    }
    setSubmitting(true);
    try {
      const trip = await api.post<CarpoolTripDto>("/carpool/trips", {
        type,
        origin: { lat: 0, lng: 0, address: originAddress },
        destination: { lat: 0, lng: 0, address: destinationAddress },
        departureTime: new Date(departureTime).toISOString(),
        flightNumber: flightNumber || undefined,
        totalSeats,
        pricePerSeat,
        city: city || undefined,
        notes: notes || undefined,
      });
      router.push(`/carpool/${trip.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("carpool.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">{t("carpool.publishTrip")}</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">{t("carpool.typeLabel")}</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as CarpoolType)}>
            {Object.entries(CARPOOL_TYPE_LABELS[locale]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("carpool.originLabel")}</label>
          <input
            className="input"
            value={originAddress}
            onChange={(e) => setOriginAddress(e.target.value)}
            placeholder={t("carpool.originPlaceholder")}
          />
        </div>

        <div>
          <label className="label">{t("carpool.destinationLabel")}</label>
          <input
            className="input"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder={t("carpool.destinationPlaceholder")}
          />
        </div>

        <div>
          <label className="label">{t("carpool.departureTimeLabel")}</label>
          <input type="datetime-local" className="input" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
        </div>

        {type !== "CITY_RIDE" && (
          <div>
            <label className="label">{t("carpool.flightNumberHintLabel")}</label>
            <input
              className="input"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder={t("carpool.flightNumberHintPlaceholder")}
            />
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">{t("carpool.availableSeats")}</label>
            <input type="number" className="input" value={totalSeats} onChange={(e) => setTotalSeats(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="label">{t("carpool.pricePerSeat")}</label>
            <input type="number" className="input" value={pricePerSeat} onChange={(e) => setPricePerSeat(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">{t("carpool.cityLabel")}</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("carpool.cityPlaceholder")} />
        </div>

        <div>
          <label className="label">{t("carpool.notesLabel")}</label>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? t("carpool.publishing") : t("carpool.publish")}
        </button>
      </div>
    </div>
  );
}
