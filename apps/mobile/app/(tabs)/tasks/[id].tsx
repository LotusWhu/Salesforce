import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ConversationContextType,
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TaskCategory,
  TaskOfferDto,
  TaskStatus,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import PhotoGallery from "@/components/PhotoGallery";
import ImageUploader from "@/components/ImageUploader";
import MessageThread from "@/components/MessageThread";

interface TaskDetail {
  id: string;
  posterId: string;
  category: TaskCategory;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  status: TaskStatus;
  isUrgent: boolean;
  assignedTaskerId: string | null;
  attachmentUrls: string[];
  proofUrls: string[];
  completionNote: string | null;
  poster: { id: string; name: string };
  assignedTasker: { id: string; name: string } | null;
  offers: (TaskOfferDto & { tasker: { id: string; name: string } })[];
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);
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
        <Text style={{ padding: 16 }}>{t("common.loading")}</Text>
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
      setError(e instanceof ApiError ? e.message : t("tasks.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Badge label={TASK_CATEGORY_LABELS[locale][task.category]} />
          {task.isUrgent && <Badge label={t("tasks.urgentBadge")} />}
        </View>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.desc}>{task.description}</Text>
        <Text style={styles.meta}>
          {t("common.status")}: {TASK_STATUS_LABELS[locale][task.status]}
        </Text>
        <Text style={styles.meta}>
          {t("tasks.budget")}: {task.currency} {task.budgetMin ?? "-"} ~ {task.budgetMax ?? "-"}
        </Text>
        <Text style={styles.meta}>
          {t("tasks.poster")}: {task.poster.name}
        </Text>
        {task.assignedTasker && (
          <Text style={styles.meta}>
            {t("tasks.tasker")}: {task.assignedTasker.name}
          </Text>
        )}
        <PhotoGallery urls={task.attachmentUrls} />
        {task.proofUrls.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>{t("tasks.completionProof")}</Text>
            <PhotoGallery urls={task.proofUrls} />
          </View>
        )}
      </Card>

      <ErrorText>{error}</ErrorText>

      {user && !isPoster && !myOffer && (task.status === "OPEN" || task.status === "OFFERED") && (
        <Card>
          <Text style={styles.cardTitle}>{t("tasks.makeOffer")}</Text>
          <Field label={t("tasks.offerAmount")}>
            <TextField keyboardType="numeric" value={offerPrice} onChangeText={setOfferPrice} />
          </Field>
          <Field label={t("tasks.offerMessage")}>
            <TextField value={offerMessage} onChangeText={setOfferMessage} />
          </Field>
          <PrimaryButton
            title={t("tasks.submitOffer")}
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
          <Text style={styles.cardTitle}>
            {t("tasks.offersReceived")} ({task.offers.length})
          </Text>
          {task.offers.map((offer) => (
            <View key={offer.id} style={styles.offerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerName}>
                  {offer.tasker.name} · {task.currency} {offer.price}
                </Text>
                {offer.message && <Text style={styles.meta}>{offer.message}</Text>}
                <Text style={styles.metaSmall}>
                  {t("common.status")}: {offer.status}
                </Text>
              </View>
              {offer.status === "PENDING" && task.status !== "ASSIGNED" && (
                <SecondaryButton
                  title={t("tasks.accept")}
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
          <PrimaryButton title={t("tasks.startTask")} loading={busy} onPress={() => run(() => api.post(`/tasks/${id}/start`))} />
        </Card>
      )}

      {isAssignedTasker && task.status === "IN_PROGRESS" && (
        <Card>
          <Text style={styles.cardTitle}>{t("tasks.submitCompletionTitle")}</Text>
          <ImageUploader urls={proofUrls} onChange={setProofUrls} />
          <View style={{ height: 8 }} />
          <PrimaryButton
            title={t("tasks.submit")}
            disabled={proofUrls.length === 0}
            loading={busy}
            onPress={() => run(() => api.post(`/tasks/${id}/submit-completion`, { proofUrls }))}
          />
        </Card>
      )}

      {isPoster && task.status === "SUBMITTED" && (
        <Card>
          <PrimaryButton
            title={t("tasks.confirmCompletion")}
            loading={busy}
            onPress={() => run(() => api.post(`/tasks/${id}/confirm-completion`))}
          />
        </Card>
      )}

      {isPoster && (task.status === "OPEN" || task.status === "OFFERED") && (
        <SecondaryButton title={t("tasks.cancelTask")} onPress={() => run(() => api.post(`/tasks/${id}/cancel`))} disabled={busy} />
      )}

      <MessageThread contextType={ConversationContextType.TASK} contextId={task.id} />
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
