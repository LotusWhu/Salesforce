"use client";

import Link from "next/link";
import { useState } from "react";
import { CarpoolRequestDto, CarpoolType } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

const AIRPORTS = [
  { value: "Sydney Airport", label: "悉尼机场 Sydney Airport (SYD)", city: "Sydney" },
  { value: "Melbourne Airport", label: "墨尔本机场 Melbourne Airport (MEL)", city: "Melbourne" },
  { value: "Brisbane Airport", label: "布里斯班机场 Brisbane Airport (BNE)", city: "Brisbane" },
  { value: "Perth Airport", label: "珀斯机场 Perth Airport (PER)", city: "Perth" },
  { value: "Gold Coast Airport", label: "黄金海岸机场 Gold Coast Airport (OOL)", city: "Gold Coast" },
  { value: "Adelaide Airport", label: "阿德莱德机场 Adelaide Airport (ADL)", city: "Adelaide" },
];

type Direction = "TO_AIRPORT" | "FROM_AIRPORT";

export default function CarpoolBookingPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const FLEXIBILITY_OPTIONS = [
    { minutes: 30, label: t("carpool.flexExact"), hint: t("carpool.flexExactHint") },
    { minutes: 120, label: t("carpool.flexFlexible"), hint: t("carpool.flexFlexibleHint") },
    { minutes: 720, label: t("carpool.flexVeryFlexible"), hint: t("carpool.flexVeryFlexibleHint") },
  ];
  const [direction, setDirection] = useState<Direction>("TO_AIRPORT");
  const [airport, setAirport] = useState(AIRPORTS[0].value);
  const [terminal, setTerminal] = useState("");
  const [otherLocation, setOtherLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(1);
  const [fareMode, setFareMode] = useState<"ONE_WAY" | "ROUND_TRIP">("ONE_WAY");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [flexibilityMinutes, setFlexibilityMinutes] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarpoolRequestDto | null>(null);
  const [matchedTrip, setMatchedTrip] = useState<{ id: string; pricePerSeat: number; currency: string; departureTime: string } | null>(null);

  const airportMeta = AIRPORTS.find((a) => a.value === airport)!;
  const timeLabel = direction === "TO_AIRPORT" ? t("carpool.boardingTime") : t("carpool.flightArrivalTime");

  const submit = async () => {
    setError(null);
    setResult(null);
    setMatchedTrip(null);
    if (!otherLocation || !date || !time) {
      setError(direction === "TO_AIRPORT" ? t("carpool.fillPickupTime") : t("carpool.fillDestArrival"));
      return;
    }
    setSubmitting(true);
    try {
      const scheduledTime = new Date(`${date}T${time}:00`).toISOString();
      const returnScheduledTime =
        fareMode === "ROUND_TRIP" && returnDate && returnTime
          ? new Date(`${returnDate}T${returnTime}:00`).toISOString()
          : undefined;

      const type: CarpoolType = direction === "TO_AIRPORT" ? ("AIRPORT_DROPOFF" as CarpoolType) : ("AIRPORT_PICKUP" as CarpoolType);

      const req = await api.post<CarpoolRequestDto>("/carpool/requests", {
        type,
        airport,
        terminal: terminal || undefined,
        otherLocation: { lat: 0, lng: 0, address: otherLocation },
        city: airportMeta.city,
        scheduledTime,
        flightNumber: flightNumber || undefined,
        passengerCount,
        luggageCount,
        fareMode,
        returnScheduledTime,
        flexibilityMinutes,
      });
      setResult(req);
      if (req.status === "MATCHED" && req.matchedTripId) {
        const trip = await api.get<{ id: string; pricePerSeat: number; currency: string; departureTime: string }>(
          `/carpool/trips/${req.matchedTripId}`,
        );
        setMatchedTrip(trip);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("carpool.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card">
          <p>{t("carpool.loginToBook")}</p>
          <a href="/login" className="btn-primary mt-3 inline-block text-sm">
            {t("common.goLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("nav.carpool")}</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/carpool/trips" className="text-brand-600 hover:underline">
            {t("carpool.browseTrips")}
          </Link>
          <Link href="/carpool/new" className="text-brand-600 hover:underline">
            {t("carpool.imDriver")}
          </Link>
        </div>
      </div>

      <div className="card">
        {/* To Airport / From Airport 顶部切换 */}
        <div className="mb-5 flex border-b border-neutral-200">
          {(
            [
              { key: "TO_AIRPORT", label: t("carpool.toAirport") },
              { key: "FROM_AIRPORT", label: t("carpool.fromAirport") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDirection(tab.key)}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors ${
                direction === tab.key
                  ? "border-b-2 border-brand-500 text-brand-600"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">{t("carpool.airportLabel")}</label>
              <select className="input" value={airport} onChange={(e) => setAirport(e.target.value)}>
                {AIRPORTS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">{t("carpool.terminalLabel")}</label>
              <input
                className="input"
                placeholder={t("carpool.terminalPlaceholder")}
                value={terminal}
                onChange={(e) => setTerminal(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">{direction === "TO_AIRPORT" ? t("carpool.pickupLocation") : t("carpool.destAddress")}</label>
            <input
              className="input"
              placeholder={t("carpool.addressPlaceholder")}
              value={otherLocation}
              onChange={(e) => setOtherLocation(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">{t("carpool.dateLabel")}</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">{timeLabel}</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">{t("carpool.flightNumberLabel")}</label>
            <input
              className="input"
              placeholder={t("carpool.flightNumberPlaceholder")}
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">{t("carpool.passengerCount")}</label>
              <input
                type="number"
                min={1}
                max={8}
                className="input"
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="label">{t("carpool.luggageCount")}</label>
              <input
                type="number"
                min={0}
                max={20}
                className="input"
                value={luggageCount}
                onChange={(e) => setLuggageCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="label">{t("carpool.tripType")}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={fareMode === "ONE_WAY"} onChange={() => setFareMode("ONE_WAY")} />
                {t("carpool.oneWay")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={fareMode === "ROUND_TRIP"} onChange={() => setFareMode("ROUND_TRIP")} />
                {t("carpool.roundTrip")}
              </label>
            </div>
          </div>

          {fareMode === "ROUND_TRIP" && (
            <div className="flex gap-3 rounded-lg bg-neutral-50 p-3">
              <div className="flex-1">
                <label className="label">{t("carpool.returnDate")}</label>
                <input type="date" className="input" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="label">{t("carpool.returnTime")}</label>
                <input type="time" className="input" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="label">{t("carpool.flexibility")}</label>
            <div className="grid gap-2">
              {FLEXIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setFlexibilityMinutes(opt.minutes)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    flexibilityMinutes === opt.minutes
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-2 text-neutral-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
            {submitting ? t("carpool.matching") : t("carpool.submitRequest")}
          </button>
        </div>
      </div>

      {result && result.status === "MATCHED" && (
        <div className="card mt-4 border-green-200 bg-green-50">
          <p className="font-semibold text-green-700">{t("carpool.matchedTitle")}</p>
          {matchedTrip && (
            <div className="mt-2 space-y-1 text-sm text-neutral-700">
              <p>
                {t("carpool.departureTime")}: {new Date(matchedTrip.departureTime).toLocaleString()}
              </p>
              <p>
                {t("carpool.currentPrice")}: {matchedTrip.currency} {matchedTrip.pricePerSeat} {t("carpool.perSeat")}
              </p>
            </div>
          )}
          <Link href={`/carpool/${result.matchedTripId}`} className="btn-primary mt-3 inline-block text-sm">
            {t("carpool.viewTripDetail")}
          </Link>
        </div>
      )}

      {result && result.status === "PENDING" && (
        <div className="card mt-4 border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-700">{t("carpool.pendingTitle")}</p>
          <p className="mt-1 text-sm text-neutral-600">{t("carpool.pendingDesc")}</p>
        </div>
      )}
    </div>
  );
}
