import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { CreateTaskDto, TaskCategory, TaskDto } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { TASK_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function NewTaskScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateTaskDto>({
    category: TaskCategory.BUY_TICKET,
    title: "",
    description: "",
    currency: "AUD",
    isRemote: true,
  });
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>请先登录后再发布任务。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description) {
      setError("请填写标题和描述");
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.post<TaskDto>("/tasks", {
        ...form,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      });
      router.replace(`/tasks/${task.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Field label="任务分类">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
              <SecondaryButton
                key={key}
                title={label}
                active={form.category === key}
                onPress={() => setForm({ ...form, category: key as TaskCategory })}
              />
            ))}
          </View>
        </Field>

        <Field label="标题">
          <TextField
            placeholder="例如：帮忙买两张周六晚场电影票"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />
        </Field>

        <Field label="详细描述">
          <TextField
            style={{ minHeight: 90 }}
            multiline
            placeholder="请详细描述任务要求"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="预算下限 (AUD)">
              <TextField keyboardType="numeric" value={budgetMin} onChangeText={setBudgetMin} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="预算上限 (AUD)">
              <TextField keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} />
            </Field>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>此任务无需上门 (如代买票、线上代办)</Text>
          <Switch
            value={!!form.isRemote}
            onValueChange={(v) => setForm({ ...form, isRemote: v })}
          />
        </View>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title="发布任务" onPress={submit} loading={submitting} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
});
