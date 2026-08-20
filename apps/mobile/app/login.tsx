import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { OtpPurpose, RequestOtpResponse, VerifyOtpResponse } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const { t } = useLocale();
  const [phone, setPhone] = useState("+61");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const requestOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<RequestOtpResponse>("/auth/otp/request", { phone, purpose: OtpPurpose.LOGIN });
      setDebugCode(res.debugCode ?? null);
      setStep("code");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.sendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<VerifyOtpResponse>("/auth/otp/verify", { phone, code, purpose: OtpPurpose.LOGIN });
      if (res.accessToken) {
        await loginWithToken(res.accessToken);
        router.back();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("login.verifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Card>
        <Field label={t("login.phoneLabel")}>
          <TextField
            value={phone}
            onChangeText={setPhone}
            placeholder="+61412345678"
            keyboardType="phone-pad"
            editable={step === "phone"}
          />
        </Field>

        {step === "code" && (
          <Field label={t("login.codeLabel")}>
            <TextField
              value={code}
              onChangeText={setCode}
              placeholder={t("login.codePlaceholder")}
              keyboardType="number-pad"
              maxLength={6}
            />
            {debugCode && (
              <Text style={styles.debug}>
                {t("login.debugCode")}: {debugCode}
              </Text>
            )}
          </Field>
        )}

        <ErrorText>{error}</ErrorText>

        {step === "phone" ? (
          <PrimaryButton title={t("login.sendCode")} onPress={requestOtp} disabled={!phone} loading={loading} />
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton title={t("common.back")} onPress={() => setStep("phone")} disabled={loading} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title={t("login.submit")} onPress={verifyOtp} disabled={code.length !== 6} loading={loading} />
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  debug: { fontSize: 12, color: colors.subtext, marginTop: 4 },
});
