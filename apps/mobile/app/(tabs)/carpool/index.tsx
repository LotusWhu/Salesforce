import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CarpoolRequestDto, CarpoolType } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

const AIRPORTS = [
  { value: "Sydney Airport", label: "悉尼 SYD", city: "Sydney" },
  { value: "Melbourne Airport", label: "墨尔本 MEL", city: "Melbourne" },
  { value: "Brisbane Airport", label: "布里斯班 BNE", city: "Brisbane" },
  { value: "Perth Airport", label: "珀斯 PER", city: "Perth" },
  { value: "Gold Coast Airport", label: "黄金海岸 OOL", city: "Gold Coast" },
  { value: "Adelaide Airport", label: "阿德莱德 ADL", city: "Adelaide" },
];

const FLEXIBILITY_OPTIONS = [
  { minutes: 30, label: "精确匹配", hint: "±30分钟 · 标准价" },
  { minutes: 120, label: "较灵活", hint: "±2小时 · 更省钱" },
  { minutes: 720, label: "很灵活", hint: "±12小时 · 最省钱" },
];

type Direction = "TO_AIRPORT" | "FROM_AIRPORT";

export default function CarpoolBookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [direction, setDirection] = useState<Direction>("TO_AIRPORT");
  const [airport, setAirport] = useState(AIRPORTS[0].value);
  const [terminal, setTerminal] = useState("");
  const [otherLocation, setOtherLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengerCountText, setPassengerCountText] = useState("1");
  const [luggageCountText, setLuggageCountText] = useState("1");
  const [fareMode, setFareMode] = useState<"ONE_WAY" | "ROUND_TRIP">("ONE_WAY");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [flexibilityMinutes, setFlexibilityMinutes] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CarpoolRequestDto | null>(null);
  const [matchedTrip, setMatchedTrip] = useState<{ pricePerSeat: number; currency: string; departureTime: string } | null>(
    null,
  );

  const airportMeta = AIRPORTS.find((a) => a.value === airport)!;
  const timeLabel = direction === "TO_AIRPORT" ? "登车时间 (HH:mm)" : "航班到达时间 (HH:mm)";

  if (!user) {
    return (
      <View style={styles.screen}>
        <Card>
          <Text>请先登录后再预订接送机。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    setResult(null);
    setMatchedTrip(null);
    if (!otherLocation || !date || !time) {
      setError(direction === "TO_AIRPORT" ? "请填写接送地点和登车时间" : "请填写目的地和航班到达时间");
      return;
    }
    setSubmitting(true);
    try {
      const scheduledTime = new Date(`${date}T${time}:00`).toISOString();
      const returnScheduledTime =
        fareMode === "ROUND_TRIP" && returnDate && returnTime
          ? new Date(`${returnDate}T${returnTime}:00`).toISOString()
          : undefined;
      const type: CarpoolType = direction === "TO_AIRPORT" ? ("AIRPORT_DROPOFF" as CarpoolType) : ("AIRPORT_PICKUP" as CarpoolType);

      const req = await api.post<CarpoolRequestDto>("/carpool/requests", {
        type,
        airport,
        terminal: terminal || undefined,
        otherLocation: { lat: 0, lng: 0, address: otherLocation },
        city: airportMeta.city,
        scheduledTime,
        flightNumber: flightNumber || undefined,
        passengerCount: Number(passengerCountText) || 1,
        luggageCount: Number(luggageCountText) || 0,
        fareMode,
        returnScheduledTime,
        flexibilityMinutes,
      });
      setResult(req);
      if (req.status === "MATCHED" && req.matchedTripId) {
        const trip = await api.get<{ pricePerSeat: number; currency: string; departureTime: string }>(
          `/carpool/trips/${req.matchedTripId}`,
        );
        setMatchedTrip(trip);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.linksRow}>
        <SecondaryButton title="浏览已发布行程" onPress={() => router.push("/carpool/trips")} />
        <SecondaryButton title="我是车主" onPress={() => router.push("/carpool/new")} />
      </View>

      <Card>
        <View style={styles.tabRow}>
          {(
            [
              { key: "TO_AIRPORT", label: "送机 To Airport" },
              { key: "FROM_AIRPORT", label: "接机 From Airport" },
            ] as const
          ).map((tab) => (
            <SecondaryButton
              key={tab.key}
              title={tab.label}
              active={direction === tab.key}
              onPress={() => setDirection(tab.key)}
            />
          ))}
        </View>

        <Field label="机场">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {AIRPORTS.map((a) => (
              <SecondaryButton key={a.value} title={a.label} active={airport === a.value} onPress={() => setAirport(a.value)} />
            ))}
          </View>
        </Field>

        <Field label="航站楼 (可选)">
          <TextField placeholder="如 T1" value={terminal} onChangeText={setTerminal} />
        </Field>

        <Field label={direction === "TO_AIRPORT" ? "接送地点 (上车地址)" : "目的地地址"}>
          <TextField placeholder="输入详细地址" value={otherLocation} onChangeText={setOtherLocation} />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="日期 (YYYY-MM-DD)">
              <TextField placeholder="2026-09-05" value={date} onChangeText={setDate} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={timeLabel}>
              <TextField placeholder="08:00" value={time} onChangeText={setTime} />
            </Field>
          </View>
        </View>

        <Field label="航班号 (可选)">
          <TextField placeholder="未定可留空" value={flightNumber} onChangeText={setFlightNumber} />
        </Field>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="乘客人数">
              <TextField keyboardType="numeric" value={passengerCountText} onChangeText={setPassengerCountText} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="行李件数">
              <TextField keyboardType="numeric" value={luggageCountText} onChangeText={setLuggageCountText} />
            </Field>
          </View>
        </View>

        <Field label="行程类型">
          <View style={{ flexDirection: "row", gap: 8 }}>
            <SecondaryButton title="单程" active={fareMode === "ONE_WAY"} onPress={() => setFareMode("ONE_WAY")} />
            <SecondaryButton title="往返" active={fareMode === "ROUND_TRIP"} onPress={() => setFareMode("ROUND_TRIP")} />
          </View>
        </Field>

        {fareMode === "ROUND_TRIP" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="返程日期">
                <TextField placeholder="2026-09-10" value={returnDate} onChangeText={setReturnDate} />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="返程时间">
                <TextField placeholder="14:00" value={returnTime} onChangeText={setReturnTime} />
              </Field>
            </View>
          </View>
        )}

        <Field label="时间灵活度">
          <View style={{ gap: 8 }}>
            {FLEXIBILITY_OPTIONS.map((opt) => (
              <SecondaryButton
                key={opt.minutes}
                title={`${opt.label} · ${opt.hint}`}
                active={flexibilityMinutes === opt.minutes}
                onPress={() => setFlexibilityMinutes(opt.minutes)}
              />
            ))}
          </View>
        </Field>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title="Next 提交需求" onPress={submit} loading={submitting} />
      </Card>

      {result && result.status === "MATCHED" && (
        <Card style={{ marginTop: 12, borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}>
          <Text style={styles.successTitle}>已为你自动匹配到一辆时间相近的行程！</Text>
          {matchedTrip && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.meta}>出发时间: {new Date(matchedTrip.departureTime).toLocaleString()}</Text>
              <Text style={styles.meta}>
                当前单价: {matchedTrip.currency} {matchedTrip.pricePerSeat} / 座
              </Text>
            </View>
          )}
          <View style={{ height: 10 }} />
          <PrimaryButton title="查看行程详情" onPress={() => router.push(`/carpool/${result.matchedTripId}`)} />
        </Card>
      )}

      {result && result.status === "PENDING" && (
        <Card style={{ marginTop: 12, borderColor: "#fde68a", backgroundColor: "#fffbeb" }}>
          <Text style={styles.pendingTitle}>已加入拼车等待池</Text>
          <Text style={styles.meta}>
            暂时还没有时间相近的行程。一旦有司机发布匹配的行程，会自动为你拼上并通知你 —— 灵活度越高，等待的同时也更省钱。
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  linksRow: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "flex-end" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  successTitle: { fontSize: 14, fontWeight: "700", color: "#15803d" },
  pendingTitle: { fontSize: 14, fontWeight: "700", color: "#b45309", marginBottom: 4 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 2 },
});
