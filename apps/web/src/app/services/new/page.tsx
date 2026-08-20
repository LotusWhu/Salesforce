"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateServiceListingDto, PriceType, ServiceCategory, ServiceListingDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { SERVICE_CATEGORY_LABELS } from "@/lib/labels";
import { useAuth } from "@/lib/auth-context";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function NewServicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState<CreateServiceListingDto>({
    category: ServiceCategory.HOUSE_CLEANING,
    title: "",
    description: "",
    priceType: PriceType.FIXED,
    price: 0,
    currency: "AUD",
    durationMinutes: 60,
  });
  const [activeDays, setActiveDays] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>请先登录后再发布服务。</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          去登录
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!form.title || !form.description || !form.price) {
      setError("请填写标题、描述和价格");
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.post<ServiceListingDto>("/services", form);
      const slots = Object.entries(activeDays)
        .filter(([, on]) => on)
        .map(([day]) => ({ dayOfWeek: Number(day), startTime, endTime }));
      if (slots.length > 0) {
        await api.post(`/services/${listing.id}/availability`, { slots });
      }
      router.push(`/services/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "发布失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">发布上门服务</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">服务分类</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
          >
            {Object.entries(SERVICE_CATEGORY_LABELS).map(([key, label]) => (
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
            placeholder="例如：专业居家保洁，5年经验"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="label">详细描述</label>
          <textarea
            className="input min-h-24"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">计价方式</label>
            <select
              className="input"
              value={form.priceType}
              onChange={(e) => setForm({ ...form, priceType: e.target.value as PriceType })}
            >
              <option value={PriceType.FIXED}>一次性收费</option>
              <option value={PriceType.HOURLY}>按小时收费</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label">价格 (AUD)</label>
            <input
              type="number"
              className="input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="label">预计时长 (分钟)</label>
          <input
            type="number"
            className="input"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="label">服务城市/覆盖区域</label>
          <input
            className="input"
            placeholder="例如：悉尼 / CBD周边20公里"
            value={form.city ?? ""}
            onChange={(e) => setForm({ ...form, city: e.target.value, serviceArea: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={form.supportsInstantBooking ?? false}
            onChange={(e) => setForm({ ...form, supportsInstantBooking: e.target.checked })}
          />
          支持「即时」快速下单（客户可一键选中最早可用时段直接预约）
        </label>

        <div>
          <label className="label">可预约时段</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((label, idx) => (
              <button
                key={idx}
                type="button"
                className={`btn-secondary text-xs ${activeDays[idx] ? "border-brand-500 text-brand-600" : ""}`}
                onClick={() => setActiveDays({ ...activeDays, [idx]: !activeDays[idx] })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <span className="self-center">至</span>
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? "发布中..." : "发布服务"}
        </button>
      </div>
    </div>
  );
}
