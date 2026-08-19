import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ClassifiedCategory, ClassifiedListingDto, PaginatedResult } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { CLASSIFIED_CATEGORY_LABELS } from "@/lib/labels";
import { Badge, Card, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function ClassifiedsListScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ClassifiedCategory | "">("");
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<PaginatedResult<ClassifiedListingDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<ClassifiedListingDto>>(
          `/classifieds${buildQuery({ category: category || undefined, keyword: keyword || undefined })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, keyword]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton title="+ 发布信息" onPress={() => router.push("/classifieds/new")} />
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <TextField placeholder="搜索标题或描述..." value={keyword} onChangeText={setKeyword} style={{ marginBottom: 10 }} />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
              data={[["", "全部"], ...Object.entries(CLASSIFIED_CATEGORY_LABELS)]}
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
        ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无信息</Text> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/classifieds/${item.id}`)}>
            <Card>
              <Badge label={CLASSIFIED_CATEGORY_LABELS[item.category]} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.price}>
                {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : "价格面议/免费"}
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
