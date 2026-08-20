import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GeocodeResultDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import MapView from "./MapView";
import { Field, SecondaryButton, TextField, colors } from "./ui";

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
  };

  const selectSuggestion = (s: GeocodeResultDto) => {
    setAddress(s.displayName);
    setMapCenter([s.lat, s.lng]);
    onChange({ lat: s.lat, lng: s.lng, address: s.displayName });
    setSuggestions([]);
  };

  return (
    <View>
      <Field label="地址搜索 (可选，或直接在地图上点选)">
        <TextField placeholder="如：悉尼CBD George St 123号" value={address} onChangeText={setAddress} />
      </Field>
      {(searching || suggestions.length > 0) && (
        <View style={styles.suggestBox}>
          {searching && <Text style={styles.suggestHint}>搜索中...</Text>}
          {!searching &&
            suggestions.map((s, idx) => (
              <Pressable key={`${s.lat}-${s.lng}-${idx}`} style={styles.suggestRow} onPress={() => selectSuggestion(s)}>
                <Text style={styles.suggestText} numberOfLines={1}>
                  {s.displayName}
                </Text>
              </Pressable>
            ))}
        </View>
      )}
      <Text style={styles.hint}>
        在地图上点击选择位置{value ? `（已选：${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}）` : ""}
      </Text>
      <MapView onPick={handlePick} pickedPosition={value ? [value.lat, value.lng] : null} center={mapCenter} height={220} />
      {value && (
        <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
          <SecondaryButton title="清除位置" onPress={() => onChange(null)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: -6,
    marginBottom: 8,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  suggestHint: { padding: 10, fontSize: 12, color: colors.subtext },
  suggestRow: { paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestText: { fontSize: 13, color: colors.text },
  hint: { fontSize: 12, color: colors.subtext, marginBottom: 6 },
});
