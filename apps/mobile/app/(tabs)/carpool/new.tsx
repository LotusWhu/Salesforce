import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CARPOOL_TYPE_LABELS, CarpoolTripDto, CarpoolType } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function NewCarpoolTripScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city: globalCity } = useLocale();
  const [type, setType] = useState<CarpoolType>(CarpoolType.AIRPORT_PICKUP);
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [departureDate, setDepartureDate] = useState(""); // YYYY-MM-DD
  const [departureTime, setDepartureTime] = useState(""); // HH:mm
  const [flightNumber, setFlightNumber] = useState("");
  const [totalSeats, setTotalSeats] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("20");
  const [city, setCity] = useState(globalCity ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>{t("carpool.loginToPublish")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!originAddress || !destinationAddress || !departureDate || !departureTime) {
      setError(t("carpool.fillOriginDest"));
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
      setError(e instanceof ApiError ? e.message : t("carpool.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label={t("carpool.typeLabel")}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {Object.entries(CARPOOL_TYPE_LABELS[locale]).map(([key, label]) => (
              <SecondaryButton key={key} title={label} active={type === key} onPress={() => setType(key as CarpoolType)} />
            ))}
          </View>
        </Field>

        <Field label={t("carpool.originLabel")}>
          <TextField placeholder={t("carpool.originPlaceholder")} value={originAddress} onChangeText={setOriginAddress} />
        </Field>

        <Field label={t("carpool.destinationLabel")}>
          <TextField placeholder={t("carpool.destinationPlaceholder")} value={destinationAddress} onChangeText={setDestinationAddress} />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={t("carpool.departureDateYMD")}>
              <TextField placeholder="2026-08-20" value={departureDate} onChangeText={setDepartureDate} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("carpool.departureTimeHHmm")}>
              <TextField placeholder="14:30" value={departureTime} onChangeText={setDepartureTime} />
            </Field>
          </View>
        </View>

        {type !== "CITY_RIDE" && (
          <Field label={t("carpool.flightNumberLabel")}>
            <TextField placeholder={t("carpool.flightNumberHintPlaceholder")} value={flightNumber} onChangeText={setFlightNumber} />
          </Field>
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={t("carpool.availableSeats")}>
              <TextField keyboardType="numeric" value={totalSeats} onChangeText={setTotalSeats} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("carpool.pricePerSeat")}>
              <TextField keyboardType="numeric" value={pricePerSeat} onChangeText={setPricePerSeat} />
            </Field>
          </View>
        </View>

        <Field label={t("carpool.cityLabel")}>
          <TextField value={city} onChangeText={setCity} />
        </Field>

        <Field label={t("carpool.notesLabel")}>
          <TextField value={notes} onChangeText={setNotes} />
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("carpool.publish")} onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
