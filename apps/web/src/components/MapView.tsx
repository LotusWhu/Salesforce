"use client";

/**
 * 地图组件封装：当前用 OpenStreetMap (Leaflet) 免费瓦片占位，
 * 后续要换 Google Maps 时只需要替换这一个文件里的 TileLayer/坐标拾取逻辑，
 * 上层调用方 (MapView 的 props 接口) 不需要跟着改。
 */

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet 默认图标依赖打包后的相对路径资源，在 Next.js 里会 404，这里改用 CDN 图标
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
}

const DEFAULT_CENTER: [number, number] = [-33.8688, 151.2093]; // 悉尼

function ClickHandler({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ center }: { center?: [number, number] }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) map.setView(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1]]);
  return null;
}

export default function MapView({
  markers = [],
  center,
  zoom = 12,
  height = 420,
  onPick,
  pickedPosition,
}: {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  onPick?: (lat: number, lng: number) => void;
  pickedPosition?: [number, number] | null;
}) {
  const initialCenter = center ?? (markers[0] ? [markers[0].lat, markers[0].lng] : DEFAULT_CENTER);

  return (
    <div style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={initialCenter} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} />
        {onPick && <ClickHandler onPick={onPick} />}
        {pickedPosition && <Marker position={pickedPosition} icon={markerIcon} />}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon}>
            <Popup>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>{m.title}</p>
                {m.subtitle && <p style={{ margin: "4px 0", color: "#666" }}>{m.subtitle}</p>}
                {m.href && (
                  <a href={m.href} style={{ color: "#f7492f", fontWeight: 600 }}>
                    查看详情 →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
