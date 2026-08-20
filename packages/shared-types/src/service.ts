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
  supportsInstantBooking: boolean; // 发布者自己勾选: 是否支持"最早可用时间"快速下单
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
  supportsInstantBooking?: boolean;
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
  instantOnly?: boolean; // 只看支持"即时/最早可用时间快速下单"的服务
  page?: number;
  pageSize?: number;
}

export interface NextAvailableSlotDto {
  scheduledStart: string;
  scheduledEnd: string;
}
