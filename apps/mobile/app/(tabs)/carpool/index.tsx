import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CarpoolTripDto, CarpoolType, PaginatedResult } from "@renrenbang/shared-types";
import { api, buildQuery } from "@/lib/api";
import { CARPOOL_TYPE_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";

export default function CarpoolListScreen() {
  const router = useRouter();
  const [type, setType] = useState<CarpoolType | "">("");
  const [data, setData] = useState<PaginatedResult<CarpoolTripDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<CarpoolTripDto>>(`/carpool/trips${buildQuery({ type: type || undefined })}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布行程" onPress={() => router.push("/carpool/new")} />
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
            data={[["", "全部"], ...Object.entries(CARPOOL_TYPE_LABELS)]}
            keyExtractor={([key]) => key}
            renderItem={({ item: [key, label] }) => (
              <View style={{ marginRight: 8 }}>
                <SecondaryButton title={label} active={type === key} onPress={() => setType(key as CarpoolType | "")} />
              </View>
            )}
          />
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无行程，快来发布第一个吧</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/carpool/${item.id}`)}>
            <Card>
              <Badge label={CARPOOL_TYPE_LABELS[item.type]} />
              <Text style={styles.title}>
                {item.origin.address} → {item.destination.address}
              </Text>
              <Text style={styles.desc}>
                出发: {new Date(item.departureTime).toLocaleString()}
                {item.flightNumber ? ` · 航班 ${item.flightNumber}` : ""}
              </Text>
              <Text style={styles.price}>
                {item.currency} {item.pricePerSeat}/座 · 剩余 {item.seatsAvailable}/{item.totalSeats}
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
