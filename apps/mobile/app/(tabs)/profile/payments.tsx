import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { PaymentDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { Card, colors } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  HELD: "已托管(担保中)",
  RELEASED: "已释放",
  REFUNDED: "已退款",
  FAILED: "失败",
};

const RELATED_LABELS: Record<string, string> = {
  TASK: "跑腿任务",
  BOOKING: "上门服务预约",
  CARPOOL_BOOKING: "拼车",
};

export default function MyPaymentsScreen() {
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);

  useEffect(() => {
    api.get<PaymentDto[]>("/payments/mine").then(setPayments);
  }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={payments ?? []}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={payments !== null ? <Text style={styles.empty}>暂无交易记录</Text> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.related}>{RELATED_LABELS[item.relatedType]}</Text>
              <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
            </View>
            <Text style={styles.amount}>
              {item.currency} {item.amount}
            </Text>
            {item.status === "RELEASED" && item.platformFeeAmount != null && (
              <Text style={styles.meta}>
                平台服务费 {item.currency} {item.platformFeeAmount} · 净额 {item.currency} {item.netAmount}
              </Text>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  related: { fontSize: 12, fontWeight: "600", color: colors.brandDark },
  status: { fontSize: 12, color: colors.subtext },
  amount: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 6 },
  meta: { fontSize: 11, color: colors.subtext, marginTop: 4 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
