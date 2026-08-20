import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BookingDto,
  ConversationContextType,
  NextAvailableSlotDto,
  SERVICE_CATEGORY_LABELS,
  ServiceCategory,
} from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Badge, Card, ErrorText, Field, PrimaryButton, SecondaryButton, SuccessText, TextField, colors } from "@/components/ui";
import PhotoGallery from "@/components/PhotoGallery";
import MessageThread from "@/components/MessageThread";

function toLocalDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface ServiceDetail {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  priceType: string;
  price: string;
  currency: string;
  durationMinutes: number;
  serviceArea: string | null;
  supportsInstantBooking: boolean;
  photos: string[];
  provider: { id: string; name: string };
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
        <Text style={{ padding: 16 }}>{t("common.loading")}</Text>
      </View>
    );
  }

  const priceUnit = service.priceType === "HOURLY" ? t("services.perHour") : t("services.perSession");

  const quickBookEarliest = async () => {
    setError(null);
    setMessage(null);
    setQuickBooking(true);
    try {
      const next = await api.get<NextAvailableSlotDto | null>(`/services/${service.id}/next-available`);
      if (!next) {
        setError(t("services.noSlotsAvailable"));
        return;
      }
      const start = new Date(next.scheduledStart);
      setDate(toLocalDateInput(start));
      setStartTime(toLocalTimeInput(start));
      setMessage(`${t("services.quickBookPicked")}: ${start.toLocaleString()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.fetchSlotFailed"));
    } finally {
      setQuickBooking(false);
    }
  };

  const createBooking = async () => {
    setError(null);
    setMessage(null);
    if (!date || !startTime) {
      setError(t("services.fillDateTime"));
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
      setMessage(t("services.bookingSubmitted"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.bookingFailed"));
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
      setMessage(t("services.bookingConfirmed"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("services.otpFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Badge label={SERVICE_CATEGORY_LABELS[locale][service.category]} />
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.desc}>{service.description}</Text>
        <Text style={styles.price}>
          {service.currency} {service.price} {priceUnit} · {t("services.aboutMinutes")}
          {service.durationMinutes} {t("services.minutes")}
        </Text>
        <Text style={styles.meta}>
          {t("services.provider")}: {service.provider.name} · {t("services.serviceArea")}: {service.serviceArea ?? "-"}
        </Text>
        {service.availability.length > 0 && (
          <Text style={styles.meta}>
            {t("services.availableTimes")}: {service.availability.map((a) => `${WEEKDAYS[a.dayOfWeek]} ${a.startTime}-${a.endTime}`).join("; ")}
          </Text>
        )}
        <PhotoGallery urls={service.photos} />
      </Card>

      {!user && (
        <Card>
          <Text>{t("services.loginToBook")}</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("common.goLogin")} onPress={() => router.push("/login")} />
        </Card>
      )}

      {user && !booking && service.supportsInstantBooking && (
        <Card>
          <Text style={styles.cardTitle}>{t("services.instantSupport")}</Text>
          <Text style={styles.meta}>{t("services.instantSupportDesc")}</Text>
          <View style={{ height: 8 }} />
          <SecondaryButton
            title={quickBooking ? t("services.searching") : t("services.bookNowEarliest")}
            onPress={quickBookEarliest}
            disabled={quickBooking}
          />
        </Card>
      )}

      {user && !booking && (
        <Card>
          <Text style={styles.cardTitle}>{t("services.bookThisService")}</Text>
          <SuccessText>{message}</SuccessText>
          <Field label={t("services.dateFieldLabel")}>
            <TextField placeholder="2026-08-20" value={date} onChangeText={setDate} />
          </Field>
          <Field label={t("services.timeFieldLabel")}>
            <TextField placeholder="10:00" value={startTime} onChangeText={setStartTime} />
          </Field>
          <Field label={t("services.addressLabel")}>
            <TextField value={address} onChangeText={setAddress} />
          </Field>
          <Field label={t("services.notesLabel")}>
            <TextField value={notes} onChangeText={setNotes} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={t("services.submitBooking")} onPress={createBooking} loading={busy} />
        </Card>
      )}

      {booking && booking.status === "PENDING_CONFIRMATION" && (
        <Card>
          <Text style={styles.cardTitle}>{t("services.enterOtpTitle")}</Text>
          <SuccessText>{message}</SuccessText>
          <Field label={t("services.otpPlaceholder")}>
            <TextField keyboardType="number-pad" maxLength={6} value={otpCode} onChangeText={setOtpCode} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title={t("services.confirmBooking")} onPress={confirmOtp} disabled={otpCode.length !== 6} loading={busy} />
        </Card>
      )}

      {booking && booking.status === "CONFIRMED" && (
        <Card>
          <SuccessText>{message ?? t("services.bookingConfirmedFallback")}</SuccessText>
        </Card>
      )}

      {booking && <MessageThread contextType={ConversationContextType.BOOKING} contextId={booking.id} />}
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
