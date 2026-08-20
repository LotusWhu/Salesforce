import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedListingDto, ConversationContextType } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, colors } from "@/components/ui";
import PhotoGallery from "@/components/PhotoGallery";
import MessageThread from "@/components/MessageThread";

export default function ClassifiedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useLocale();
  const [item, setItem] = useState<(ClassifiedListingDto & { poster: { name: string } }) | null>(null);

  useEffect(() => {
    api.get<typeof item>(`/classifieds/${id}`).then(setItem);
  }, [id]);

  if (!item) {
    return (
      <View style={styles.screen}>
        <Text style={{ padding: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Badge label={CLASSIFIED_CATEGORY_LABELS[locale][item.category]} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.price}>
          {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable")}
        </Text>
        <Text style={styles.meta}>
          {t("classifieds.poster")}: {item.poster.name} · {t("classifieds.views")}: {item.viewCount}
        </Text>
        <PhotoGallery urls={item.photos} />
      </Card>

      <View style={{ height: 12 }} />
      <MessageThread contextType={ConversationContextType.CLASSIFIED_LISTING} contextId={item.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 14, color: colors.text, marginTop: 6 },
  price: { fontSize: 16, fontWeight: "700", color: colors.brandDark, marginTop: 8 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 6 },
});
