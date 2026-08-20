"use client";

import { useEffect, useState } from "react";
import { PaymentDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

function statusColor(status: string) {
  if (status === "HELD") return "bg-amber-50 text-amber-600";
  if (status === "RELEASED") return "bg-green-50 text-green-600";
  if (status === "REFUNDED") return "bg-neutral-100 text-neutral-500";
  return "bg-red-50 text-red-600";
}

export default function MyPaymentsPage() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const [payments, setPayments] = useState<PaymentDto[] | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("payments.pending"),
    HELD: t("payments.heldFull"),
    RELEASED: t("payments.released"),
    REFUNDED: t("payments.refunded"),
    FAILED: t("payments.failed"),
  };

  const RELATED_LABELS: Record<string, string> = {
    TASK: t("payments.relatedTask"),
    BOOKING: t("payments.relatedBooking"),
    CARPOOL_BOOKING: t("payments.relatedCarpool"),
  };

  useEffect(() => {
    if (user) api.get<PaymentDto[]>("/payments/mine").then(setPayments);
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

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="text-xl font-bold">{t("payments.title")}</h1>
      <p className="text-sm text-neutral-500">{t("payments.subtitle")}</p>

      {payments === null && <p className="text-neutral-500">{t("common.loading")}</p>}
      {payments !== null && payments.length === 0 && <p className="text-neutral-500">{t("payments.empty")}</p>}

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
              {t("payments.platformFee")} {p.currency} {p.platformFeeAmount} · {t("payments.netAmount")} {p.currency} {p.netAmount}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
