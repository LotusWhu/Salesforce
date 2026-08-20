import { Stack } from "expo-router";
import { useLocale } from "@/lib/locale-context";

export default function ProfileLayout() {
  const { t } = useLocale();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t("nav.profile") }} />
      <Stack.Screen name="schedule" options={{ title: t("schedule.title") }} />
      <Stack.Screen name="messages" options={{ title: t("messages.title") }} />
      <Stack.Screen name="notifications" options={{ title: t("notifications.title") }} />
      <Stack.Screen name="payments" options={{ title: t("payments.title") }} />
    </Stack>
  );
}
