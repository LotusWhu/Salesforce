"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaginatedResult, TASK_CATEGORY_LABELS, TASK_STATUS_LABELS, TaskCategory, TaskDto } from "@localhub/shared-types";
import { api, buildQuery } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import DynamicMapView from "@/components/DynamicMapView";

export default function TasksPage() {
  const { t, locale, city } = useLocale();
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<PaginatedResult<TaskDto> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get<PaginatedResult<TaskDto>>(
          `/tasks${buildQuery({
            category: category || undefined,
            urgentOnly: urgentOnly || undefined,
            keyword: keyword || undefined,
            city: city || undefined,
          })}`,
        )
        .then(setData)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category, urgentOnly, keyword, city]);

  const markers = useMemo(
    () =>
      (data?.items ?? [])
        .filter((task) => task.location)
        .map((task) => ({
          id: task.id,
          lat: task.location!.lat,
          lng: task.location!.lng,
          title: task.title,
          subtitle: `${t("tasks.budget")} ${task.currency} ${task.budgetMin ?? "-"} ~ ${task.budgetMax ?? "-"}`,
          href: `/tasks/${task.id}`,
        })),
    [data, t],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("nav.tasks")}</h1>
        <Link href="/tasks/new" className="btn-primary text-sm">
          + {t("tasks.publish")}
        </Link>
      </div>

      <input
        className="input mb-4"
        placeholder={t("tasks.searchPlaceholder")}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <label className="mb-4 flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={urgentOnly} onChange={(e) => setUrgentOnly(e.target.checked)} />
        {t("tasks.urgentOnly")}
      </label>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-secondary text-sm ${category === "" ? "border-brand-500 text-brand-600" : ""}`}
            onClick={() => setCategory("")}
          >
            {t("common.all")}
          </button>
          {Object.entries(TASK_CATEGORY_LABELS[locale]).map(([key, label]) => (
            <button
              key={key}
              className={`btn-secondary text-sm ${category === key ? "border-brand-500 text-brand-600" : ""}`}
              onClick={() => setCategory(key as TaskCategory)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${view === "list" ? "bg-brand-500 text-white" : "text-neutral-600"}`}
            onClick={() => setView("list")}
          >
            {t("common.listView")}
          </button>
          <button
            className={`rounded px-3 py-1 text-sm font-medium ${view === "map" ? "bg-brand-500 text-white" : "text-neutral-600"}`}
            onClick={() => setView("map")}
          >
            {t("common.mapView")}
          </button>
        </div>
      </div>

      {loading && <p className="text-neutral-500">{t("common.loading")}</p>}
      {!loading && data?.items.length === 0 && <p className="text-neutral-500">{t("tasks.noData")}</p>}

      {view === "map" && !loading && (
        <div className="mb-4">
          {markers.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("tasks.noMapResults")}</p>
          ) : (
            <DynamicMapView markers={markers} zoom={11} />
          )}
        </div>
      )}

      {view === "list" && (
        <div className="grid gap-3">
          {data?.items.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                    {TASK_CATEGORY_LABELS[locale][task.category]}
                  </span>
                  {task.isUrgent && (
                    <span className="ml-1 rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      {t("tasks.urgentBadge")}
                    </span>
                  )}
                  <h3 className="mt-1 font-semibold">{task.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{task.description}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-neutral-500">
                  {TASK_STATUS_LABELS[locale][task.status]}
                </span>
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                {t("tasks.budget")} {task.currency} {task.budgetMin ?? "-"} ~ {task.budgetMax ?? "-"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
