import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("nav.home"), tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: t("nav.tasks"), tabBarIcon: () => <TabIcon emoji="🏃" /> }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: t("nav.services"), tabBarIcon: () => <TabIcon emoji="🧹" /> }}
      />
      <Tabs.Screen
        name="carpool"
        options={{ title: t("nav.carpool"), tabBarIcon: () => <TabIcon emoji="🚗" /> }}
      />
      <Tabs.Screen
        name="classifieds"
        options={{ title: t("nav.classifieds"), tabBarIcon: () => <TabIcon emoji="📋" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("nav.profile"), tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tabs>
  );
}
