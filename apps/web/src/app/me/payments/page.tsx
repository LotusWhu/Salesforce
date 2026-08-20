"use client";

import { useEffect, useState } from "react";
import { PaymentDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  HELD: "已托管(担保中)",
  RELEASED: "已释放",
  REFUNDED: "已退款",
  FAILED: "失败",
};

const RELATED_LABELS: Record<string, string> = {
  TASK: "跑腿任务",
  BOOKING: "上门服务预约",
  CARPOOL_BOOKING: "拼车",
};

function statusColor(status: string) {
  if (status === "HELD") return "bg-amber-50 text-amber-600";
  if (status === "RELEASED") return "bg-green-50 text-green-600";
  if (status === "REFUNDED") return "bg-neutral-100 text-neutral-500";
  return "bg-red-50 text-red-600";
}

export default function MyPaymentsPage() {
  const { user, loading } = useAuth();
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);

  useEffect(() => {
    if (user) api.get<PaymentDto[]>("/payments/mine").then(setPayments);
  }, [user]);

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

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-xl font-bold">我的交易</h1>
      <p className="text-sm text-neutral-500">担保交易记录：下单/接单时款项进入平台托管(HELD)，服务确认完成后释放(RELEASED)给对方，取消则退款(REFUNDED)</p>

      {payments === null && <p className="text-neutral-500">加载中...</p>}
      {payments !== null && payments.length === 0 && <p className="text-neutral-500">暂无交易记录</p>}

      {payments?.map((p) => (
        <div key={p.id} className="card">
          <div className="flex items-center justify-between">
            <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
              {RELATED_LABELS[p.relatedType]}
            </span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>
              {STATUS_LABELS[p.status]}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-800">
            {p.currency} {p.amount}
          </p>
          {p.status === "RELEASED" && p.platformFeeAmount != null && (
            <p className="mt-1 text-xs text-neutral-500">
              平台服务费 {p.currency} {p.platformFeeAmount} · 净额 {p.currency} {p.netAmount}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
