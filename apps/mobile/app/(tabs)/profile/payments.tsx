import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { PaymentDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import { Card, colors } from "@/components/ui";

export default function MyPaymentsScreen() {
  const { t } = useLocale();
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("payments.pending"),
    HELD: t("payments.heldFull"),
    RELEASED: t("payments.released"),
    REFUNDED: t("payments.refunded"),
    FAILED: t("payments.failed"),
  };

  const RELATED_LABELS: Record<string, string> = {
    TASK: t("payments.relatedTask"),
    BOOKING: t("payments.relatedBooking"),
    CARPOOL_BOOKING: t("payments.relatedCarpool"),
  };

  useEffect(() => {
    api.get<PaymentDto[]>("/payments/mine").then(setPayments);
  }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={payments ?? []}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={payments !== null ? <Text style={styles.empty}>{t("payments.empty")}</Text> : null}
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
                {t("payments.platformFee")} {item.currency} {item.platformFeeAmount} · {t("payments.netAmount")} {item.currency}{" "}
                {item.netAmount}
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
