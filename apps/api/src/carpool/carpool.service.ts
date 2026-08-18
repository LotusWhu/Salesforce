import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CarpoolBookingStatus, CarpoolTripStatus, NotificationType } from "@renrenbang/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../common/services/notifications.service";
import { CreateCarpoolTripDto } from "./dto/create-trip.dto";
import { CreateCarpoolBookingDto } from "./dto/create-carpool-booking.dto";
import { ListCarpoolTripsQueryDto } from "./dto/list-trips-query.dto";

@Injectable()
export class CarpoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createTrip(driverId: string, dto: CreateCarpoolTripDto) {
    return this.prisma.carpoolTrip.create({
      data: {
        driverId,
        type: dto.type,
        originLat: dto.origin.lat,
        originLng: dto.origin.lng,
        originAddress: dto.origin.address ?? "",
        destinationLat: dto.destination.lat,
        destinationLng: dto.destination.lng,
        destinationAddress: dto.destination.address ?? "",
        city: dto.city,
        departureTime: new Date(dto.departureTime),
        flightNumber: dto.flightNumber,
        totalSeats: dto.totalSeats,
        seatsAvailable: dto.totalSeats,
        pricePerSeat: dto.pricePerSeat,
        currency: dto.currency ?? "AUD",
        notes: dto.notes,
      },
    });
  }

  async listTrips(query: ListCarpoolTripsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      status: CarpoolTripStatus.OPEN,
      ...(query.type ? { type: query.type } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.fromDate || query.toDate
        ? {
            departureTime: {
              ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}),
              ...(query.toDate ? { lte: new Date(query.toDate) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.carpoolTrip.findMany({
        where,
        orderBy: { departureTime: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { driver: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } },
      }),
      this.prisma.carpoolTrip.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getById(id: string) {
    const trip = await this.prisma.carpoolTrip.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } },
        bookings: { include: { passenger: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
    if (!trip) throw new NotFoundException("行程不存在");
    return trip;
  }

  async cancelTrip(id: string, driverId: string) {
    const trip = await this.prisma.carpoolTrip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException("行程不存在");
    if (trip.driverId !== driverId) throw new ForbiddenException("无权操作此行程");
    return this.prisma.carpoolTrip.update({ where: { id }, data: { status: CarpoolTripStatus.CANCELLED } });
  }

  async createBooking(tripId: string, passengerId: string, dto: CreateCarpoolBookingDto) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.carpoolTrip.findUnique({ where: { id: tripId } });
      if (!trip) throw new NotFoundException("行程不存在");
      if (trip.driverId === passengerId) throw new BadRequestException("不能预订自己发布的行程");
      if (trip.status !== CarpoolTripStatus.OPEN) throw new BadRequestException("该行程当前不可预订");
      if (trip.seatsAvailable < dto.seats) throw new BadRequestException("剩余座位不足");

      const created = await tx.carpoolBooking.create({
        data: {
          tripId,
          passengerId,
          seats: dto.seats,
          totalPrice: Number(trip.pricePerSeat) * dto.seats,
        },
      });

      const remaining = trip.seatsAvailable - dto.seats;
      await tx.carpoolTrip.update({
        where: { id: tripId },
        data: {
          seatsAvailable: remaining,
          status: remaining === 0 ? CarpoolTripStatus.FULL : CarpoolTripStatus.OPEN,
        },
      });

      return { created, trip };
    });

    await this.notifications.create(
      booking.trip.driverId,
      NotificationType.CARPOOL_BOOKED,
      "有人预订了你的拼车行程",
      `你的行程已被预订 ${dto.seats} 个座位`,
      { tripId },
    );

    return booking.created;
  }

  async cancelBooking(bookingId: string, passengerId: string) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.carpoolBooking.findUnique({ where: { id: bookingId } });
      if (!existing) throw new NotFoundException("预订不存在");
      if (existing.passengerId !== passengerId) throw new ForbiddenException("无权操作此预订");
      if (existing.status !== CarpoolBookingStatus.PENDING && existing.status !== CarpoolBookingStatus.CONFIRMED) {
        throw new BadRequestException("该预订无法取消");
      }

      const updated = await tx.carpoolBooking.update({
        where: { id: bookingId },
        data: { status: CarpoolBookingStatus.CANCELLED },
      });

      const trip = await tx.carpoolTrip.findUnique({ where: { id: existing.tripId } });
      if (trip) {
        await tx.carpoolTrip.update({
          where: { id: trip.id },
          data: {
            seatsAvailable: trip.seatsAvailable + existing.seats,
            status: CarpoolTripStatus.OPEN,
          },
        });
      }

      return updated;
    });

    return booking;
  }

  async listMyBookings(passengerId: string) {
    return this.prisma.carpoolBooking.findMany({
      where: { passengerId },
      orderBy: { createdAt: "desc" },
      include: { trip: { include: { driver: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
  }
}
