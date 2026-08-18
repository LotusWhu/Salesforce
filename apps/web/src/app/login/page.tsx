"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OtpPurpose, RequestOtpResponse, VerifyOtpResponse } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
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
      const res = await api.post<RequestOtpResponse>("/auth/otp/request", {
        phone,
        purpose: OtpPurpose.LOGIN,
      });
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
      const res = await api.post<VerifyOtpResponse>("/auth/otp/verify", {
        phone,
        code,
        purpose: OtpPurpose.LOGIN,
      });
      if (res.accessToken) {
        await loginWithToken(res.accessToken);
        router.push("/");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "验证码校验失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-bold">手机号登录</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">手机号 (含国家代码，如 +61)</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+61412345678"
            disabled={step === "code"}
          />
        </div>

        {step === "code" && (
          <div>
            <label className="label">验证码</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6位数字验证码"
              maxLength={6}
            />
            {debugCode && (
              <p className="mt-1 text-xs text-neutral-400">开发环境调试验证码: {debugCode}</p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {step === "phone" ? (
          <button className="btn-primary w-full" onClick={requestOtp} disabled={loading || !phone}>
            {loading ? "发送中..." : "获取验证码"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setStep("phone")} disabled={loading}>
              返回
            </button>
            <button className="btn-primary flex-1" onClick={verifyOtp} disabled={loading || code.length !== 6}>
              {loading ? "验证中..." : "登录"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
