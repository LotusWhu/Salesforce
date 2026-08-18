"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClassifiedCategory, ClassifiedListingDto } from "@renrenbang/shared-types";
import { api, ApiError } from "@/lib/api";
import { CLASSIFIED_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";

export default function NewClassifiedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<ClassifiedCategory>(ClassifiedCategory.SECOND_HAND);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>请先登录后再发布信息。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError("请填写标题和描述");
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ClassifiedListingDto>("/classifieds", {
        category,
        title,
        description,
        price: price ? Number(price) : undefined,
        city: city || undefined,
      });
      router.push(`/classifieds/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">发布分类信息</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">分类</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ClassifiedCategory)}>
            {Object.entries(CLASSIFIED_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">标题</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">详细描述</label>
          <textarea className="input min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="label">价格 (AUD，免费/面议可留空)</label>
          <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div>
          <label className="label">城市</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? "发布中..." : "发布"}
        </button>
      </div>
    </div>
  );
}
