import { Stack } from "expo-router";

export default function ServicesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "上门服务预约" }} />
      <Stack.Screen name="new" options={{ title: "发布服务" }} />
      <Stack.Screen name="[id]" options={{ title: "服务详情" }} />
    </Stack>
  );
}
