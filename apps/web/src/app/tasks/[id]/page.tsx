"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConversationContextType, TaskOfferDto, TaskStatus } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import PhotoGallery from "@/components/PhotoGallery";
import ImageUploader from "@/components/ImageUploader";
import MessageThread from "@/components/MessageThread";

interface TaskDetail {
  id: string;
  posterId: string;
  category: keyof typeof TASK_CATEGORY_LABELS;
  title: string;
  description: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  status: TaskStatus;
  isUrgent: boolean;
  assignedTaskerId: string | null;
  attachmentUrls: string[];
  proofUrls: string[];
  completionNote: string | null;
  poster: { id: string; name: string; avatarUrl: string | null; ratingAvg: number };
  assignedTasker: { id: string; name: string } | null;
  offers: (TaskOfferDto & { tasker: { id: string; name: string; ratingAvg: number } })[];
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => api.get<TaskDetail>(`/tasks/${id}`).then(setTask);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!task) return <p className="text-neutral-500">加载中...</p>;

  const isPoster = user?.id === task.posterId;
  const isAssignedTasker = user?.id === task.assignedTaskerId;
  const myOffer = task.offers.find((o) => o.taskerId === user?.id);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
          {TASK_CATEGORY_LABELS[task.category]}
        </span>
        {task.isUrgent && (
          <span className="ml-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">加急</span>
        )}
        <h1 className="mt-2 text-xl font-bold">{task.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-neutral-700">{task.description}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-500">
          <span>状态: {TASK_STATUS_LABELS[task.status]}</span>
          <span>
            预算: {task.currency} {task.budgetMin ?? "-"} ~ {task.budgetMax ?? "-"}
          </span>
          <span>发布者: {task.poster.name}</span>
          {task.assignedTasker && <span>跑腿者: {task.assignedTasker.name}</span>}
        </div>
        <PhotoGallery urls={task.attachmentUrls} />
        {task.proofUrls.length > 0 && (
          <div className="mt-3">
            <p className="label">完成凭证</p>
            <PhotoGallery urls={task.proofUrls} />
            {task.completionNote && <p className="mt-1 text-sm text-neutral-600">备注: {task.completionNote}</p>}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 报价表单: 非发布者 & 未报价 & 任务可报价 */}
      {user && !isPoster && !myOffer && (task.status === "OPEN" || task.status === "OFFERED") && (
        <div className="card space-y-3">
          <h2 className="font-semibold">我要报价</h2>
          <input
            type="number"
            className="input"
            placeholder="报价金额"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
          />
          <textarea
            className="input"
            placeholder="附言 (可选)"
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
          />
          <button
            className="btn-primary"
            disabled={busy || !offerPrice}
            onClick={() =>
              run(() => api.post(`/tasks/${id}/offers`, { price: Number(offerPrice), message: offerMessage || undefined }))
            }
          >
            提交报价
          </button>
        </div>
      )}

      {/* 发布者查看报价列表 */}
      {isPoster && task.offers.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold">收到的报价 ({task.offers.length})</h2>
          {task.offers.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0">
              <div>
                <p className="font-medium">
                  {offer.tasker.name} · {task.currency} {offer.price}
                </p>
                {offer.message && <p className="text-sm text-neutral-500">{offer.message}</p>}
                <p className="text-xs text-neutral-400">状态: {offer.status}</p>
              </div>
              {offer.status === "PENDING" && task.status !== "ASSIGNED" && (
                <button
                  className="btn-primary text-sm"
                  disabled={busy}
                  onClick={() => run(() => api.post(`/tasks/${id}/offers/${offer.id}/accept`))}
                >
                  接受
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 跑腿者: 开始 / 提交完成 */}
      {isAssignedTasker && task.status === "ASSIGNED" && (
        <div className="card">
          <button className="btn-primary" disabled={busy} onClick={() => run(() => api.post(`/tasks/${id}/start`))}>
            开始执行任务
          </button>
        </div>
      )}

      {isAssignedTasker && (task.status === "IN_PROGRESS") && (
        <div className="card space-y-3">
          <h2 className="font-semibold">提交完成凭证</h2>
          <ImageUploader urls={proofUrls} onChange={setProofUrls} />
          <button
            className="btn-primary"
            disabled={busy || proofUrls.length === 0}
            onClick={() => run(() => api.post(`/tasks/${id}/submit-completion`, { proofUrls }))}
          >
            提交
          </button>
        </div>
      )}

      {/* 发布者确认完成 */}
      {isPoster && task.status === "SUBMITTED" && (
        <div className="card">
          <button className="btn-primary" disabled={busy} onClick={() => run(() => api.post(`/tasks/${id}/confirm-completion`))}>
            确认完成并结束任务
          </button>
        </div>
      )}

      {isPoster && (task.status === "OPEN" || task.status === "OFFERED") && (
        <button className="btn-secondary" disabled={busy} onClick={() => run(() => api.post(`/tasks/${id}/cancel`))}>
          取消任务
        </button>
      )}

      <MessageThread contextType={ConversationContextType.TASK} contextId={task.id} />
    </div>
  );
}
