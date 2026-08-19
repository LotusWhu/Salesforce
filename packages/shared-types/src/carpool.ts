import { CarpoolBookingStatus, CarpoolFareMode, CarpoolRequestStatus, CarpoolTripStatus, CarpoolType } from "./enums";
import { GeoPoint } from "./task";

export interface CarpoolTripDto {
  id: string;
  driverId: string;
  type: CarpoolType;
  origin: GeoPoint;
  destination: GeoPoint;
  departureTime: string; // ISO
  flightNumber?: string | null; // 接送机时可填航班号，方便接机举牌/追踪航班动态
  totalSeats: number;
  seatsAvailable: number;
  basePricePerSeat: number;
  pricePerSeat: number; // 当前有效单价，随拼车人数增多而动态下调
  currency: string;
  city?: string | null;
  notes?: string | null;
  status: CarpoolTripStatus;
  createdAt: string;
}

export interface CreateCarpoolTripDto {
  type: CarpoolType;
  origin: GeoPoint;
  destination: GeoPoint;
  departureTime: string;
  flightNumber?: string;
  totalSeats: number;
  pricePerSeat: number;
  currency?: string;
  city?: string;
  notes?: string;
}

export interface CarpoolBookingDto {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  totalPrice: number;
  status: CarpoolBookingStatus;
  createdAt: string;
}

export interface CreateCarpoolBookingDto {
  seats: number;
}

export interface ListCarpoolTripsQuery {
  type?: CarpoolType;
  city?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

// ---------------- 拼车需求 (NearMe 风格: 乘客发起需求, 系统自动匹配) ----------------

export interface CreateCarpoolRequestDto {
  type: CarpoolType; // AIRPORT_DROPOFF=送机(To Airport) / AIRPORT_PICKUP=接机(From Airport)
  airport: string;
  terminal?: string;
  otherLocation: GeoPoint; // 送机时=接送地点; 接机时=目的地地点
  city?: string;
  scheduledTime: string; // ISO, 送机=期望登车时间; 接机=航班到达时间
  flightNumber?: string;
  passengerCount?: number;
  luggageCount?: number;
  fareMode?: CarpoolFareMode;
  returnScheduledTime?: string; // 往返时的返程时间
  flexibilityMinutes?: number; // 可接受的匹配时间窗口，越大越容易拼车、单价越低
}

export interface CarpoolRequestDto {
  id: string;
  passengerId: string;
  type: CarpoolType;
  airport: string;
  terminal?: string | null;
  otherLocation: GeoPoint;
  city?: string | null;
  scheduledTime: string;
  flightNumber?: string | null;
  passengerCount: number;
  luggageCount: number;
  fareMode: CarpoolFareMode;
  returnScheduledTime?: string | null;
  flexibilityMinutes: number;
  status: CarpoolRequestStatus;
  matchedTripId?: string | null;
  matchedBookingId?: string | null;
  createdAt: string;
}
