"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CARPOOL_TYPE_LABELS, CarpoolType, ConversationContextType, GeoPoint } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import MessageThread from "@/components/MessageThread";

interface TripDetail {
  id: string;
  driverId: string;
  type: CarpoolType;
  origin: GeoPoint;
  destination: GeoPoint;
  departureTime: string;
  flightNumber: string | null;
  totalSeats: number;
  seatsAvailable: number;
  pricePerSeat: string;
  currency: string;
  notes: string | null;
  status: string;
  driver: { id: string; name: string; ratingAvg: number };
  bookings: { id: string; seats: number; status: string; passenger: { id: string; name: string } }[];
}

export default function CarpoolTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => api.get<TripDetail>(`/carpool/trips/${id}`).then(setTrip);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!trip) return <p className="text-neutral-500">{t("common.loading")}</p>;

  const isDriver = user?.id === trip.driverId;
  const myBooking = trip.bookings.find((b) => b.passenger.id === user?.id);

  const bookSeats = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await api.post(`/carpool/trips/${id}/bookings`, { seats });
      setMessage(t("carpool.bookSuccess"));
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("carpool.bookFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
          {CARPOOL_TYPE_LABELS[locale][trip.type]}
        </span>
        <h1 className="mt-2 text-xl font-bold">
          {trip.origin.address} → {trip.destination.address}
        </h1>
        <div className="mt-2 space-y-1 text-sm text-neutral-600">
          <p>
            {t("carpool.departureTime")}: {new Date(trip.departureTime).toLocaleString()}
          </p>
          {trip.flightNumber && (
            <p>
              {t("carpool.flightNumberColon")}: {trip.flightNumber}
            </p>
          )}
          <p>
            {t("carpool.driver")}: {trip.driver.name}
          </p>
          <p>
            {t("carpool.price")}: {trip.currency} {trip.pricePerSeat} {t("carpool.perSeat")} · {t("carpool.remaining")}{" "}
            {trip.seatsAvailable} / {trip.totalSeats} {t("carpool.seatsUnit")}
          </p>
          {trip.notes && (
            <p>
              {t("carpool.notes")}: {trip.notes}
            </p>
          )}
        </div>
      </div>

      {!user && (
        <div className="card">
          <p>{t("carpool.loginToBookSeats")}</p>
          <a href="/login" className="btn-primary mt-3 inline-block text-sm">
            {t("common.goLogin")}
          </a>
        </div>
      )}

      {user && !isDriver && !myBooking && trip.status === "OPEN" && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{t("carpool.bookSeats")}</h2>
          <input
            type="number"
            min={1}
            max={trip.seatsAvailable}
            className="input"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <button className="btn-primary w-full" disabled={busy} onClick={bookSeats}>
            {busy ? t("services.submitting") : `${t("carpool.bookNSeats")} ${seats} ${t("carpool.seatsSuffix")}`}
          </button>
        </div>
      )}

      {myBooking && (
        <div className="card">
          <p>
            {t("carpool.youBooked")} {myBooking.seats} {t("carpool.seatsSuffix")}，{t("common.status")}: {myBooking.status}
          </p>
        </div>
      )}

      {isDriver && trip.bookings.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-semibold">{t("carpool.passengerList")}</h2>
          {trip.bookings.map((b) => (
            <p key={b.id} className="text-sm text-neutral-600">
              {b.passenger.name} · {b.seats} {t("carpool.seatsUnit")} · {b.status}
            </p>
          ))}
        </div>
      )}

      <MessageThread contextType={ConversationContextType.CARPOOL_TRIP} contextId={trip.id} />
    </div>
  );
}
