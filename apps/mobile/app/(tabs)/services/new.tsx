import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  CreateServiceListingDto,
  PriceType,
  SERVICE_CATEGORY_LABELS,
  ServiceCategory,
  ServiceListingDto,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewServiceScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city } = useLocale();
  const WEEKDAYS = [
    t("services.weekdaySun"),
    t("services.weekdayMon"),
    t("services.weekdayTue"),
    t("services.weekdayWed"),
    t("services.weekdayThu"),
    t("services.weekdayFri"),
    t("services.weekdaySat"),
  ];
  const [form, setForm] = useState<CreateServiceListingDto>({
    category: ServiceCategory.HOUSE_CLEANING,
    title: "",
    description: "",
    priceType: PriceType.FIXED,
    price: 0,
    currency: "AUD",
    durationMinutes: 60,
    city: city ?? undefined,
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [priceText, setPriceText] = useState("");
  const [durationText, setDurationText] = useState("60");
  const [activeDays, setActiveDays] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>{t("services.loginToPublish")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    const price = Number(priceText);
    if (!form.title || !form.description || !price) {
      setError(t("services.fillRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ServiceListingDto>("/services", {
        ...form,
        price,
        durationMinutes: Number(durationText) || 60,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        photos,
      });
      const slots = Object.entries(activeDays)
        .filter(([, on]) => on)
        .map(([day]) => ({ dayOfWeek: Number(day), startTime, endTime }));
      if (slots.length > 0) {
        await api.post(`/services/${listing.id}/availability`, { slots });
      }
      router.replace(`/services/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label={t("services.categoryLabel")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(SERVICE_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={form.category === key}
                onPress={() => setForm({ ...form, category: key as ServiceCategory })}
              />
            ))}
          </View>
        </Field>

        <Field label={t("services.titleLabel")}>
          <TextField value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        </Field>

        <Field label={t("services.descLabel")}>
          <TextField
            style={{ minHeight: 80 }}
            multiline
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={t("services.priceTypeLabel")}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SecondaryButton
                  title={t("services.priceTypeFixedShort")}
                  active={form.priceType === PriceType.FIXED}
                  onPress={() => setForm({ ...form, priceType: PriceType.FIXED })}
                />
                <SecondaryButton
                  title={t("services.priceTypeHourlyShort")}
                  active={form.priceType === PriceType.HOURLY}
                  onPress={() => setForm({ ...form, priceType: PriceType.HOURLY })}
                />
              </View>
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={t("services.priceLabel")}>
              <TextField keyboardType="numeric" value={priceText} onChangeText={setPriceText} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("services.durationLabel")}>
              <TextField keyboardType="numeric" value={durationText} onChangeText={setDurationText} />
            </Field>
          </View>
        </View>

        <Field label={t("services.cityLabel")}>
          <TextField value={form.city ?? ""} onChangeText={(v) => setForm({ ...form, city: v, serviceArea: v })} />
        </Field>

        <Field label={t("services.instantFieldLabel")}>
          <SecondaryButton
            title={form.supportsInstantBooking ? `✓ ${t("services.instantField")}` : t("services.instantField")}
            active={!!form.supportsInstantBooking}
            onPress={() => setForm({ ...form, supportsInstantBooking: !form.supportsInstantBooking })}
          />
        </Field>

        <Field label={t("services.locationLabel")}>
          <LocationPicker value={location} onChange={setLocation} />
        </Field>

        <Field label={t("services.photosLabel")}>
          <ImageUploader urls={photos} onChange={setPhotos} />
        </Field>

        <Field label={t("services.availabilityLabel")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {WEEKDAYS.map((label, idx) => (
              <SecondaryButton
                key={idx}
                title={label}
                active={!!activeDays[idx]}
                onPress={() => setActiveDays({ ...activeDays, [idx]: !activeDays[idx] })}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField placeholder="09:00" value={startTime} onChangeText={setStartTime} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField placeholder="18:00" value={endTime} onChangeText={setEndTime} />
            </View>
          </View>
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("services.publish")} onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
