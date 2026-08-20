"use client";

import { useEffect, useRef, useState } from "react";
import { GeocodeResultDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import DynamicMapView from "./DynamicMapView";

export interface PickedLocation {
  lat: number;
  lng: number;
  address?: string;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
}) {
  const [address, setAddress] = useState(value?.address ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeResultDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(value ? [value.lat, value.lng] : undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!address || address.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get<GeocodeResultDto[]>(`/geocode?q=${encodeURIComponent(address)}`);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handlePick = (lat: number, lng: number) => {
    onChange({ lat, lng, address: address || undefined });
    setShowSuggestions(false);
  };

  const selectSuggestion = (s: GeocodeResultDto) => {
    setAddress(s.displayName);
    setMapCenter([s.lat, s.lng]);
    onChange({ lat: s.lat, lng: s.lng, address: s.displayName });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div>
      <div className="relative">
        <input
          className="input mb-2"
          placeholder="输入地址搜索，或直接在地图上点选位置"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setShowSuggestions(true);
            if (value) onChange({ ...value, address: e.target.value || undefined });
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && (searching || suggestions.length > 0) && (
          <div className="absolute z-10 mt-[-4px] w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
            {searching && <div className="px-3 py-2 text-xs text-neutral-400">搜索中...</div>}
            {!searching &&
              suggestions.map((s, idx) => (
                <button
                  key={`${s.lat}-${s.lng}-${idx}`}
                  type="button"
                  className="block w-full truncate px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  onClick={() => selectSuggestion(s)}
                >
                  {s.displayName}
                </button>
              ))}
          </div>
        )}
      </div>
      <p className="mb-2 text-xs text-neutral-500">
        在地图上点击选择位置{value ? `（已选：${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}）` : ""}
      </p>
      <DynamicMapView onPick={handlePick} pickedPosition={value ? [value.lat, value.lng] : null} center={mapCenter} height={280} />
      {value && (
        <button type="button" className="btn-secondary mt-2 text-xs" onClick={() => onChange(null)}>
          清除位置
        </button>
      )}
    </div>
  );
}
