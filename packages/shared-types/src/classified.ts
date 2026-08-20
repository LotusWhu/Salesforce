import { ClassifiedCategory, ClassifiedStatus } from "./enums";
import { GeoPoint } from "./task";

export interface ClassifiedListingDto {
  id: string;
  posterId: string;
  category: ClassifiedCategory;
  title: string;
  description: string;
  price?: number | null; // FREE分类可为空
  currency: string;
  photos: string[];
  location?: GeoPoint | null;
  city?: string | null;
  status: ClassifiedStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassifiedListingDto {
  category: ClassifiedCategory;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  photos?: string[];
  location?: GeoPoint;
  city?: string;
}

export interface UpdateClassifiedListingDto {
  title?: string;
  description?: string;
  price?: number;
  status?: ClassifiedStatus;
}

export interface ListClassifiedsQuery {
  category?: ClassifiedCategory;
  city?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}
