import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  PaginatedResult,
  ServiceCategory,
  ServiceListingDto,
  ServiceTier,
  SERVICE_CATEGORY_TIER,
} from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";

const TIER_TABS: { key: ServiceTier; label: string }[] = [
  { key: ServiceTier.IMMEDIATE, label: "即时/家政" },
  { key: ServiceTier.BIDDING, label: "竞价/比价" },
];

export default function ServicesListScreen() {
  const router = useRouter();
  const [tier, setTier] = useState<ServiceTier>(ServiceTier.IMMEDIATE);
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  const categoriesInTier = useMemo(
    () => Object.entries(SERVICE_CATEGORY_LABELS).filter(([key]) => SERVICE_CATEGORY_TIER[key as ServiceCategory] === tier),
    [tier],
  );

  useEffect(() => {
    setCategory("");
  }, [tier]);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(`/services${buildQuery({ category: category || undefined })}`)
      .then((res) => setData({ ...res, items: res.items.filter((s) => SERVICE_CATEGORY_TIER[s.category] === tier) }))
      .finally(() => setLoading(false));
  }, [category, tier]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布服务" onPress={() => router.push("/services/new")} />
      </View>

      <View style={styles.tierRow}>
        {TIER_TABS.map((t) => (
          <SecondaryButton key={t.key} title={t.label} active={tier === t.key} onPress={() => setTier(t.key)} />
        ))}
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            data={[["", "全部"], ...categoriesInTier]}
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
              <Badge label={SERVICE_CATEGORY_LABELS[item.category]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 0, alignItems: "flex-end" },
  tierRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  price: { fontSize: 13, color: colors.brandDark, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
