import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CARPOOL_TYPE_LABELS, CarpoolTripDto, CarpoolType, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";

export default function CarpoolTripsListScreen() {
  const router = useRouter();
  const { t, locale } = useLocale();
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
        <PrimaryButton title={`+ ${t("carpool.publish")}`} onPress={() => router.push("/carpool/new")} />
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
            data={[["", t("common.all")], ...Object.entries(CARPOOL_TYPE_LABELS[locale])]}
            keyExtractor={([key]) => key}
            renderItem={({ item: [key, label] }) => (
              <View style={{ marginRight: 8 }}>
                <SecondaryButton title={label} active={type === key} onPress={() => setType(key as CarpoolType | "")} />
              </View>
            )}
          />
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t("carpool.noTrips")}</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/carpool/${item.id}`)}>
            <Card>
              <Badge label={CARPOOL_TYPE_LABELS[locale][item.type]} />
              <Text style={styles.title}>
                {item.origin.address} → {item.destination.address}
              </Text>
              <Text style={styles.desc}>
                {t("carpool.departureTime")}: {new Date(item.departureTime).toLocaleString()}
                {item.flightNumber ? ` · ${t("carpool.flightPrefix")} ${item.flightNumber}` : ""}
              </Text>
              <Text style={styles.price}>
                {item.currency} {item.pricePerSeat}{t("carpool.perSeat")} · {t("carpool.remaining")} {item.seatsAvailable}/{item.totalSeats}
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
