import { Stack } from "expo-router";

export default function CarpoolLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "预订接送机" }} />
      <Stack.Screen name="trips" options={{ title: "浏览已发布行程" }} />
      <Stack.Screen name="new" options={{ title: "发布行程" }} />
      <Stack.Screen name="[id]" options={{ title: "行程详情" }} />
    </Stack>
  );
}
