import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "我的" }} />
      <Stack.Screen name="schedule" options={{ title: "我的预约日程" }} />
      <Stack.Screen name="messages" options={{ title: "我的消息" }} />
      <Stack.Screen name="payments" options={{ title: "我的交易" }} />
    </Stack>
  );
}
