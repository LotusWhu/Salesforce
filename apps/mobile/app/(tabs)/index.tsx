import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";

export default function HomeTab() {
  const { t } = useLocale();

  const MODULES = [
    { href: "/tasks", emoji: "🏃", title: t("nav.tasks"), desc: t("home.tasksDesc") },
    { href: "/services", emoji: "🧹", title: t("nav.services"), desc: t("home.servicesDesc") },
    { href: "/carpool", emoji: "🚗", title: t("nav.carpool"), desc: t("home.carpoolDesc") },
    { href: "/classifieds", emoji: "📋", title: t("nav.classifieds"), desc: t("home.classifiedsDesc") },
  ] as const;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t("home.heroTitle")}</Text>
        <Text style={styles.heroSubtitle}>{t("home.heroSubtitle")}</Text>
      </View>

      {MODULES.map((m) => (
        <Link key={m.href} href={m.href as never} asChild>
          <Pressable style={styles.moduleCard}>
            <Text style={styles.moduleEmoji}>{m.emoji}</Text>
            <Text style={styles.moduleTitle}>{m.title}</Text>
            <Text style={styles.moduleDesc}>{m.desc}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  heroSubtitle: { color: "#ffe8e4", fontSize: 13, marginTop: 6 },
  moduleCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  moduleEmoji: { fontSize: 28, marginBottom: 6 },
  moduleTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  moduleDesc: { fontSize: 13, color: colors.subtext, marginTop: 4 },
});
