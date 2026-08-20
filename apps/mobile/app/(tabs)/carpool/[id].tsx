import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CARPOOL_TYPE_LABELS, CarpoolType, ConversationContextType, GeoPoint } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SuccessText, TextField, colors } from "@/components/ui";
import MessageThread from "@/components/MessageThread";

interface TripDetail {
  id: string;
  driverId: string;
  type: CarpoolType;
  origin: GeoPoint;
  destination: GeoPoint;
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
  const { t, locale } = useLocale();
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
        <Text style={{ padding: 16 }}>{t("common.loading")}</Text>
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
      setMessage(t("carpool.bookSuccess"));
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("carpool.bookFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Badge label={CARPOOL_TYPE_LABELS[locale][trip.type]} />
        <Text style={styles.title}>
          {trip.origin.address} → {trip.destination.address}
        </Text>
        <Text style={styles.meta}>
          {t("carpool.departureTime")}: {new Date(trip.departureTime).toLocaleString()}
        </Text>
        {trip.flightNumber && (
          <Text style={styles.meta}>
            {t("carpool.flightNumberColon")}: {trip.flightNumber}
          </Text>
        )}
        <Text style={styles.meta}>
          {t("carpool.driver")}: {trip.driver.name}
        </Text>
        <Text style={styles.meta}>
          {t("carpool.price")}: {trip.currency} {trip.pricePerSeat} {t("carpool.perSeat")} · {t("carpool.remaining")}{" "}
          {trip.seatsAvailable} / {trip.totalSeats} {t("carpool.seatsUnit")}
        </Text>
        {trip.notes && (
          <Text style={styles.meta}>
            {t("carpool.notes")}: {trip.notes}
          </Text>
        )}
      </Card>

      {!user && (
        <Card>
          <Text>{t("carpool.loginToBookSeats")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      )}

      {user && !isDriver && !myBooking && trip.status === "OPEN" && (
        <Card>
          <Text style={styles.cardTitle}>{t("carpool.bookSeats")}</Text>
          <Field label={t("carpool.seatCountLabel")}>
            <TextField keyboardType="numeric" value={seatsText} onChangeText={setSeatsText} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <SuccessText>{message}</SuccessText>
          <PrimaryButton title={`${t("carpool.bookNSeats")} ${seatsText} ${t("carpool.seatsSuffix")}`} onPress={bookSeats} loading={busy} />
        </Card>
      )}

      {myBooking && (
        <Card>
          <Text>
            {t("carpool.youBooked")} {myBooking.seats} {t("carpool.seatsSuffix")}，{t("common.status")}: {myBooking.status}
          </Text>
        </Card>
      )}

      {isDriver && trip.bookings.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>{t("carpool.passengerList")}</Text>
          {trip.bookings.map((b) => (
            <Text key={b.id} style={styles.meta}>
              {b.passenger.name} · {b.seats} {t("carpool.seatsUnit")} · {b.status}
            </Text>
          ))}
        </Card>
      )}

      <MessageThread contextType={ConversationContextType.CARPOOL_TRIP} contextId={trip.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
});
