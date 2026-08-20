"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConversationContextType, ConversationSummaryDto } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CONTEXT_LABELS: Record<ConversationContextType, string> = {
  TASK: "跑腿任务",
  BOOKING: "上门服务预约",
  CARPOOL_TRIP: "拼车行程",
  CLASSIFIED_LISTING: "分类信息",
};

function hrefFor(c: ConversationSummaryDto): string | null {
  switch (c.contextType) {
    case "TASK":
      return `/tasks/${c.contextId}`;
    case "CARPOOL_TRIP":
      return `/carpool/${c.contextId}`;
    case "CLASSIFIED_LISTING":
      return `/classifieds/${c.contextId}`;
    default:
      return null; // 上门服务预约暂时没有独立详情页，留言需回到对应服务详情页查看
  }
}

export default function MyMessagesPage() {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummaryDto[] | null>(null);

  useEffect(() => {
    if (user) api.get<ConversationSummaryDto[]>("/chat/mine").then(setConversations);
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
      <h1 className="text-xl font-bold">我的消息</h1>
      <p className="text-sm text-neutral-500">跑腿任务/预约/拼车/分类信息下的公开留言，点击进入对应详情页查看和回复</p>

      {conversations === null && <p className="text-neutral-500">加载中...</p>}
      {conversations !== null && conversations.length === 0 && <p className="text-neutral-500">暂无消息</p>}

      {conversations?.map((c) => {
        const href = hrefFor(c);
        const content = (
          <div className="card flex items-center justify-between">
            <div>
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                {CONTEXT_LABELS[c.contextType]}
              </span>
              <p className="mt-1 text-sm text-neutral-700">{c.lastMessagePreview ?? "暂无留言"}</p>
            </div>
            {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
          </div>
        );
        return href ? (
          <Link key={`${c.contextType}-${c.contextId}`} href={href} className="block hover:opacity-80">
            {content}
          </Link>
        ) : (
          <div key={`${c.contextType}-${c.contextId}`}>{content}</div>
        );
      })}
    </div>
  );
}
