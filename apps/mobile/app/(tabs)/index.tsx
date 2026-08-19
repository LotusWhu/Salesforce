import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "@/components/ui";

const MODULES = [
  { href: "/tasks", emoji: "🏃", title: "跑腿代办", desc: "代买票、代看房拍照、代排队、代购等" },
  { href: "/services", emoji: "🧹", title: "上门服务预约", desc: "保洁、美甲、钢琴教学，短信验证码+日历同步" },
  { href: "/carpool", emoji: "🚗", title: "拼车接送机", desc: "接送机拼车，填航班号方便举牌接机" },
  { href: "/classifieds", emoji: "📋", title: "分类信息", desc: "二手交易、租房、招聘求职、社区活动" },
] as const;

export default function HomeTab() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>LocalHub · 华人生活服务平台</Text>
        <Text style={styles.heroSubtitle}>跑腿代办、上门服务、拼车接送机、分类信息，一个 App 搞定海外生活大小事</Text>
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
