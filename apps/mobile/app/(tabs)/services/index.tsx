import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { PaginatedResult, ServiceCategory, ServiceListingDto } from "@renrenbang/shared-types";
import { api, buildQuery } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";

export default function ServicesListScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(`/services${buildQuery({ category: category || undefined })}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布服务" onPress={() => router.push("/services/new")} />
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
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  price: { fontSize: 13, color: colors.brandDark, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
