"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginatedResult, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { TASK_CATEGORY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";

export default function TasksPage() {
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [data, setData] = useState<PaginatedResult<TaskDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResult<TaskDto>>(
        `/tasks${buildQuery({ category: category || undefined, urgentOnly: urgentOnly || undefined })}`,
      )
      .then(setData)
      .finally(() => setLoading(false));
  }, [category, urgentOnly]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">跑腿代办</h1>
        <Link href="/tasks/new" className="btn-primary text-sm">
          + 发布任务
        </Link>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
        只看加急/即时任务
      </label>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
          onClick={() => setCategory("")}
        >
          全部
        </button>
        {Object.entries(TASK_CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`btn-secondary text-sm ${category === key ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory(key as TaskCategory)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-neutral-500">加载中...</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">暂无任务，快来发布第一个吧</p>}

      <div className="grid gap-3">
        {data?.items.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                  {TASK_CATEGORY_LABELS[task.category]}
                </span>
                {task.isUrgent && (
                  <span className="ml-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">加急</span>
                )}
                <h3 className="mt-1 font-semibold">{task.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{task.description}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-neutral-500">{TASK_STATUS_LABELS[task.status]}</span>
            </div>
            <div className="mt-2 text-sm text-neutral-500">
              预算 {task.currency} {task.budgetMin ?? "-"} ~ {task.budgetMax ?? "-"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
