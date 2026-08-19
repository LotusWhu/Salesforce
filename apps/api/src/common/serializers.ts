import { GeoPoint } from "@localhub/shared-types";

/**
 * Prisma 里地理位置一律存成扁平的 xxxLat/xxxLng/xxxAddress 字段，
 * 但 @localhub/shared-types 的 DTO 契约（web/mobile 两端都是照着这个写的）
 * 用的是嵌套的 { lat, lng, address } 结构。这里统一做转换，避免每个 controller
 * 各自拼接、字段名对不上导致前端拿到 undefined。
 */
export function toGeoPoint(
  lat: number | null | undefined,
  lng: number | null | undefined,
  address?: string | null,
): GeoPoint | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  return { lat, lng, address: address ?? undefined };
}

export function serializeTask<T extends { locationLat: number | null; locationLng: number | null; locationAddress: string | null }>(
  task: T,
) {
  const { locationLat, locationLng, locationAddress, ...rest } = task;
  return { ...rest, location: toGeoPoint(locationLat, locationLng, locationAddress) };
}

export function serializeBooking<T extends { addressLat: number | null; addressLng: number | null; addressText: string | null }>(
  booking: T,
) {
  const { addressLat, addressLng, addressText, ...rest } = booking;
  return { ...rest, address: toGeoPoint(addressLat, addressLng, addressText) };
}

export function serializeClassified<T extends { locationLat: number | null; locationLng: number | null }>(listing: T) {
  const { locationLat, locationLng, ...rest } = listing;
  return { ...rest, location: toGeoPoint(locationLat, locationLng) };
}

export function serializeCarpoolTrip<
  T extends {
    originLat: number;
    originLng: number;
    originAddress: string;
    destinationLat: number;
    destinationLng: number;
    destinationAddress: string;
  },
>(trip: T) {
  const { originLat, originLng, originAddress, destinationLat, destinationLng, destinationAddress, ...rest } = trip;
  return {
    ...rest,
    origin: toGeoPoint(originLat, originLng, originAddress) as GeoPoint,
    destination: toGeoPoint(destinationLat, destinationLng, destinationAddress) as GeoPoint,
  };
}
