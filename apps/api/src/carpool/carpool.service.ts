import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CarpoolBookingStatus,
  CarpoolRequestStatus,
  CarpoolTripStatus,
  NotificationType,
  PaymentRelatedType,
} from "@localhub/shared-types";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../common/services/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import { serializeCarpoolTrip } from "../common/serializers";
import { CreateCarpoolTripDto } from "./dto/create-trip.dto";
import { CreateCarpoolBookingDto } from "./dto/create-carpool-booking.dto";
import { ListCarpoolTripsQueryDto } from "./dto/list-trips-query.dto";
import { CreateCarpoolRequestDto } from "./dto/create-carpool-request.dto";

// 拼车动态定价: 单价随同车拼成人数增多而下调，最多下调到 6 折。
// 这样"愿意等一等、拼进更多人的车"自然比"独享一辆车立刻走"更便宜。
const PRICE_STEP_DOWN = 0.08;
const PRICE_FLOOR_RATIO = 0.6;

// 乘客发起需求后，系统在这个时间窗口内(取需求自身的 flexibilityMinutes 与此值的较小者)
// 搜索时间最接近的已有行程；司机发布新行程后，也用同样的窗口去吸纳待匹配的需求。
const DEFAULT_MATCH_WINDOW_MINUTES = 24 * 60;

function computePricePerSeat(basePricePerSeat: Prisma.Decimal | number, occupiedSeats: number): number {
  const base = Number(basePricePerSeat);
  const ratio = Math.max(PRICE_FLOOR_RATIO, 1 - PRICE_STEP_DOWN * Math.max(0, occupiedSeats - 1));
  return Math.round(base * ratio * 100) / 100;
}

@Injectable()
export class CarpoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {}

  async createTrip(driverId: string, dto: CreateCarpoolTripDto) {
    const trip = await this.prisma.carpoolTrip.create({
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
        basePricePerSeat: dto.pricePerSeat,
        pricePerSeat: dto.pricePerSeat,
        currency: dto.currency ?? "AUD",
        notes: dto.notes,
      },
    });

    // 司机发布行程后，立刻尝试吸纳附近时间段内待匹配的乘客需求
    const matchedCount = await this.matchPendingRequestsToTrip(trip.id);
    const finalTrip = matchedCount > 0 ? await this.prisma.carpoolTrip.findUniqueOrThrow({ where: { id: trip.id } }) : trip;

    return serializeCarpoolTrip(finalTrip);
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
    return { items: items.map(serializeCarpoolTrip), total, page, pageSize };
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
    return serializeCarpoolTrip(trip);
  }

  async cancelTrip(id: string, driverId: string) {
    const trip = await this.prisma.carpoolTrip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException("行程不存在");
    if (trip.driverId !== driverId) throw new ForbiddenException("无权操作此行程");
    const updated = await this.prisma.carpoolTrip.update({ where: { id }, data: { status: CarpoolTripStatus.CANCELLED } });
    return serializeCarpoolTrip(updated);
  }

  async createBooking(tripId: string, passengerId: string, dto: CreateCarpoolBookingDto) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.carpoolTrip.findUnique({ where: { id: tripId } });
      if (!trip) throw new NotFoundException("行程不存在");
      if (trip.driverId === passengerId) throw new BadRequestException("不能预订自己发布的行程");
      if (trip.status !== CarpoolTripStatus.OPEN) throw new BadRequestException("该行程当前不可预订");
      if (trip.seatsAvailable < dto.seats) throw new BadRequestException("剩余座位不足");

      const occupiedAfter = trip.totalSeats - trip.seatsAvailable + dto.seats;
      const effectivePrice = computePricePerSeat(trip.basePricePerSeat, occupiedAfter);

      const created = await tx.carpoolBooking.create({
        data: {
          tripId,
          passengerId,
          seats: dto.seats,
          totalPrice: effectivePrice * dto.seats,
        },
      });

      const remaining = trip.seatsAvailable - dto.seats;
      await tx.carpoolTrip.update({
        where: { id: tripId },
        data: {
          seatsAvailable: remaining,
          pricePerSeat: effectivePrice,
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

    // 下单即把车费放入担保账户 (HELD)，行程结束车主标记完成后再释放
    await this.payments.holdForContext({
      relatedType: PaymentRelatedType.CARPOOL_BOOKING,
      relatedId: booking.created.id,
      payerId: passengerId,
      payeeId: booking.trip.driverId,
      amount: Number(booking.created.totalPrice),
      currency: booking.trip.currency,
    });

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
        const remaining = trip.seatsAvailable + existing.seats;
        const occupied = trip.totalSeats - remaining;
        await tx.carpoolTrip.update({
          where: { id: trip.id },
          data: {
            seatsAvailable: remaining,
            pricePerSeat: computePricePerSeat(trip.basePricePerSeat, Math.max(occupied, 1)),
            status: CarpoolTripStatus.OPEN,
          },
        });
      }

      return updated;
    });

    await this.payments.refundForContext(PaymentRelatedType.CARPOOL_BOOKING, bookingId);

    return booking;
  }

  /** 车主在行程结束后把某个乘客的预订标记完成，从担保账户按平台服务费比例扣费并把净额转给车主 */
  async completeBooking(bookingId: string, driverId: string) {
    const booking = await this.prisma.carpoolBooking.findUnique({ where: { id: bookingId }, include: { trip: true } });
    if (!booking) throw new NotFoundException("预订不存在");
    if (booking.trip.driverId !== driverId) throw new ForbiddenException("无权操作此预订");
    if (booking.status !== CarpoolBookingStatus.PENDING && booking.status !== CarpoolBookingStatus.CONFIRMED) {
      throw new BadRequestException("该预订状态不允许标记完成");
    }
    const updated = await this.prisma.carpoolBooking.update({
      where: { id: bookingId },
      data: { status: CarpoolBookingStatus.COMPLETED },
    });
    await this.payments.releaseForContext(PaymentRelatedType.CARPOOL_BOOKING, bookingId);
    return updated;
  }

  async listMyBookings(passengerId: string) {
    const bookings = await this.prisma.carpoolBooking.findMany({
      where: { passengerId },
      orderBy: { createdAt: "desc" },
      include: { trip: { include: { driver: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
    return bookings.map((b) => ({ ...b, trip: serializeCarpoolTrip(b.trip) }));
  }

  // ---------------- 拼车需求 (NearMe 风格: 乘客发单, 系统自动匹配) ----------------

  /**
   * 乘客发起需求:
   * 1) 先在附近时间窗口内找一辆已开放、方向/机场相同、座位够的行程 —— 找到就直接拼进去(时间最接近的优先)
   * 2) 找不到就进入待匹配池，等司机发布新行程时被自动吸纳，或后续有新行程开放时再次尝试匹配
   */
  async createRequest(passengerId: string, dto: CreateCarpoolRequestDto) {
    const passengerCount = dto.passengerCount ?? 1;
    const scheduledTime = new Date(dto.scheduledTime);
    const flexibilityMinutes = dto.flexibilityMinutes ?? 60;
    const windowMinutes = Math.min(flexibilityMinutes, DEFAULT_MATCH_WINDOW_MINUTES);

    const windowStart = new Date(scheduledTime.getTime() - windowMinutes * 60 * 1000);
    const windowEnd = new Date(scheduledTime.getTime() + windowMinutes * 60 * 1000);

    const candidateTrips = await this.prisma.carpoolTrip.findMany({
      where: {
        status: CarpoolTripStatus.OPEN,
        type: dto.type,
        seatsAvailable: { gte: passengerCount },
        departureTime: { gte: windowStart, lte: windowEnd },
        ...(dto.city ? { city: dto.city } : {}),
      },
      orderBy: { departureTime: "asc" },
    });

    const bestTrip = this.pickClosestByTime(candidateTrips, scheduledTime);

    if (bestTrip) {
      const result = await this.prisma.$transaction(async (tx) => {
        const trip = await tx.carpoolTrip.findUnique({ where: { id: bestTrip.id } });
        if (!trip || trip.status !== CarpoolTripStatus.OPEN || trip.seatsAvailable < passengerCount) {
          return null; // 并发抢座导致失效，退回待匹配池
        }

        const occupiedAfter = trip.totalSeats - trip.seatsAvailable + passengerCount;
        const effectivePrice = computePricePerSeat(trip.basePricePerSeat, occupiedAfter);

        const booking = await tx.carpoolBooking.create({
          data: {
            tripId: trip.id,
            passengerId,
            seats: passengerCount,
            totalPrice: effectivePrice * passengerCount,
          },
        });

        const remaining = trip.seatsAvailable - passengerCount;
        await tx.carpoolTrip.update({
          where: { id: trip.id },
          data: {
            seatsAvailable: remaining,
            pricePerSeat: effectivePrice,
            status: remaining === 0 ? CarpoolTripStatus.FULL : CarpoolTripStatus.OPEN,
          },
        });

        const request = await tx.carpoolRequest.create({
          data: {
            passengerId,
            type: dto.type,
            airport: dto.airport,
            terminal: dto.terminal,
            otherLocationLat: dto.otherLocation.lat,
            otherLocationLng: dto.otherLocation.lng,
            otherLocationAddress: dto.otherLocation.address ?? "",
            city: dto.city,
            scheduledTime,
            flightNumber: dto.flightNumber,
            passengerCount,
            luggageCount: dto.luggageCount ?? 1,
            fareMode: dto.fareMode,
            returnScheduledTime: dto.returnScheduledTime ? new Date(dto.returnScheduledTime) : undefined,
            flexibilityMinutes,
            status: CarpoolRequestStatus.MATCHED,
            matchedTripId: trip.id,
            matchedBookingId: booking.id,
          },
        });

        return { request, driverId: trip.driverId };
      });

      if (result) {
        await this.notifications.create(
          result.driverId,
          NotificationType.CARPOOL_BOOKED,
          "有新乘客拼上了你的行程",
          `系统自动为你的行程匹配了 ${passengerCount} 位乘客`,
          { tripId: bestTrip.id },
        );
        return this.serializeRequest(result.request);
      }
    }

    // 没有匹配到行程，进入待匹配池
    const request = await this.prisma.carpoolRequest.create({
      data: {
        passengerId,
        type: dto.type,
        airport: dto.airport,
        terminal: dto.terminal,
        otherLocationLat: dto.otherLocation.lat,
        otherLocationLng: dto.otherLocation.lng,
        otherLocationAddress: dto.otherLocation.address ?? "",
        city: dto.city,
        scheduledTime,
        flightNumber: dto.flightNumber,
        passengerCount,
        luggageCount: dto.luggageCount ?? 1,
        fareMode: dto.fareMode,
        returnScheduledTime: dto.returnScheduledTime ? new Date(dto.returnScheduledTime) : undefined,
        flexibilityMinutes,
        status: CarpoolRequestStatus.PENDING,
      },
    });
    return this.serializeRequest(request);
  }

  /**
   * 司机发布新行程后调用: 把落在行程时间窗口内、方向/机场相同的待匹配需求尽量吸纳进来，
   * 按需求期望时间与行程发车时间的接近程度优先匹配，直到座位坐满。
   */
  private async matchPendingRequestsToTrip(tripId: string): Promise<number> {
    let matched = 0;
    // 逐个尝试，保证每次都以最新座位余量判断，避免一次性超卖
    // 需求量通常不大，循环几十次对本地/小规模部署没有性能问题
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const trip = await this.prisma.carpoolTrip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== CarpoolTripStatus.OPEN || trip.seatsAvailable <= 0) break;

      const pending = await this.prisma.carpoolRequest.findMany({
        where: {
          status: CarpoolRequestStatus.PENDING,
          type: trip.type,
          passengerCount: { lte: trip.seatsAvailable },
          scheduledTime: {
            gte: new Date(trip.departureTime.getTime() - DEFAULT_MATCH_WINDOW_MINUTES * 60 * 1000),
            lte: new Date(trip.departureTime.getTime() + DEFAULT_MATCH_WINDOW_MINUTES * 60 * 1000),
          },
          ...(trip.city ? { city: trip.city } : {}),
        },
      });

      const withinFlexibility = pending.filter(
        (r) => Math.abs(r.scheduledTime.getTime() - trip.departureTime.getTime()) <= r.flexibilityMinutes * 60 * 1000,
      );
      const next = this.pickClosestByTime(withinFlexibility, trip.departureTime);
      if (!next) break;

      await this.prisma.$transaction(async (tx) => {
        const freshTrip = await tx.carpoolTrip.findUnique({ where: { id: tripId } });
        const freshRequest = await tx.carpoolRequest.findUnique({ where: { id: next.id } });
        if (!freshTrip || !freshRequest || freshRequest.status !== CarpoolRequestStatus.PENDING) return;
        if (freshTrip.seatsAvailable < freshRequest.passengerCount) return;

        const occupiedAfter = freshTrip.totalSeats - freshTrip.seatsAvailable + freshRequest.passengerCount;
        const effectivePrice = computePricePerSeat(freshTrip.basePricePerSeat, occupiedAfter);

        const booking = await tx.carpoolBooking.create({
          data: {
            tripId,
            passengerId: freshRequest.passengerId,
            seats: freshRequest.passengerCount,
            totalPrice: effectivePrice * freshRequest.passengerCount,
          },
        });

        const remaining = freshTrip.seatsAvailable - freshRequest.passengerCount;
        await tx.carpoolTrip.update({
          where: { id: tripId },
          data: {
            seatsAvailable: remaining,
            pricePerSeat: effectivePrice,
            status: remaining === 0 ? CarpoolTripStatus.FULL : CarpoolTripStatus.OPEN,
          },
        });

        await tx.carpoolRequest.update({
          where: { id: freshRequest.id },
          data: { status: CarpoolRequestStatus.MATCHED, matchedTripId: tripId, matchedBookingId: booking.id },
        });
      });

      matched += 1;
      await this.notifications.create(
        next.passengerId,
        NotificationType.CARPOOL_BOOKED,
        "已为你自动匹配到拼车行程",
        "系统为你的拼车需求匹配到一辆时间相近的行程，请查看详情",
        { tripId },
      );
    }
    return matched;
  }

  private pickClosestByTime<T extends { departureTime?: Date; scheduledTime?: Date }>(
    items: T[],
    target: Date,
  ): T | null {
    if (items.length === 0) return null;
    return items.reduce((best, cur) => {
      const bestTime = (best.departureTime ?? best.scheduledTime)!.getTime();
      const curTime = (cur.departureTime ?? cur.scheduledTime)!.getTime();
      return Math.abs(curTime - target.getTime()) < Math.abs(bestTime - target.getTime()) ? cur : best;
    });
  }

  async cancelRequest(id: string, passengerId: string) {
    const request = await this.prisma.carpoolRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException("需求不存在");
    if (request.passengerId !== passengerId) throw new ForbiddenException("无权操作此需求");
    if (request.status === CarpoolRequestStatus.MATCHED && request.matchedBookingId) {
      await this.cancelBooking(request.matchedBookingId, passengerId);
    }
    const updated = await this.prisma.carpoolRequest.update({
      where: { id },
      data: { status: CarpoolRequestStatus.CANCELLED },
    });
    return this.serializeRequest(updated);
  }

  async listMyRequests(passengerId: string) {
    const requests = await this.prisma.carpoolRequest.findMany({
      where: { passengerId },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => this.serializeRequest(r));
  }

  private serializeRequest<
    T extends {
      otherLocationLat: number;
      otherLocationLng: number;
      otherLocationAddress: string;
    },
  >(request: T) {
    const { otherLocationLat, otherLocationLng, otherLocationAddress, ...rest } = request;
    return {
      ...rest,
      otherLocation: { lat: otherLocationLat, lng: otherLocationLng, address: otherLocationAddress },
    };
  }
}
