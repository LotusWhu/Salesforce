import { useState } from "react";
import { Text, View } from "react-native";
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

  const handlePick = (lat: number, lng: number) => {
    onChange({ lat, lng, address: address || undefined });
  };

  return (
    <View>
      <Field label="地址描述 (可选)">
        <TextField
          placeholder="如：悉尼CBD George St 123号"
          value={address}
          onChangeText={(v) => {
            setAddress(v);
            if (value) onChange({ ...value, address: v || undefined });
          }}
        />
      </Field>
      <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 6 }}>
        在地图上点击选择位置{value ? `（已选：${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}）` : ""}
      </Text>
      <MapView onPick={handlePick} pickedPosition={value ? [value.lat, value.lng] : null} height={220} />
      {value && (
        <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
          <SecondaryButton title="清除位置" onPress={() => onChange(null)} />
        </View>
      )}
    </View>
  );
}
