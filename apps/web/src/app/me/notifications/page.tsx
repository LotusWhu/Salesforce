"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotificationDto, PaginatedResult } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";

function hrefFor(n: NotificationDto): string | null {
  const data = n.data ?? {};
  if (data.taskId) return `/tasks/${data.taskId}`;
  if (data.tripId) return `/carpool/${data.tripId}`;
  if (data.contextType === "TASK" && data.contextId) return `/tasks/${data.contextId}`;
  if (data.contextType === "CARPOOL_TRIP" && data.contextId) return `/carpool/${data.contextId}`;
  if (data.contextType === "CLASSIFIED_LISTING" && data.contextId) return `/classifieds/${data.contextId}`;
  if (data.contextType === "BOOKING" || data.bookingId) return "/me/schedule";
  return null;
}

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const [result, setResult] = useState<PaginatedResult<NotificationDto> | null>(null);

  const load = () => {
    api.get<PaginatedResult<NotificationDto> & { unreadCount: number }>("/notifications").then(setResult);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("notifications.title")}</h1>
        <button className="btn-secondary text-sm" onClick={markAllRead}>
          {t("notifications.markAllRead")}
        </button>
      </div>

      {result === null && <p className="text-neutral-500">{t("common.loading")}</p>}
      {result !== null && result.items.length === 0 && <p className="text-neutral-500">{t("notifications.empty")}</p>}

      {result?.items.map((n) => {
        const href = hrefFor(n);
        const content = (
          <div className={`card flex items-start justify-between gap-3 ${!n.read ? "border-brand-200" : ""}`}>
            <div>
              <p className="text-sm font-medium text-neutral-800">{n.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{n.body}</p>
              <p className="mt-1 text-xs text-neutral-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
          </div>
        );
        return (
          <div
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className="cursor-pointer"
          >
            {href ? (
              <Link href={href} className="block hover:opacity-80">
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
