import { Language, UserRole } from "./enums";

export interface UserProfile {
  id: string;
  phone: string; // E.164 格式, 如 +61412345678
  email?: string | null;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  language: Language;
  city?: string | null;
  phoneVerified: boolean;
  ratingAvg: number; // 0-5
  ratingCount: number;
  googleCalendarConnected: boolean;
  stripeConnectOnboarded: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  avatarUrl?: string;
  city?: string;
  language?: Language;
  email?: string;
}

export interface ReviewDto {
  id: string;
  relatedType: "TASK" | "BOOKING" | "CARPOOL_BOOKING";
  relatedId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number; // 1-5
  comment?: string | null;
  createdAt: string;
}

export interface CreateReviewDto {
  relatedType: "TASK" | "BOOKING" | "CARPOOL_BOOKING";
  relatedId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}
