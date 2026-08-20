import { Stack } from "expo-router";

export default function ClassifiedsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "分类信息" }} />
      <Stack.Screen name="new" options={{ title: "发布信息" }} />
      <Stack.Screen name="[id]" options={{ title: "信息详情" }} />
    </Stack>
  );
}
