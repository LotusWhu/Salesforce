"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateTaskDto, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { TASK_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewTaskPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateTaskDto>({
    category: TaskCategory.BUY_TICKET,
    title: "",
    description: "",
    currency: "AUD",
    isRemote: true,
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>请先登录后再发布任务。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description) {
      setError("请填写标题和描述");
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.post<TaskDto>("/tasks", {
        ...form,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        attachmentUrls,
      });
      router.push(`/tasks/${task.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">发布任务</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">任务分类</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
          >
            {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">标题</label>
          <input
            className="input"
            placeholder="例如：帮忙买两张周六晚场电影票"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">详细描述</label>
          <textarea
            className="input min-h-28"
            placeholder="请详细描述任务要求，如电影名称/场次、看房地址、需要拍哪些角度的照片等"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">预算下限 (AUD)</label>
            <input
              type="number"
              className="input"
              value={form.budgetMin ?? ""}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="flex-1">
            <label className="label">预算上限 (AUD)</label>
            <input
              type="number"
              className="input"
              value={form.budgetMax ?? ""}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div>
          <label className="label">截止时间 (可选)</label>
          <input
            type="datetime-local"
            className="input"
            onChange={(e) => setForm({ ...form, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isRemote}
            onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
          />
          此任务无需上门 (如代买票、线上代办)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isUrgent ?? false}
            onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
          />
          加急/即时任务 (希望尽快有人接单)
        </label>

        {!form.isRemote && (
          <div>
            <label className="label">任务地点 (需上门时，在地图上标记位置)</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        )}

        <div>
          <label className="label">参考图片 (可选，如票务链接截图、看房要求参考图)</label>
          <ImageUploader urls={attachmentUrls} onChange={setAttachmentUrls} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? "发布中..." : "发布任务"}
        </button>
      </div>
    </div>
  );
}
