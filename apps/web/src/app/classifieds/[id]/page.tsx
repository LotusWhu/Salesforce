"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedListingDto, ConversationContextType } from "@localhub/shared-types";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale-context";
import PhotoGallery from "@/components/PhotoGallery";
import MessageThread from "@/components/MessageThread";

export default function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const [item, setItem] = useState<(ClassifiedListingDto & { poster: { name: string; ratingAvg: number } }) | null>(
    null,
  );

  useEffect(() => {
    api.get<typeof item>(`/classifieds/${id}`).then(setItem);
  }, [id]);

  if (!item) return <p className="text-neutral-500">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
          {CLASSIFIED_CATEGORY_LABELS[locale][item.category]}
        </span>
        <h1 className="mt-2 text-xl font-bold">{item.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-neutral-700">{item.description}</p>
        <p className="mt-3 text-lg font-semibold text-brand-600">
          {item.price !== null && item.price !== undefined ? `${item.currency} ${item.price}` : t("classifieds.priceNegotiable")}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          {t("classifieds.poster")}: {item.poster.name} · {t("classifieds.views")}: {item.viewCount}
        </p>
        <PhotoGallery urls={item.photos} />
      </div>

      <div className="mt-4">
        <MessageThread contextType={ConversationContextType.CLASSIFIED_LISTING} contextId={item.id} />
      </div>
    </div>
  );
}
