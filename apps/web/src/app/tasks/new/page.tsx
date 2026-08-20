"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateTaskDto, TASK_CATEGORY_LABELS, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewTaskPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city } = useLocale();
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
        <p>{t("tasks.loginToPublish")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description) {
      setError(t("tasks.fillTitleDesc"));
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.post<TaskDto>("/tasks", {
        ...form,
        city: city ?? undefined,
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        attachmentUrls,
      });
      router.push(`/tasks/${task.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tasks.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">{t("tasks.publish")}</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">{t("tasks.categoryLabel")}</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}
          >
            {Object.entries(TASK_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("tasks.titleLabel")}</label>
          <input
            className="input"
            placeholder={t("tasks.titlePlaceholder")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t("tasks.descLabel")}</label>
          <textarea
            className="input min-h-28"
            placeholder={t("tasks.descPlaceholder")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">{t("tasks.budgetMin")}</label>
            <input
              type="number"
              className="input"
              value={form.budgetMin ?? ""}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="flex-1">
            <label className="label">{t("tasks.budgetMax")}</label>
            <input
              type="number"
              className="input"
              value={form.budgetMax ?? ""}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>

        <div>
          <label className="label">{t("tasks.dueDate")}</label>
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
          {t("tasks.isRemote")}
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isUrgent ?? false}
            onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
          />
          {t("tasks.isUrgentField")}
        </label>

        {!form.isRemote && (
          <div>
            <label className="label">{t("tasks.locationLabel")}</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>
        )}

        <div>
          <label className="label">{t("tasks.attachmentsLabel")}</label>
          <ImageUploader urls={attachmentUrls} onChange={setAttachmentUrls} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? t("tasks.publishing") : t("tasks.publish")}
        </button>
      </div>
    </div>
  );
}
