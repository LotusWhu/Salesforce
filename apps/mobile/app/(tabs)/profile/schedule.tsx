import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { BOOKING_STATUS_LABELS, BookingStatus } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, ErrorText, PrimaryButton, SecondaryButton, colors } from "@/components/ui";

interface ScheduleBooking {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes: string | null;
  address: { lat: number; lng: number; address?: string } | null;
  service: { id: string; title: string; durationMinutes: number };
  customer: { id: string; name: string };
}

function dateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Row = { type: "header"; key: string } | { type: "booking"; booking: ScheduleBooking };

export default function MyScheduleScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const WEEKDAYS = [
    t("services.weekdaySun"),
    t("services.weekdayMon"),
    t("services.weekdayTue"),
    t("services.weekdayWed"),
    t("services.weekdayThu"),
    t("services.weekdayFri"),
    t("services.weekdaySat"),
  ];
  const formatDayLabel = (key: string) => {
    const d = new Date(`${key}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAYS[d.getDay()]}`;
  };
  const [bookings, setBookings] = useState<ScheduleBooking[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .get<ScheduleBooking[]>("/bookings/mine?as=provider")
      .then((items) =>
        setBookings([...items].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())),
      );

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setError(null);
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("schedule.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const rows: Row[] = [];
  const groups = new Map<string, ScheduleBooking[]>();
  (bookings ?? []).forEach((b) => {
    const key = dateKey(b.scheduledStart);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });
  [...groups.keys()].sort().forEach((key) => {
    rows.push({ type: "header", key });
    groups.get(key)!.forEach((booking) => rows.push({ type: "booking", booking }));
  });

  return (
    <View style={styles.screen}>
      <ErrorText>{error}</ErrorText>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={rows}
        keyExtractor={(row, idx) => (row.type === "header" ? `h-${row.key}` : row.booking.id) + idx}
        ListEmptyComponent={bookings !== null ? <Text style={styles.empty}>{t("schedule.noBookings")}</Text> : null}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return <Text style={styles.dayHeader}>{formatDayLabel(item.key)}</Text>;
          }
          const b = item.booking;
          return (
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingTitle}>
                    {formatTime(b.scheduledStart)} - {formatTime(b.scheduledEnd)} · {b.service.title}
                  </Text>
                  <Text style={styles.meta}>
                    {t("schedule.customer")}: {b.customer.name}
                  </Text>
                  {b.address?.address && (
                    <Text style={styles.meta}>
                      {t("schedule.address")}: {b.address.address}
                    </Text>
                  )}
                  {b.notes && (
                    <Text style={styles.meta}>
                      {t("schedule.notes")}: {b.notes}
                    </Text>
                  )}
                </View>
                <Badge label={BOOKING_STATUS_LABELS[locale][b.status as BookingStatus] ?? b.status} />
              </View>
              {(b.status === "CONFIRMED" || b.status === "IN_PROGRESS") && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <PrimaryButton
                    title={t("schedule.complete")}
                    onPress={() => run(b.id, () => api.post(`/bookings/${b.id}/complete`))}
                    disabled={busyId === b.id}
                  />
                  <SecondaryButton
                    title={t("schedule.cancel")}
                    onPress={() => run(b.id, () => api.post(`/bookings/${b.id}/cancel`))}
                    disabled={busyId === b.id}
                  />
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  dayHeader: { fontSize: 13, fontWeight: "700", color: colors.subtext, marginTop: 8, marginBottom: 2 },
  bookingTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  empty: { textAlign: "center", color: colors.subtext, marginTop: 40 },
});
