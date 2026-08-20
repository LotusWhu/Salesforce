import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedCategory, ClassifiedListingDto, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";
import MapView from "@/components/MapView";

export default function ClassifiedsListScreen() {
  const router = useRouter();
  const { t, locale, city } = useLocale();
  const [category, setCategory] = useState<ClassifiedCategory | "">("");
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<ClassifiedListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<ClassifiedListingDto>>(
          `/classifieds${buildQuery({ category: category || undefined, keyword: keyword || undefined, city: city || undefined })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, keyword, city]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.location)
        .map((item) => ({
          id: item.id,
          lat: item.location!.lat,
          lng: item.location!.lng,
          title: item.title,
          subtitle: item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable"),
        })),
    [data, t],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title={`+ ${t("classifieds.publish")}`} onPress={() => router.push("/classifieds/new")} />
      </View>

      <View style={styles.viewToggle}>
        <SecondaryButton title={t("common.listView")} active={view === "list"} onPress={() => setView("list")} />
        <SecondaryButton title={t("common.mapView")} active={view === "map"} onPress={() => setView("map")} />
      </View>

      {view === "map" ? (
        <View style={{ padding: 16, paddingTop: 8, flex: 1 }}>
          {markers.length === 0 ? (
            <Text style={styles.empty}>{t("classifieds.noMapResults")}</Text>
          ) : (
            <MapView
              markers={markers}
              zoom={11}
              height={480}
              onMarkerPress={(id) => router.push(`/classifieds/${id}`)}
            />
          )}
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, gap: 10 }}
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <TextField
                placeholder={t("classifieds.searchPlaceholder")}
                value={keyword}
                onChangeText={setKeyword}
                style={{ marginBottom: 10 }}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                data={[["", t("common.all")], ...Object.entries(CLASSIFIED_CATEGORY_LABELS[locale])]}
                keyExtractor={([key]) => key}
                renderItem={({ item: [key, label] }) => (
                  <View style={{ marginRight: 8 }}>
                    <SecondaryButton
                      title={label}
                      active={category === key}
                      onPress={() => setCategory(key as ClassifiedCategory | "")}
                    />
                  </View>
                )}
              />
            </View>
          }
          ListEmptyComponent={!loading ? <Text style={styles.empty}>{t("classifieds.noData")}</Text> : null}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/classifieds/${item.id}`)}>
              <Card>
                <Badge label={CLASSIFIED_CATEGORY_LABELS[locale][item.category]} />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>
                  {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable")}
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
  viewToggle: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  price: { fontSize: 13, color: colors.brandDark, fontWeight: "600", marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
