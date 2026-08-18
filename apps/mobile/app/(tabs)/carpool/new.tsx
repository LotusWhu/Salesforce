import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CarpoolTripDto, CarpoolType } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { CARPOOL_TYPE_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function NewCarpoolTripScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [type, setType] = useState<CarpoolType>(CarpoolType.AIRPORT_PICKUP);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [departureDate, setDepartureDate] = useState(""); // YYYY-MM-DD
  const [departureTime, setDepartureTime] = useState(""); // HH:mm
  const [flightNumber, setFlightNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("20");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>请先登录后再发布行程。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!originAddress || !destinationAddress || !departureDate || !departureTime) {
      setError("请填写出发地、目的地和出发时间");
      return;
    }
    setSubmitting(true);
    try {
      const trip = await api.post<CarpoolTripDto>("/carpool/trips", {
        type,
        origin: { lat: 0, lng: 0, address: originAddress },
        destination: { lat: 0, lng: 0, address: destinationAddress },
        departureTime: new Date(`${departureDate}T${departureTime}:00`).toISOString(),
        flightNumber: flightNumber || undefined,
        totalSeats: Number(totalSeats) || 1,
        pricePerSeat: Number(pricePerSeat) || 0,
        city: city || undefined,
        notes: notes || undefined,
      });
      router.replace(`/carpool/${trip.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label="类型">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Object.entries(CARPOOL_TYPE_LABELS).map(([key, label]) => (
              <SecondaryButton key={key} title={label} active={type === key} onPress={() => setType(key as CarpoolType)} />
            ))}
          </View>
        </Field>

        <Field label="出发地">
          <TextField placeholder="例如：悉尼国际机场 T1" value={originAddress} onChangeText={setOriginAddress} />
        </Field>

        <Field label="目的地">
          <TextField placeholder="例如：Chatswood" value={destinationAddress} onChangeText={setDestinationAddress} />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="出发日期 (YYYY-MM-DD)">
              <TextField placeholder="2026-08-20" value={departureDate} onChangeText={setDepartureDate} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="出发时间 (HH:mm)">
              <TextField placeholder="14:30" value={departureTime} onChangeText={setDepartureTime} />
            </Field>
          </View>
        </View>

        {type !== "CITY_RIDE" && (
          <Field label="航班号 (可选)">
            <TextField placeholder="例如：CZ321" value={flightNumber} onChangeText={setFlightNumber} />
          </Field>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="可拼座位数">
              <TextField keyboardType="numeric" value={totalSeats} onChangeText={setTotalSeats} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="每座价格 (AUD)">
              <TextField keyboardType="numeric" value={pricePerSeat} onChangeText={setPricePerSeat} />
            </Field>
          </View>
        </View>

        <Field label="城市">
          <TextField value={city} onChangeText={setCity} />
        </Field>

        <Field label="备注 (可选)">
          <TextField value={notes} onChangeText={setNotes} />
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title="发布行程" onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
