import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { NotificationDto, PaginatedResult } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { Card, colors } from "@/components/ui";

function hrefFor(n: NotificationDto): string | null {
  const data = n.data ?? {};
  if (data.taskId) return `/tasks/${data.taskId}`;
  if (data.tripId) return `/carpool/${data.tripId}`;
  if (data.contextType === "TASK" && data.contextId) return `/tasks/${data.contextId}`;
  if (data.contextType === "CARPOOL_TRIP" && data.contextId) return `/carpool/${data.contextId}`;
  if (data.contextType === "CLASSIFIED_LISTING" && data.contextId) return `/classifieds/${data.contextId}`;
  if (data.contextType === "BOOKING" || data.bookingId) return "/profile/schedule";
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationDto[] | null>(null);

  const load = () => {
    api.get<PaginatedResult<NotificationDto>>("/notifications").then((r) => setItems(r.items));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={items ?? []}
        keyExtractor={(n) => n.id}
        ListEmptyComponent={items !== null ? <Text style={styles.empty}>暂无通知</Text> : null}
        renderItem={({ item }) => {
          const href = hrefFor(item);
          return (
            <Pressable
              onPress={() => {
                if (!item.read) markRead(item.id);
                if (href) router.push(href as never);
              }}
            >
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.body}>{item.body}</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  {!item.read && <View style={styles.dot} />}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 14, fontWeight: "600", color: colors.text },
  body: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  time: { fontSize: 11, color: colors.subtext, marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", marginLeft: 8, marginTop: 4 },
});
