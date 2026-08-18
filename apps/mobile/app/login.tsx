import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { OtpPurpose, RequestOtpResponse, VerifyOtpResponse } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, ErrorText, Field, PrimaryButton, SecondaryButton, TextField, colors } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
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
      setError(e instanceof ApiError ? e.message : "发送验证码失败，请稍后重试");
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
      setError(e instanceof ApiError ? e.message : "验证码校验失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Card>
        <Field label="手机号 (含国家代码，如 +61)">
          <TextField
            value={phone}
            onChangeText={setPhone}
            placeholder="+61412345678"
            keyboardType="phone-pad"
            editable={step === "phone"}
          />
        </Field>

        {step === "code" && (
          <Field label="验证码">
            <TextField
              value={code}
              onChangeText={setCode}
              placeholder="6位数字验证码"
              keyboardType="number-pad"
              maxLength={6}
            />
            {debugCode && <Text style={styles.debug}>开发环境调试验证码: {debugCode}</Text>}
          </Field>
        )}

        <ErrorText>{error}</ErrorText>

        {step === "phone" ? (
          <PrimaryButton title="获取验证码" onPress={requestOtp} disabled={!phone} loading={loading} />
        ) : (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="返回" onPress={() => setStep("phone")} disabled={loading} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="登录" onPress={verifyOtp} disabled={code.length !== 6} loading={loading} />
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
