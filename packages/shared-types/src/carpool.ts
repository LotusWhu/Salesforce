import { CarpoolBookingStatus, CarpoolTripStatus, CarpoolType } from "./enums";
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
  pricePerSeat: number;
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
