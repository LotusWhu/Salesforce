"use client";

import dynamic from "next/dynamic";

// Leaflet 操作 DOM/window，必须禁用 SSR，否则 next build 会报错
const DynamicMapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: 420, width: "100%", borderRadius: 12, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}
    >
      地图加载中...
    </div>
  ),
});

export default DynamicMapView;
