import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Card, PrimaryButton, SecondaryButton, colors } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function ProfileTab() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <View style={styles.screen}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.screen, { padding: 16 }]}>
        <Card>
          <Text style={styles.title}>还未登录</Text>
          <Text style={styles.subtitle}>登录后可发布任务、预约服务、拼车和分类信息</Text>
          <View style={{ height: 12 }} />
          <PrimaryButton title="手机号登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { padding: 16 }]}>
      <Card>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.subtitle}>{user.phone}</Text>
        <Text style={styles.subtitle}>
          评分: {user.ratingAvg.toFixed(1)} ({user.ratingCount} 条评价)
        </Text>
        <Text style={styles.subtitle}>
          Google 日历: {user.googleCalendarConnected ? "已连接" : "未连接"}
        </Text>
        <View style={{ height: 12 }} />
        <SecondaryButton title="退出登录" onPress={logout} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.subtext, marginTop: 4 },
});
