"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

function GoogleCalendarCallbackNotice({
  onConnected,
  onError,
}: {
  onConnected: () => void;
  onError: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("googleCalendar");
    if (status === "connected") onConnected();
    else if (status === "error") onError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

function StripeConnectCallbackNotice({ onReturn }: { onReturn: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("stripeConnect") === "done") onReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function MePage() {
  const { user, loading, refresh } = useAuth();
  const { t } = useLocale();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api
        .get<{ unreadCount: number }>("/notifications")
        .then((r) => setUnreadCount(r.unreadCount))
        .catch(() => {});
    }
  }, [user]);

  if (loading) return <p className="text-neutral-500">{t("common.loading")}</p>;

  if (!user) {
    return (
      <div className="card max-w-md">
        <p>{t("common.loginFirst")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const connectGoogleCalendar = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { url } = await api.get<{ url: string }>("/me/google-calendar/auth-url");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取授权链接失败");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    setError(null);
    setConnecting(true);
    try {
      await api.delete("/me/google-calendar");
      await refresh();
      setMessage("已断开 Google 日历连接");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "断开连接失败");
    } finally {
      setConnecting(false);
    }
  };

  const connectStripe = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { url } = await api.get<{ url: string }>("/me/stripe-connect/onboarding-link");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "获取入驻链接失败");
    } finally {
      setConnecting(false);
    }
  };

  const refreshStripeStatus = async () => {
    setError(null);
    setConnecting(true);
    try {
      await api.post("/me/stripe-connect/refresh-status");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "刷新入驻状态失败");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Suspense fallback={null}>
        <GoogleCalendarCallbackNotice
          onConnected={() => {
            setMessage(t("profile.googleCalendarConnected"));
            refresh();
          }}
          onError={() => setError(t("profile.googleCalendarConnectFailed"))}
        />
        <StripeConnectCallbackNotice
          onReturn={() => {
            setMessage(t("profile.stripeReturning"));
            refreshStripeStatus();
          }}
        />
      </Suspense>

      <div className="card">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.phone}</p>
        <p className="mt-1 text-sm text-neutral-500">
          {t("profile.rating")}: {user.ratingAvg.toFixed(1)} ({user.ratingCount} {t("profile.reviews")})
        </p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t("profile.googleCalendarTitle")}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.googleCalendarDesc")}</p>
            <p className="mt-2 text-sm">
              {t("common.status")}:{" "}
              <span className={user.googleCalendarConnected ? "font-medium text-green-600" : "text-neutral-500"}>
                {user.googleCalendarConnected ? t("common.connected") : t("common.notConnected")}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          {user.googleCalendarConnected ? (
            <button className="btn-secondary text-sm" disabled={connecting} onClick={disconnectGoogleCalendar}>
              {t("common.disconnect")}
            </button>
          ) : (
            <button className="btn-primary text-sm" disabled={connecting} onClick={connectGoogleCalendar}>
              {connecting ? t("common.jumping") : t("profile.googleCalendarConnect")}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t("profile.scheduleTitle")}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.scheduleDesc")}</p>
          </div>
          <Link href="/me/schedule" className="btn-secondary text-sm">
            {t("profile.viewSchedule")}
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              {t("profile.notificationsTitle")}
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.notificationsDesc")}</p>
          </div>
          <Link href="/me/notifications" className="btn-secondary text-sm">
            {t("profile.viewNotifications")}
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t("profile.messagesTitle")}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.messagesDesc")}</p>
          </div>
          <Link href="/me/messages" className="btn-secondary text-sm">
            {t("profile.viewMessages")}
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold">{t("profile.stripeTitle")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("profile.stripeDesc")}</p>
        <p className="mt-2 text-sm">
          {t("common.status")}:{" "}
          <span className={user.stripeConnectOnboarded ? "font-medium text-green-600" : "text-neutral-500"}>
            {user.stripeConnectOnboarded ? t("profile.stripeOnboarded") : t("profile.stripeNotOnboarded")}
          </span>
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary text-sm" disabled={connecting} onClick={connectStripe}>
            {connecting ? t("common.processing") : user.stripeConnectOnboarded ? t("profile.stripeResetup") : t("profile.stripeSetup")}
          </button>
          <button className="btn-secondary text-sm" disabled={connecting} onClick={refreshStripeStatus}>
            {t("common.refreshStatus")}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t("profile.paymentsTitle")}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.paymentsDesc")}</p>
          </div>
          <Link href="/me/payments" className="btn-secondary text-sm">
            {t("profile.viewPayments")}
          </Link>
        </div>
      </div>
    </div>
  );
}
