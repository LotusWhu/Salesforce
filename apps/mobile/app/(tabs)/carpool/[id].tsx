import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "@/lib/api";
import { CARPOOL_TYPE_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SuccessText, TextField, colors } from "@/components/ui";

interface TripDetail {
  id: string;
  driverId: string;
  type: keyof typeof CARPOOL_TYPE_LABELS;
  originAddress: string;
  destinationAddress: string;
  departureTime: string;
  flightNumber: string | null;
  totalSeats: number;
  seatsAvailable: number;
  pricePerSeat: string;
  currency: string;
  notes: string | null;
  status: string;
  driver: { id: string; name: string };
  bookings: { id: string; seats: number; status: string; passenger: { id: string; name: string } }[];
}

export default function CarpoolTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [seatsText, setSeatsText] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => api.get<TripDetail>(`/carpool/trips/${id}`).then(setTrip);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!trip) {
    return (
      <View style={styles.screen}>
        <Text style={{ padding: 16 }}>加载中...</Text>
      </View>
    );
  }

  const isDriver = user?.id === trip.driverId;
  const myBooking = trip.bookings.find((b) => b.passenger.id === user?.id);

  const bookSeats = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await api.post(`/carpool/trips/${id}/bookings`, { seats: Number(seatsText) || 1 });
      setMessage("预订成功！");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "预订失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Badge label={CARPOOL_TYPE_LABELS[trip.type]} />
        <Text style={styles.title}>
          {trip.originAddress} → {trip.destinationAddress}
        </Text>
        <Text style={styles.meta}>出发时间: {new Date(trip.departureTime).toLocaleString()}</Text>
        {trip.flightNumber && <Text style={styles.meta}>航班号: {trip.flightNumber}</Text>}
        <Text style={styles.meta}>车主: {trip.driver.name}</Text>
        <Text style={styles.meta}>
          价格: {trip.currency} {trip.pricePerSeat} / 座 · 剩余 {trip.seatsAvailable} / {trip.totalSeats} 座
        </Text>
        {trip.notes && <Text style={styles.meta}>备注: {trip.notes}</Text>}
      </Card>

      {!user && (
        <Card>
          <Text>请先登录后再预订座位。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      )}

      {user && !isDriver && !myBooking && trip.status === "OPEN" && (
        <Card>
          <Text style={styles.cardTitle}>预订座位</Text>
          <Field label="座位数">
            <TextField keyboardType="numeric" value={seatsText} onChangeText={setSeatsText} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <SuccessText>{message}</SuccessText>
          <PrimaryButton title={`预订 ${seatsText} 个座位`} onPress={bookSeats} loading={busy} />
        </Card>
      )}

      {myBooking && (
        <Card>
          <Text>
            你已预订 {myBooking.seats} 个座位，状态: {myBooking.status}
          </Text>
        </Card>
      )}

      {isDriver && trip.bookings.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>乘客列表</Text>
          {trip.bookings.map((b) => (
            <Text key={b.id} style={styles.meta}>
              {b.passenger.name} · {b.seats} 座 · {b.status}
            </Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
});
