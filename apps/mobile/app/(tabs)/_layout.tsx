import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/components/ui";

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        headerStyle: { backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "首页", tabBarIcon: () => <TabIcon emoji="🏠" /> }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: "跑腿代办", tabBarIcon: () => <TabIcon emoji="🏃" /> }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: "上门服务", tabBarIcon: () => <TabIcon emoji="🧹" /> }}
      />
      <Tabs.Screen
        name="carpool"
        options={{ title: "拼车接送机", tabBarIcon: () => <TabIcon emoji="🚗" /> }}
      />
      <Tabs.Screen
        name="classifieds"
        options={{ title: "分类信息", tabBarIcon: () => <TabIcon emoji="📋" /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "我的", tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tabs>
  );
}
