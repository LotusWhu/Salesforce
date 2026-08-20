import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { AppState, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUPPORTED_CITIES } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { Card, ErrorText, PrimaryButton, SecondaryButton, SuccessText, colors } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

function LocaleSettingsCard() {
  const { locale, setLocale, city, setCity, t } = useLocale();
  return (
    <Card>
      <Text style={styles.cardTitle}>{t("profile.settings")}</Text>
      <Text style={[styles.subtitle, { marginTop: 8 }]}>{t("lang.label")}</Text>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
        <SecondaryButton title={t("lang.zh")} active={locale === "zh"} onPress={() => setLocale("zh")} />
        <SecondaryButton title={t("lang.en")} active={locale === "en"} onPress={() => setLocale("en")} />
      </View>
      <Text style={[styles.subtitle, { marginTop: 12 }]}>{t("city.label")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <SecondaryButton title={t("city.all")} active={!city} onPress={() => setCity(null)} />
          {SUPPORTED_CITIES.map((c) => (
            <SecondaryButton key={c.value} title={c[locale]} active={city === c.value} onPress={() => setCity(c.value)} />
          ))}
        </View>
      </ScrollView>
    </Card>
  );
}

export default function ProfileTab() {
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();
  const { t } = useLocale();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const awaitingReturn = useRef(false);

  useEffect(() => {
    if (user) {
      api
        .get<{ unreadCount: number }>("/notifications")
        .then((r) => setUnreadCount(r.unreadCount))
        .catch(() => {});
    }
  }, [user]);

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
        <Text>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <Text style={styles.title}>{t("profile.notLoggedInTitle")}</Text>
          <Text style={styles.subtitle}>{t("profile.notLoggedInSubtitle")}</Text>
          <View style={{ height: 12 }} />
          <PrimaryButton title={t("profile.phoneLogin")} onPress={() => router.push("/login")} />
        </Card>
        <LocaleSettingsCard />
      </ScrollView>
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
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.subtitle}>{user.phone}</Text>
        <Text style={styles.subtitle}>
          {t("profile.rating")}: {user.ratingAvg.toFixed(1)} ({user.ratingCount} {t("profile.reviews")})
        </Text>
        <View style={{ height: 12 }} />
        <SecondaryButton title={t("profile.logout")} onPress={logout} />
      </Card>

      <LocaleSettingsCard />

      <Card>
        <Text style={styles.cardTitle}>{t("profile.googleCalendarTitle")}</Text>
        <Text style={styles.subtitle}>{t("profile.googleCalendarDesc")}</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          {t("common.status")}: {user.googleCalendarConnected ? t("common.connected") : t("common.notConnected")}
        </Text>
        <SuccessText>{message}</SuccessText>
        <ErrorText>{error}</ErrorText>
        <View style={{ height: 8 }} />
        {user.googleCalendarConnected ? (
          <SecondaryButton title={t("common.disconnect")} onPress={disconnectGoogleCalendar} disabled={connecting} />
        ) : (
          <PrimaryButton
            title={connecting ? t("common.jumping") : t("profile.googleCalendarConnect")}
            onPress={connectGoogleCalendar}
            disabled={connecting}
          />
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t("profile.scheduleTitle")}</Text>
        <Text style={styles.subtitle}>{t("profile.scheduleDesc")}</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title={t("profile.viewSchedule")} onPress={() => router.push("/profile/schedule")} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>
          {t("profile.notificationsTitle")}
          {unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
        <Text style={styles.subtitle}>{t("profile.notificationsDesc")}</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title={t("profile.viewNotifications")} onPress={() => router.push("/profile/notifications")} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t("profile.messagesTitle")}</Text>
        <Text style={styles.subtitle}>{t("profile.messagesDesc")}</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title={t("profile.viewMessages")} onPress={() => router.push("/profile/messages")} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t("profile.stripeTitle")}</Text>
        <Text style={styles.subtitle}>{t("profile.stripeDesc")}</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          {t("common.status")}: {user.stripeConnectOnboarded ? t("profile.stripeOnboarded") : t("profile.stripeNotOnboarded")}
        </Text>
        <View style={{ height: 8 }} />
        <PrimaryButton
          title={connecting ? t("common.processing") : user.stripeConnectOnboarded ? t("profile.stripeResetup") : t("profile.stripeSetup")}
          onPress={connectStripe}
          disabled={connecting}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t("profile.paymentsTitle")}</Text>
        <Text style={styles.subtitle}>{t("profile.paymentsDesc")}</Text>
        <View style={{ height: 8 }} />
        <SecondaryButton title={t("profile.viewPayments")} onPress={() => router.push("/profile/payments")} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 },
});
