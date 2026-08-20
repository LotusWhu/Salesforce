import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { ClassifiedCategory, ClassifiedListingDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { CLASSIFIED_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import { Text } from "react-native";

export default function NewClassifiedScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<ClassifiedCategory>(ClassifiedCategory.SECOND_HAND);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>请先登录后再发布信息。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError("请填写标题和描述");
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
      });
      router.replace(`/classifieds/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label="分类">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CLASSIFIED_CATEGORY_LABELS).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={category === key}
                onPress={() => setCategory(key as ClassifiedCategory)}
              />
            ))}
          </View>
        </Field>

        <Field label="标题">
          <TextField value={title} onChangeText={setTitle} />
        </Field>

        <Field label="详细描述">
          <TextField style={{ minHeight: 90 }} multiline value={description} onChangeText={setDescription} />
        </Field>

        <Field label="价格 (AUD，免费/面议可留空)">
          <TextField keyboardType="numeric" value={price} onChangeText={setPrice} />
        </Field>

        <Field label="城市">
          <TextField value={city} onChangeText={setCity} />
        </Field>

        <Field label="地图位置 (可选)">
          <LocationPicker value={location} onChange={setLocation} />
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title="发布" onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
