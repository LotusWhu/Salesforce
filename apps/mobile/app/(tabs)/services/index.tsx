import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { PaginatedResult, ServiceCategory, ServiceListingDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";
import MapView from "@/components/MapView";

export default function ServicesListScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [instantOnly, setInstantOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(
        `/services${buildQuery({ category: category || undefined, instantOnly: instantOnly || undefined })}`,
      )
      .then(setData)
      .finally(() => setLoading(false));
  }, [category, instantOnly]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((s) => s.location)
        .map((s) => ({
          id: s.id,
          lat: s.location!.lat,
          lng: s.location!.lng,
          title: s.title,
          subtitle: `${s.currency} ${s.price} ${s.priceType === "HOURLY" ? "/ 小时" : "/ 次"}`,
        })),
    [data],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布服务" onPress={() => router.push("/services/new")} />
      </View>

      <View style={styles.filterRow}>
        <Switch value={instantOnly} onValueChange={setInstantOnly} />
        <Text style={styles.filterLabel}>只看支持「即时」快速下单的服务</Text>
      </View>

      <View style={styles.viewToggle}>
        <SecondaryButton title="列表" active={view === "list"} onPress={() => setView("list")} />
        <SecondaryButton title="地图" active={view === "map"} onPress={() => setView("map")} />
      </View>

      {view === "map" ? (
        <View style={{ padding: 16, paddingTop: 8, flex: 1 }}>
          {markers.length === 0 ? (
            <Text style={styles.empty}>当前筛选结果中没有带地图位置的服务</Text>
          ) : (
            <MapView markers={markers} zoom={11} height={480} onMarkerPress={(id) => router.push(`/services/${id}`)} />
          )}
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10 }}
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
              data={[["", "全部"], ...Object.entries(SERVICE_CATEGORY_LABELS)]}
              keyExtractor={([key]) => key}
              renderItem={({ item: [key, label] }) => (
                <View style={{ marginRight: 8 }}>
                  <SecondaryButton
                    title={label}
                    active={category === key}
                    onPress={() => setCategory(key as ServiceCategory | "")}
                  />
                </View>
              )}
            />
          }
          ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无服务，快来发布第一个吧</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/services/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Badge label={SERVICE_CATEGORY_LABELS[item.category]} />
                  {item.supportsInstantBooking && <Badge label="即时可约" />}
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>
                  {item.currency} {item.price} {item.priceType === "HOURLY" ? "/ 小时" : "/ 次"} · 约
                  {item.durationMinutes}分钟
                </Text>
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
  price: { fontSize: 13, color: colors.brandDark, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
