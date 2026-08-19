import { BookingStatus, PriceType, ServiceCategory } from "./enums";
import { GeoPoint } from "./task";

export interface ServiceListingDto {
  id: string;
  providerId: string;
  category: ServiceCategory;
  title: string;
  description: string;
  priceType: PriceType;
  price: number; // FIXED: 总价, HOURLY: 每小时价格
  currency: string;
  durationMinutes: number; // 预计时长，用于日历排期
  serviceArea?: string | null; // 服务覆盖区域描述，如"悉尼CBD周边20公里"
  city?: string | null;
  photos: string[];
  active: boolean;
  createdAt: string;
}

export interface CreateServiceListingDto {
  category: ServiceCategory;
  title: string;
  description: string;
  priceType: PriceType;
  price: number;
  currency?: string;
  durationMinutes: number;
  serviceArea?: string;
  city?: string;
  photos?: string[];
}

export interface ServiceAvailabilitySlotDto {
  id: string;
  serviceId: string;
  dayOfWeek: number; // 0=周日 .. 6=周六，用于周期性时段
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface SetAvailabilityDto {
  slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

export interface BookingDto {
  id: string;
  serviceId: string;
  customerId: string;
  providerId: string;
  scheduledStart: string; // ISO
  scheduledEnd: string;
  address?: GeoPoint | null;
  status: BookingStatus;
  googleCalendarEventId?: string | null;
  otpVerifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateBookingDto {
  serviceId: string;
  scheduledStart: string;
  scheduledEnd: string;
  address?: GeoPoint;
  notes?: string;
}

export interface ConfirmBookingOtpDto {
  bookingId: string;
  code: string;
}

export interface ListServicesQuery {
  category?: ServiceCategory;
  city?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// ---------------- 服务分层: 即时/家政 vs 竞价/比价 ----------------
// 即时/家政: 保洁/美甲/理发/按摩/宠物照看等标准化、时效性强的服务，主打"最早可用时间快速下单"
// 竞价/比价: 钢琴教学/学科辅导等更依赖个人资质、适合货比三家的服务
export enum ServiceTier {
  IMMEDIATE = "IMMEDIATE",
  BIDDING = "BIDDING",
}

export const SERVICE_CATEGORY_TIER: Record<ServiceCategory, ServiceTier> = {
  HOUSE_CLEANING: ServiceTier.IMMEDIATE,
  MOVE_OUT_CLEANING: ServiceTier.IMMEDIATE,
  NAIL_SALON: ServiceTier.IMMEDIATE,
  HAIR_STYLING: ServiceTier.IMMEDIATE,
  MASSAGE: ServiceTier.IMMEDIATE,
  PET_CARE: ServiceTier.IMMEDIATE,
  PIANO_LESSON: ServiceTier.BIDDING,
  TUTORING: ServiceTier.BIDDING,
  OTHER: ServiceTier.BIDDING,
};

export interface NextAvailableSlotDto {
  scheduledStart: string;
  scheduledEnd: string;
}
