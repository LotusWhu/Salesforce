import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TaskOfferDto, TaskStatus } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

interface TaskDetail {
  id: string;
  posterId: string;
  category: keyof typeof TASK_CATEGORY_LABELS;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  status: TaskStatus;
  assignedTaskerId: string | null;
  proofUrls: string[];
  completionNote: string | null;
  poster: { id: string; name: string };
  assignedTasker: { id: string; name: string } | null;
  offers: (TaskOfferDto & { tasker: { id: string; name: string } })[];
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [proofUrls, setProofUrls] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.get<TaskDetail>(`/tasks/${id}`).then(setTask);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!task) {
    return (
      <View style={styles.screen}>
        <Text style={{ padding: 16 }}>加载中...</Text>
      </View>
    );
  }

  const isPoster = user?.id === task.posterId;
  const isAssignedTasker = user?.id === task.assignedTaskerId;
  const myOffer = task.offers.find((o) => o.taskerId === user?.id);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Badge label={TASK_CATEGORY_LABELS[task.category]} />
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.desc}>{task.description}</Text>
        <Text style={styles.meta}>状态: {TASK_STATUS_LABELS[task.status]}</Text>
        <Text style={styles.meta}>
          预算: {task.currency} {task.budgetMin ?? "-"} ~ {task.budgetMax ?? "-"}
        </Text>
        <Text style={styles.meta}>发布者: {task.poster.name}</Text>
        {task.assignedTasker && <Text style={styles.meta}>跑腿者: {task.assignedTasker.name}</Text>}
        {task.proofUrls.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>完成凭证</Text>
            {task.proofUrls.map((url) => (
              <Text key={url} style={styles.link}>
                {url}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <ErrorText>{error}</ErrorText>

      {user && !isPoster && !myOffer && (task.status === "OPEN" || task.status === "OFFERED") && (
        <Card>
          <Text style={styles.cardTitle}>我要报价</Text>
          <Field label="报价金额">
            <TextField keyboardType="numeric" value={offerPrice} onChangeText={setOfferPrice} />
          </Field>
          <Field label="附言 (可选)">
            <TextField value={offerMessage} onChangeText={setOfferMessage} />
          </Field>
          <PrimaryButton
            title="提交报价"
            disabled={!offerPrice}
            loading={busy}
            onPress={() =>
              run(() =>
                api.post(`/tasks/${id}/offers`, { price: Number(offerPrice), message: offerMessage || undefined }),
              )
            }
          />
        </Card>
      )}

      {isPoster && task.offers.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>收到的报价 ({task.offers.length})</Text>
          {task.offers.map((offer) => (
            <View key={offer.id} style={styles.offerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerName}>
                  {offer.tasker.name} · {task.currency} {offer.price}
                </Text>
                {offer.message && <Text style={styles.meta}>{offer.message}</Text>}
                <Text style={styles.metaSmall}>状态: {offer.status}</Text>
              </View>
              {offer.status === "PENDING" && task.status !== "ASSIGNED" && (
                <SecondaryButton
                  title="接受"
                  onPress={() => run(() => api.post(`/tasks/${id}/offers/${offer.id}/accept`))}
                  disabled={busy}
                />
              )}
            </View>
          ))}
        </Card>
      )}

      {isAssignedTasker && task.status === "ASSIGNED" && (
        <Card>
          <PrimaryButton title="开始执行任务" loading={busy} onPress={() => run(() => api.post(`/tasks/${id}/start`))} />
        </Card>
      )}

      {isAssignedTasker && task.status === "IN_PROGRESS" && (
        <Card>
          <Text style={styles.cardTitle}>提交完成凭证</Text>
          <Field label="凭证图片链接 (多个用逗号分隔)">
            <TextField value={proofUrls} onChangeText={setProofUrls} />
          </Field>
          <PrimaryButton
            title="提交"
            disabled={!proofUrls}
            loading={busy}
            onPress={() =>
              run(() =>
                api.post(`/tasks/${id}/submit-completion`, {
                  proofUrls: proofUrls.split(",").map((s) => s.trim()).filter(Boolean),
                }),
              )
            }
          />
        </Card>
      )}

      {isPoster && task.status === "SUBMITTED" && (
        <Card>
          <PrimaryButton
            title="确认完成并结束任务"
            loading={busy}
            onPress={() => run(() => api.post(`/tasks/${id}/confirm-completion`))}
          />
        </Card>
      )}

      {isPoster && (task.status === "OPEN" || task.status === "OFFERED") && (
        <SecondaryButton title="取消任务" onPress={() => run(() => api.post(`/tasks/${id}/cancel`))} disabled={busy} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 14, color: colors.text, marginTop: 6 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  metaSmall: { fontSize: 11, color: colors.subtext },
  label: { fontSize: 13, fontWeight: "600", color: colors.subtext },
  link: { fontSize: 13, color: colors.brand },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
  offerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  offerName: { fontSize: 14, fontWeight: "600", color: colors.text },
});
