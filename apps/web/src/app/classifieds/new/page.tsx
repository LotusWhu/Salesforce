"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLASSIFIED_CATEGORY_LABELS, ClassifiedCategory, ClassifiedListingDto } from "@localhub/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import LocationPicker, { PickedLocation } from "@/components/LocationPicker";
import ImageUploader from "@/components/ImageUploader";

export default function NewClassifiedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale, city: globalCity } = useLocale();
  const [category, setCategory] = useState<ClassifiedCategory>(ClassifiedCategory.SECOND_HAND);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState(globalCity ?? "");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <div className="card max-w-md">
        <p>{t("classifieds.loginToPublish")}</p>
        <a href="/login" className="btn-primary mt-3 inline-block text-sm">
          {t("common.goLogin")}
        </a>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError(t("classifieds.fillTitleDesc"));
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
        location: location ? { lat: location.lat, lng: location.lng, address: location.address } : undefined,
        photos,
      });
      router.push(`/classifieds/${listing.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("classifieds.publishFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-bold">{t("classifieds.publishTitle")}</h1>
      <div className="card space-y-4">
        <div>
          <label className="label">{t("classifieds.categoryLabel")}</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ClassifiedCategory)}>
            {Object.entries(CLASSIFIED_CATEGORY_LABELS[locale]).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("classifieds.titleLabel")}</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">{t("classifieds.descLabel")}</label>
          <textarea className="input min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="label">{t("classifieds.priceLabel")}</label>
          <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>

        <div>
          <label className="label">{t("classifieds.cityLabel")}</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <label className="label">{t("classifieds.locationLabel")}</label>
          <LocationPicker value={location} onChange={setLocation} />
        </div>

        <div>
          <label className="label">{t("classifieds.photosLabel")}</label>
          <ImageUploader urls={photos} onChange={setPhotos} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? t("classifieds.publishing") : t("classifieds.publish")}
        </button>
      </div>
    </div>
  );
}
