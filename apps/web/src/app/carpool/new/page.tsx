"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarpoolTripDto, CarpoolType } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { CARPOOL_TYPE_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";

export default function NewCarpoolTripPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [type, setType] = useState<CarpoolType>(CarpoolType.AIRPORT_PICKUP);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(20);
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>请先登录后再发布行程。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!originAddress || !destinationAddress || !departureTime) {
      setError("请填写出发地、目的地和出发时间");
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
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">发布拼车行程</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">类型</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as CarpoolType)}>
            {Object.entries(CARPOOL_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">出发地</label>
          <input className="input" value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="例如：悉尼国际机场 T1" />
        </div>

        <div>
          <label className="label">目的地</label>
          <input className="input" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="例如：Chatswood" />
        </div>

        <div>
          <label className="label">出发时间</label>
          <input type="datetime-local" className="input" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
        </div>

        {type !== "CITY_RIDE" && (
          <div>
            <label className="label">航班号 (可选，方便举牌接机)</label>
            <input className="input" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="例如：CZ321" />
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">可拼座位数</label>
            <input type="number" className="input" value={totalSeats} onChange={(e) => setTotalSeats(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="label">每座价格 (AUD)</label>
            <input type="number" className="input" value={pricePerSeat} onChange={(e) => setPricePerSeat(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">城市</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="例如：悉尼" />
        </div>

        <div>
          <label className="label">备注 (可选)</label>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? "发布中..." : "发布行程"}
        </button>
      </div>
    </div>
  );
}
