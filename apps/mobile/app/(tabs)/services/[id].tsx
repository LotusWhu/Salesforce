import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BookingDto,
  NextAvailableSlotDto,
  ServiceCategory,
  ServiceTier,
  SERVICE_CATEGORY_TIER,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SecondaryButton, SuccessText, TextField, colors } from "@/components/ui";

function toLocalDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ServiceDetail {
  id: string;
  category: keyof typeof SERVICE_CATEGORY_LABELS;
  title: string;
  description: string;
  priceType: string;
  price: string;
  currency: string;
  durationMinutes: number;
  serviceArea: string | null;
  provider: { id: string; name: string };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [quickBooking, setQuickBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<ServiceDetail>(`/services/${id}`).then(setService);
  }, [id]);

  if (!service) {
    return (
      <View style={styles.screen}>
        <Text style={{ padding: 16 }}>加载中...</Text>
      </View>
    );
  }

  const isImmediateTier = SERVICE_CATEGORY_TIER[service.category as ServiceCategory] === ServiceTier.IMMEDIATE;

  const quickBookEarliest = async () => {
    setError(null);
    setMessage(null);
    setQuickBooking(true);
    try {
      const next = await api.get<NextAvailableSlotDto | null>(`/services/${service.id}/next-available`);
      if (!next) {
        setError("暂时没有可用时段，请手动选择日期时间");
        return;
      }
      const start = new Date(next.scheduledStart);
      setDate(toLocalDateInput(start));
      setStartTime(toLocalTimeInput(start));
      setMessage(`已为你自动选中最早可用时段: ${start.toLocaleString()}，请确认地址后提交`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取最早可用时段失败");
    } finally {
      setQuickBooking(false);
    }
  };

  const createBooking = async () => {
    setError(null);
    setMessage(null);
    if (!date || !startTime) {
      setError("请填写预约日期 (YYYY-MM-DD) 和时间 (HH:mm)");
      return;
    }
    setBusy(true);
    try {
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);
      const created = await api.post<BookingDto>("/bookings", {
        serviceId: service.id,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        address: address ? { lat: 0, lng: 0, address } : undefined,
        notes: notes || undefined,
      });
      setBooking(created);
      setMessage("预约已提交，验证码已发送至你的手机，请输入验证码确认预约");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "预约失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!booking) return;
    setError(null);
    setBusy(true);
    try {
      const confirmed = await api.post<BookingDto>(`/bookings/${booking.id}/confirm-otp`, { code: otpCode });
      setBooking(confirmed);
      setMessage("预约已确认！已尝试同步到服务提供者的 Google 日历。");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "验证码校验失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Badge label={SERVICE_CATEGORY_LABELS[service.category]} />
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.desc}>{service.description}</Text>
        <Text style={styles.price}>
          {service.currency} {service.price} {service.priceType === "HOURLY" ? "/ 小时" : "/ 次"} · 约
          {service.durationMinutes}分钟
        </Text>
        <Text style={styles.meta}>
          服务者: {service.provider.name} · 服务区域: {service.serviceArea ?? "-"}
        </Text>
        {service.availability.length > 0 && (
          <Text style={styles.meta}>
            可预约: {service.availability.map((a) => `${WEEKDAYS[a.dayOfWeek]} ${a.startTime}-${a.endTime}`).join("; ")}
          </Text>
        )}
      </Card>

      {!user && (
        <Card>
          <Text>请先登录后再预约。</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title="去登录" onPress={() => router.push("/login")} />
        </Card>
      )}

      {user && !booking && isImmediateTier && (
        <Card>
          <Text style={styles.cardTitle}>即时/家政服务，可快速下单</Text>
          <Text style={styles.meta}>一键选中最早可用时段，确认地址即可提交</Text>
          <View style={{ height: 8 }} />
          <SecondaryButton title={quickBooking ? "查找中..." : "立即预约(最早可用)"} onPress={quickBookEarliest} disabled={quickBooking} />
        </Card>
      )}

      {user && !booking && (
        <Card>
          <Text style={styles.cardTitle}>预约此服务</Text>
          <SuccessText>{message}</SuccessText>
          <Field label="日期 (YYYY-MM-DD)">
            <TextField placeholder="2026-08-20" value={date} onChangeText={setDate} />
          </Field>
          <Field label="时间 (HH:mm)">
            <TextField placeholder="10:00" value={startTime} onChangeText={setStartTime} />
          </Field>
          <Field label="服务地址">
            <TextField value={address} onChangeText={setAddress} />
          </Field>
          <Field label="备注 (可选)">
            <TextField value={notes} onChangeText={setNotes} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="提交预约" onPress={createBooking} loading={busy} />
        </Card>
      )}

      {booking && booking.status === "PENDING_CONFIRMATION" && (
        <Card>
          <Text style={styles.cardTitle}>输入短信验证码确认预约</Text>
          <SuccessText>{message}</SuccessText>
          <Field label="6位验证码">
            <TextField keyboardType="number-pad" maxLength={6} value={otpCode} onChangeText={setOtpCode} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="确认预约" onPress={confirmOtp} disabled={otpCode.length !== 6} loading={busy} />
        </Card>
      )}

      {booking && booking.status === "CONFIRMED" && (
        <Card>
          <SuccessText>{message ?? "预约已确认"}</SuccessText>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 6 },
  desc: { fontSize: 14, color: colors.text, marginTop: 6 },
  price: { fontSize: 14, color: colors.brandDark, fontWeight: "600", marginTop: 6 },
  meta: { fontSize: 13, color: colors.subtext, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 },
});
