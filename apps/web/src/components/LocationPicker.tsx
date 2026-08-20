"use client";

import { useState } from "react";
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

  const handlePick = (lat: number, lng: number) => {
    onChange({ lat, lng, address: address || undefined });
  };

  return (
    <div>
      <input
        className="input mb-2"
        placeholder="地址描述 (可选，如：悉尼CBD George St 123号)"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          if (value) onChange({ ...value, address: e.target.value || undefined });
        }}
      />
      <p className="mb-2 text-xs text-neutral-500">在地图上点击选择位置{value ? `（已选：${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}）` : ""}</p>
      <DynamicMapView onPick={handlePick} pickedPosition={value ? [value.lat, value.lng] : null} height={280} />
      {value && (
        <button type="button" className="btn-secondary mt-2 text-xs" onClick={() => onChange(null)}>
          清除位置
        </button>
      )}
    </div>
  );
}
