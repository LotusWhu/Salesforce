"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) return <p className="text-neutral-500">加载中...</p>;

  if (!user) {
    return (
      <div className="card max-w-md">
        <p>请先登录。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
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
            setMessage("Google 日历已连接成功！预约确认后会自动同步到你的日历。");
            refresh();
          }}
          onError={() => setError("Google 日历连接失败，请重试。")}
        />
        <StripeConnectCallbackNotice
          onReturn={() => {
            setMessage("已从 Stripe 入驻页面返回，正在刷新收款账号状态...");
            refreshStripeStatus();
          }}
        />
      </Suspense>

      <div className="card">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.phone}</p>
        <p className="mt-1 text-sm text-neutral-500">
          评分: {user.ratingAvg.toFixed(1)} ({user.ratingCount} 条评价)
        </p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Google 日历同步</h2>
            <p className="mt-1 text-sm text-neutral-500">
              连接后，上门服务预约在客户确认验证码后会自动同步到你的 Google 日历，
              方便个体户（如钢琴老师、保洁阿姨）统一管理自己的预约时间。
            </p>
            <p className="mt-2 text-sm">
              状态:{" "}
              <span className={user.googleCalendarConnected ? "font-medium text-green-600" : "text-neutral-500"}>
                {user.googleCalendarConnected ? "已连接" : "未连接"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          {user.googleCalendarConnected ? (
            <button className="btn-secondary text-sm" disabled={connecting} onClick={disconnectGoogleCalendar}>
              断开连接
            </button>
          ) : (
            <button className="btn-primary text-sm" disabled={connecting} onClick={connectGoogleCalendar}>
              {connecting ? "跳转中..." : "连接 Google 日历"}
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">我的预约管理</h2>
            <p className="mt-1 text-sm text-neutral-500">
              查看客户预约你服务的时间安排，按日期分组展示，可确认完成或取消。
            </p>
          </div>
          <Link href="/me/schedule" className="btn-secondary text-sm">
            查看日程
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">我的消息</h2>
            <p className="mt-1 text-sm text-neutral-500">跑腿任务/预约/拼车/分类信息下的公开留言</p>
          </div>
          <Link href="/me/messages" className="btn-secondary text-sm">
            查看消息
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold">收款账号 (Stripe Connect)</h2>
        <p className="mt-1 text-sm text-neutral-500">
          跑腿任务/预约/拼车的费用会先进入平台担保账户，服务确认完成后自动扣除平台服务费，净额通过 Stripe
          转给你——个体户(跑腿者/服务提供者/车主)需要先完成这个收款账号入驻才能收到分账。
        </p>
        <p className="mt-2 text-sm">
          状态:{" "}
          <span className={user.stripeConnectOnboarded ? "font-medium text-green-600" : "text-neutral-500"}>
            {user.stripeConnectOnboarded ? "已入驻，可接收分账" : "未入驻"}
          </span>
        </p>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary text-sm" disabled={connecting} onClick={connectStripe}>
            {connecting ? "处理中..." : user.stripeConnectOnboarded ? "重新设置收款账号" : "设置收款账号"}
          </button>
          <button className="btn-secondary text-sm" disabled={connecting} onClick={refreshStripeStatus}>
            刷新状态
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">我的交易</h2>
            <p className="mt-1 text-sm text-neutral-500">担保交易(托管/释放/退款)记录</p>
          </div>
          <Link href="/me/payments" className="btn-secondary text-sm">
            查看交易
          </Link>
        </div>
      </div>
    </div>
  );
}
