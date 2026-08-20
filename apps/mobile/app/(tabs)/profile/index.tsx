import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { AppState, Linking, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "@/lib/api";
import { Card, ErrorText, PrimaryButton, SecondaryButton, SuccessText, colors } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function ProfileTab() {
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const awaitingReturn = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && awaitingReturn.current) {
        awaitingReturn.current = false;
        // 从 Google 日历授权页/Stripe 入驻页返回时都会触发这里；
        // Stripe 状态需要主动查询 (没有接 webhook)，Google Calendar 状态在回调时已经更新，多查一次是无害的空操作
        api
          .post("/me/stripe-connect/refresh-status")
          .catch(() => undefined)
          .finally(() => refresh());
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const connectGoogleCalendar = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { url } = await api.get<{ url: string }>("/me/google-calendar/auth-url");
      awaitingReturn.current = true;
      await Linking.openURL(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取授权链接失败");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    setError(null);
    setConnecting(true);
    try {
      await api.delete("/me/google-calendar");
      await refresh();
      setMessage("已断开 Google 日历连接");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "断开连接失败");
    } finally {
      setConnecting(false);
    }
  };

  const connectStripe = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { url } = await api.get<{ url: string }>("/me/stripe-connect/onboarding-link");
      awaitingReturn.current = true;
      await Linking.openURL(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取入驻链接失败");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={[styles.screen, { padding: 16, gap: 12 }]}>
      <Card>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.subtitle}>{user.phone}</Text>
        <Text style={styles.subtitle}>
          评分: {user.ratingAvg.toFixed(1)} ({user.ratingCount} 条评价)
        </Text>
        <View style={{ height: 12 }} />
        <SecondaryButton title="退出登录" onPress={logout} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Google 日历同步</Text>
        <Text style={styles.subtitle}>
          连接后，上门服务预约在客户确认验证码后会自动同步到你的 Google 日历，方便个体户（如钢琴老师、保洁阿姨）统一管理预约时间。
        </Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          状态: {user.googleCalendarConnected ? "已连接" : "未连接"}
        </Text>
        <SuccessText>{message}</SuccessText>
        <ErrorText>{error}</ErrorText>
        <View style={{ height: 8 }} />
        {user.googleCalendarConnected ? (
          <SecondaryButton title="断开连接" onPress={disconnectGoogleCalendar} disabled={connecting} />
        ) : (
          <PrimaryButton title={connecting ? "跳转中..." : "连接 Google 日历"} onPress={connectGoogleCalendar} disabled={connecting} />
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>我的预约管理</Text>
        <Text style={styles.subtitle}>查看客户预约你服务的时间安排，按日期分组展示，可确认完成或取消。</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title="查看日程" onPress={() => router.push("/profile/schedule")} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>我的消息</Text>
        <Text style={styles.subtitle}>跑腿任务/预约/拼车/分类信息下的公开留言</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title="查看消息" onPress={() => router.push("/profile/messages")} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>收款账号 (Stripe Connect)</Text>
        <Text style={styles.subtitle}>
          跑腿任务/预约/拼车的费用会先进入平台担保账户，服务确认完成后自动扣除平台服务费，净额转给你——需要先完成这个收款账号入驻才能收到分账。
        </Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          状态: {user.stripeConnectOnboarded ? "已入驻，可接收分账" : "未入驻"}
        </Text>
        <View style={{ height: 8 }} />
        <PrimaryButton
          title={connecting ? "处理中..." : user.stripeConnectOnboarded ? "重新设置收款账号" : "设置收款账号"}
          onPress={connectStripe}
          disabled={connecting}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>我的交易</Text>
        <Text style={styles.subtitle}>担保交易(托管/释放/退款)记录</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title="查看交易" onPress={() => router.push("/profile/payments")} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 },
});
