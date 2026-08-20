import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ConversationContextType, ConversationSummaryDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { Badge, Card, colors } from "@/components/ui";

const CONTEXT_LABELS: Record<ConversationContextType, string> = {
  TASK: "跑腿任务",
  BOOKING: "上门服务预约",
  CARPOOL_TRIP: "拼车行程",
  CLASSIFIED_LISTING: "分类信息",
};

function hrefFor(c: ConversationSummaryDto): string | null {
  switch (c.contextType) {
    case "TASK":
      return `/tasks/${c.contextId}`;
    case "CARPOOL_TRIP":
      return `/carpool/${c.contextId}`;
    case "CLASSIFIED_LISTING":
      return `/classifieds/${c.contextId}`;
    default:
      return null;
  }
}

export default function MyMessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummaryDto[] | null>(null);

  useEffect(() => {
    api.get<ConversationSummaryDto[]>("/chat/mine").then(setConversations);
  }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={conversations ?? []}
        keyExtractor={(c) => `${c.contextType}-${c.contextId}`}
        ListEmptyComponent={conversations !== null ? <Text style={styles.empty}>暂无消息</Text> : null}
        renderItem={({ item }) => {
          const href = hrefFor(item);
          return (
            <Pressable disabled={!href} onPress={() => href && router.push(href as never)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Badge label={CONTEXT_LABELS[item.contextType]} />
                    <Text style={styles.preview} numberOfLines={2}>
                      {item.lastMessagePreview ?? "暂无留言"}
                    </Text>
                  </View>
                  {item.unread && <View style={styles.dot} />}
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
  preview: { fontSize: 13, color: colors.text, marginTop: 6 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", marginLeft: 8, marginTop: 4 },
});
