import { Stack } from "expo-router";

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "跑腿代办" }} />
      <Stack.Screen name="new" options={{ title: "发布任务" }} />
      <Stack.Screen name="[id]" options={{ title: "任务详情" }} />
    </Stack>
  );
}
