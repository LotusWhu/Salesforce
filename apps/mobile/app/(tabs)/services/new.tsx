import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CreateServiceListingDto, PriceType, ServiceCategory, ServiceListingDto } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function NewServiceScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateServiceListingDto>({
    category: ServiceCategory.HOUSE_CLEANING,
    title: "",
    description: "",
    priceType: PriceType.FIXED,
    price: 0,
    currency: "AUD",
    durationMinutes: 60,
  });
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
          <Text>请先登录后再发布服务。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    const price = Number(priceText);
    if (!form.title || !form.description || !price) {
      setError("请填写标题、描述和价格");
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ServiceListingDto>("/services", {
        ...form,
        price,
        durationMinutes: Number(durationText) || 60,
      });
      const slots = Object.entries(activeDays)
        .filter(([, on]) => on)
        .map(([day]) => ({ dayOfWeek: Number(day), startTime, endTime }));
      if (slots.length > 0) {
        await api.post(`/services/${listing.id}/availability`, { slots });
      }
      router.replace(`/services/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label="服务分类">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={form.category === key}
                onPress={() => setForm({ ...form, category: key as ServiceCategory })}
              />
            ))}
          </View>
        </Field>

        <Field label="标题">
          <TextField value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
        </Field>

        <Field label="详细描述">
          <TextField
            style={{ minHeight: 80 }}
            multiline
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="计价方式">
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SecondaryButton
                  title="一次性"
                  active={form.priceType === PriceType.FIXED}
                  onPress={() => setForm({ ...form, priceType: PriceType.FIXED })}
                />
                <SecondaryButton
                  title="按小时"
                  active={form.priceType === PriceType.HOURLY}
                  onPress={() => setForm({ ...form, priceType: PriceType.HOURLY })}
                />
              </View>
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="价格 (AUD)">
              <TextField keyboardType="numeric" value={priceText} onChangeText={setPriceText} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="预计时长 (分钟)">
              <TextField keyboardType="numeric" value={durationText} onChangeText={setDurationText} />
            </Field>
          </View>
        </View>

        <Field label="服务城市/覆盖区域">
          <TextField value={form.city ?? ""} onChangeText={(v) => setForm({ ...form, city: v, serviceArea: v })} />
        </Field>

        <Field label="可预约时段">
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

        <PrimaryButton title="发布服务" onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
