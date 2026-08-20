import { useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

/**
 * 地图组件封装：用 WebView 加载一个自包含的 Leaflet + OpenStreetMap 免费瓦片页面占位，
 * 这样 iOS/Android 都不需要 Google Maps API Key 就能跑起来。
 * 后续要换 Google Maps 时，只需要把这个文件换成 react-native-maps (PROVIDER_GOOGLE) 实现，
 * 外部调用方 (props 接口) 不用跟着改。
 */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
}

const DEFAULT_CENTER: [number, number] = [-33.8688, 151.2093]; // 悉尼

function buildHtml(opts: {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  pickable: boolean;
  pickedPosition?: [number, number] | null;
}) {
  const { center, zoom, markers, pickable, pickedPosition } = opts;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${center[0]}, ${center[1]}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = ${JSON.stringify(markers)};
    markers.forEach(function (m) {
      const marker = L.marker([m.lat, m.lng]).addTo(map);
      if (m.title) {
        marker.bindPopup('<b>' + m.title + '</b>' + (m.subtitle ? '<br/>' + m.subtitle : ''));
      }
      marker.on('click', function () {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
      });
    });

    ${pickedPosition ? `L.marker([${pickedPosition[0]}, ${pickedPosition[1]}]).addTo(map);` : ""}

    ${
      pickable
        ? `map.on('click', function (e) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pick', lat: e.latlng.lat, lng: e.latlng.lng }));
    });`
        : ""
    }
  </script>
</body>
</html>`;
}

export default function MapView({
  markers = [],
  center,
  zoom = 12,
  height = 260,
  onPick,
  onMarkerPress,
  pickedPosition,
}: {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  onPick?: (lat: number, lng: number) => void;
  onMarkerPress?: (id: string) => void;
  pickedPosition?: [number, number] | null;
}) {
  const webviewRef = useRef<WebView>(null);
  const initialCenter = center ?? (markers[0] ? ([markers[0].lat, markers[0].lng] as [number, number]) : DEFAULT_CENTER);

  const html = useMemo(
    () => buildHtml({ center: initialCenter, zoom, markers, pickable: !!onPick, pickedPosition }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(markers), initialCenter[0], initialCenter[1], zoom, !!onPick, pickedPosition?.[0], pickedPosition?.[1]],
  );

  return (
    <View style={[styles.wrapper, { height }]}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === "pick" && onPick) onPick(msg.lat, msg.lng);
            if (msg.type === "markerPress" && onMarkerPress) onMarkerPress(msg.id);
          } catch {
            // ignore malformed bridge messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 12, overflow: "hidden" },
});
