import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { CreateTaskDto, TASK_CATEGORY_LABELS, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewTaskScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city } = useLocale();
  const [form, setForm] = useState<CreateTaskDto>({
    category: TaskCategory.BUY_TICKET,
    title: "",
    description: "",
    currency: "AUD",
    isRemote: true,
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>{t("tasks.loginToPublish")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description) {
      setError(t("tasks.fillTitleDesc"));
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.post<TaskDto>("/tasks", {
        ...form,
        city: city ?? undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        attachmentUrls,
      });
      router.replace(`/tasks/${task.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tasks.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label={t("tasks.categoryLabel")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(TASK_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={form.category === key}
                onPress={() => setForm({ ...form, category: key as TaskCategory })}
              />
            ))}
          </View>
        </Field>

        <Field label={t("tasks.titleLabel")}>
          <TextField
            placeholder={t("tasks.titlePlaceholder")}
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />
        </Field>

        <Field label={t("tasks.descLabel")}>
          <TextField
            style={{ minHeight: 90 }}
            multiline
            placeholder={t("tasks.descPlaceholder")}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label={t("tasks.budgetMin")}>
              <TextField keyboardType="numeric" value={budgetMin} onChangeText={setBudgetMin} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("tasks.budgetMax")}>
              <TextField keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} />
            </Field>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>{t("tasks.isRemote")}</Text>
          <Switch value={!!form.isRemote} onValueChange={(v) => setForm({ ...form, isRemote: v })} />
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>{t("tasks.isUrgentField")}</Text>
          <Switch value={!!form.isUrgent} onValueChange={(v) => setForm({ ...form, isUrgent: v })} />
        </View>

        {!form.isRemote && (
          <Field label={t("tasks.locationLabel")}>
            <LocationPicker value={location} onChange={setLocation} />
          </Field>
        )}

        <Field label={t("tasks.attachmentsLabel")}>
          <ImageUploader urls={attachmentUrls} onChange={setAttachmentUrls} />
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("tasks.publish")} onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
});
