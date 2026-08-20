import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedCategory, ClassifiedListingDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";
import { Text } from "react-native";

export default function NewClassifiedScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city: globalCity } = useLocale();
  const [category, setCategory] = useState<ClassifiedCategory>(ClassifiedCategory.SECOND_HAND);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState(globalCity ?? "");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>{t("classifieds.loginToPublish")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError(t("classifieds.fillTitleDesc"));
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ClassifiedListingDto>("/classifieds", {
        category,
        title,
        description,
        price: price ? Number(price) : undefined,
        city: city || undefined,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        photos,
      });
      router.replace(`/classifieds/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("classifieds.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label={t("classifieds.categoryLabel")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CLASSIFIED_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={category === key}
                onPress={() => setCategory(key as ClassifiedCategory)}
              />
            ))}
          </View>
        </Field>

        <Field label={t("classifieds.titleLabel")}>
          <TextField value={title} onChangeText={setTitle} />
        </Field>

        <Field label={t("classifieds.descLabel")}>
          <TextField style={{ minHeight: 90 }} multiline value={description} onChangeText={setDescription} />
        </Field>

        <Field label={t("classifieds.priceLabel")}>
          <TextField keyboardType="numeric" value={price} onChangeText={setPrice} />
        </Field>

        <Field label={t("classifieds.cityLabel")}>
          <TextField value={city} onChangeText={setCity} />
        </Field>

        <Field label={t("classifieds.locationLabel")}>
          <LocationPicker value={location} onChange={setLocation} />
        </Field>

        <Field label={t("classifieds.photosLabel")}>
          <ImageUploader urls={photos} onChange={setPhotos} />
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("classifieds.publish")} onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
