import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { PaginatedResult, SERVICE_CATEGORY_LABELS, ServiceCategory, ServiceListingDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";
import MapView from "@/components/MapView";

export default function ServicesListScreen() {
  const router = useRouter();
  const { t, locale, city } = useLocale();
  const [category, setCategory] = useState<ServiceCategory | "">("");
  const [instantOnly, setInstantOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<ServiceListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<ServiceListingDto>>(
        `/services${buildQuery({ category: category || undefined, instantOnly: instantOnly || undefined, city: city || undefined })}`,
      )
      .then(setData)
      .finally(() => setLoading(false));
  }, [category, instantOnly, city]);

  const priceUnit = (priceType: string) => (priceType === "HOURLY" ? t("services.perHour") : t("services.perSession"));

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((s) => s.location)
        .map((s) => ({
          id: s.id,
          lat: s.location!.lat,
          lng: s.location!.lng,
          title: s.title,
          subtitle: `${s.currency} ${s.price} ${priceUnit(s.priceType)}`,
        })),
    [data, t],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title={`+ ${t("services.publish")}`} onPress={() => router.push("/services/new")} />
      </View>

      <View style={styles.filterRow}>
        <Switch value={instantOnly} onValueChange={setInstantOnly} />
        <Text style={styles.filterLabel}>{t("services.instantOnly")}</Text>
      </View>

      <View style={styles.viewToggle}>
        <SecondaryButton title={t("common.listView")} active={view === "list"} onPress={() => setView("list")} />
        <SecondaryButton title={t("common.mapView")} active={view === "map"} onPress={() => setView("map")} />
      </View>

      {view === "map" ? (
        <View style={{ padding: 16, paddingTop: 8, flex: 1 }}>
          {markers.length === 0 ? (
            <Text style={styles.empty}>{t("services.noMapResults")}</Text>
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
              data={[["", t("common.all")], ...Object.entries(SERVICE_CATEGORY_LABELS[locale])]}
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
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{t("services.noData")}</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/services/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Badge label={SERVICE_CATEGORY_LABELS[locale][item.category]} />
                  {item.supportsInstantBooking && <Badge label={t("services.instantBadge")} />}
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>
                  {item.currency} {item.price} {priceUnit(item.priceType)} · {t("services.aboutMinutes")}
                  {item.durationMinutes} {t("services.minutes")}
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
