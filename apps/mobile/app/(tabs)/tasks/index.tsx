import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Switch, Text, View } from "react-native";
import { PaginatedResult, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import MapView from "@/components/MapView";
import { Pressable } from "react-native";

export default function TasksListScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<TaskDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<TaskDto>>(
          `/tasks${buildQuery({ category: category || undefined, urgentOnly: urgentOnly || undefined, keyword: keyword || undefined })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, urgentOnly, keyword]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((task) => task.location)
        .map((task) => ({
          id: task.id,
          lat: task.location!.lat,
          lng: task.location!.lng,
          title: task.title,
          subtitle: `预算 ${task.currency} ${task.budgetMin ?? "-"} ~ ${task.budgetMax ?? "-"}`,
        })),
    [data],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布任务" onPress={() => router.push("/tasks/new")} />
      </View>

      <View style={styles.filterRow}>
        <Switch value={urgentOnly} onValueChange={setUrgentOnly} />
        <Text style={styles.filterLabel}>只看加急/即时任务</Text>
      </View>

      <View style={styles.viewToggle}>
        <SecondaryButton title="列表" active={view === "list"} onPress={() => setView("list")} />
        <SecondaryButton title="地图" active={view === "map"} onPress={() => setView("map")} />
      </View>

      {view === "map" ? (
        <View style={{ padding: 16, paddingTop: 8, flex: 1 }}>
          {markers.length === 0 ? (
            <Text style={styles.empty}>当前筛选结果中没有带地图位置的任务</Text>
          ) : (
            <MapView markers={markers} zoom={11} height={480} onMarkerPress={(id) => router.push(`/tasks/${id}`)} />
          )}
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, gap: 10 }}
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <TextField placeholder="搜索任务标题或描述..." value={keyword} onChangeText={setKeyword} style={{ marginBottom: 10 }} />
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
            </View>
          }
          ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无任务，快来发布第一个吧</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/tasks/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Badge label={TASK_CATEGORY_LABELS[item.category]} />
                  {item.isUrgent && <Badge label="加急" />}
                </View>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 0, alignItems: "flex-end" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filterLabel: { fontSize: 13, color: colors.subtext },
  viewToggle: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meta: { fontSize: 12, color: colors.subtext },
  status: { fontSize: 12, color: colors.brandDark, fontWeight: "600" },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
