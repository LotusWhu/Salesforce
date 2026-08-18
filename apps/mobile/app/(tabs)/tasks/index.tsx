import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { PaginatedResult, TaskCategory, TaskDto } from "@renrenbang/shared-types";
import { api, buildQuery } from "@/lib/api";
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";
import { Pressable } from "react-native";

export default function TasksListScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [data, setData] = useState<PaginatedResult<TaskDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<TaskDto>>(`/tasks${buildQuery({ category: category || undefined })}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布任务" onPress={() => router.push("/tasks/new")} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            data={[["", "全部"], ...Object.entries(TASK_CATEGORY_LABELS)]}
            keyExtractor={([key]) => key}
            renderItem={({ item: [key, label] }) => (
              <View style={{ marginRight: 8 }}>
                <SecondaryButton
                  title={label}
                  active={category === key}
                  onPress={() => setCategory(key as TaskCategory | "")}
                />
              </View>
            )}
          />
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无任务，快来发布第一个吧</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/tasks/${item.id}`)}>
            <Card>
              <Badge label={TASK_CATEGORY_LABELS[item.category]} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.row}>
                <Text style={styles.meta}>
                  预算 {item.currency} {item.budgetMin ?? "-"} ~ {item.budgetMax ?? "-"}
                </Text>
                <Text style={styles.status}>{TASK_STATUS_LABELS[item.status]}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 0, alignItems: "flex-end" },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meta: { fontSize: 12, color: colors.subtext },
  status: { fontSize: 12, color: colors.brandDark, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
