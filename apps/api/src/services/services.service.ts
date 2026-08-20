import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus, NotificationType, OtpPurpose } from "@localhub/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../common/services/notifications.service";
import { GoogleCalendarService } from "../common/services/google-calendar.service";
import { serializeBooking, serializeServiceListing } from "../common/serializers";
import { AuthService } from "../auth/auth.service";
import { CreateServiceListingDto } from "./dto/create-service-listing.dto";
import { SetAvailabilityDto } from "./dto/set-availability.dto";
import { ListServicesQueryDto } from "./dto/list-services-query.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly auth: AuthService,
  ) {}

  // ---------------- 服务发布 (保洁/美甲/钢琴教学等) ----------------

  async createListing(providerId: string, dto: CreateServiceListingDto) {
    const listing = await this.prisma.serviceListing.create({
      data: {
        providerId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        priceType: dto.priceType,
        price: dto.price,
        currency: dto.currency ?? "AUD",
        durationMinutes: dto.durationMinutes,
        serviceArea: dto.serviceArea,
        city: dto.city,
        locationLat: dto.location?.lat,
        locationLng: dto.location?.lng,
        locationAddress: dto.location?.address,
        photos: dto.photos ?? [],
        supportsInstantBooking: dto.supportsInstantBooking ?? false,
      },
    });
    return serializeServiceListing(listing);
  }

  async listListings(query: ListServicesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      active: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.instantOnly ? { supportsInstantBooking: true } : {}),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: "insensitive" as const } },
              { description: { contains: query.keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.serviceListing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { provider: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } },
      }),
      this.prisma.serviceListing.count({ where }),
    ]);
    return { items: items.map(serializeServiceListing), total, page, pageSize };
  }

  async getListingById(id: string) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } },
        availability: true,
      },
    });
    if (!listing) throw new NotFoundException("服务不存在");
    return serializeServiceListing(listing);
  }

  async setAvailability(serviceId: string, providerId: string, dto: SetAvailabilityDto) {
    const listing = await this.prisma.serviceListing.findUnique({ where: { id: serviceId } });
    if (!listing) throw new NotFoundException("服务不存在");
    if (listing.providerId !== providerId) throw new ForbiddenException("无权操作此服务");

    return this.prisma.$transaction(async (tx) => {
      await tx.serviceAvailability.deleteMany({ where: { serviceId } });
      await tx.serviceAvailability.createMany({
        data: dto.slots.map((slot) => ({ serviceId, ...slot })),
      });
      return tx.serviceAvailability.findMany({ where: { serviceId } });
    });
  }

  // ---------------- 预约下单 + Google Calendar 同步 + 短信验证码确认 ----------------

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private async assertWithinAvailability(serviceId: string, start: Date, end: Date) {
    const dayOfWeek = start.getDay();
    const slots = await this.prisma.serviceAvailability.findMany({ where: { serviceId, dayOfWeek } });
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();

    const fits = slots.some(
      (slot) => this.timeToMinutes(slot.startTime) <= startMin && this.timeToMinutes(slot.endTime) >= endMin,
    );
    if (!fits) {
      throw new BadRequestException("所选时间不在服务提供者的可预约时段内");
    }
  }

  /**
   * 计算该服务未来一段时间内(默认7天)最早的一个可预约时段，
   * 结合服务提供者的每周可预约时段 + 已有预约冲突计算得出，
   * 用于"即时/家政"类服务的「立即预约(最早可用)」快捷入口。
   */
  async getNextAvailable(serviceId: string) {
    const LOOKAHEAD_DAYS = 7;
    const SLOT_GRANULARITY_MIN = 15;

    const listing = await this.prisma.serviceListing.findUnique({ where: { id: serviceId } });
    if (!listing || !listing.active) throw new NotFoundException("服务不存在或已下架");

    const availability = await this.prisma.serviceAvailability.findMany({ where: { serviceId } });
    if (availability.length === 0) return null;

    const now = new Date();
    const windowEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * DAY_MS);
    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        providerId: listing.providerId,
        status: { in: [BookingStatus.PENDING_CONFIRMATION, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
        scheduledStart: { lt: windowEnd },
        scheduledEnd: { gt: now },
      },
      orderBy: { scheduledStart: "asc" },
    });

    const roundUp = (d: Date) => {
      const ms = SLOT_GRANULARITY_MIN * 60 * 1000;
      return new Date(Math.ceil(d.getTime() / ms) * ms);
    };

    for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() + dayOffset);
      const dayOfWeek = day.getDay();
      const daySlots = availability
        .filter((s) => s.dayOfWeek === dayOfWeek)
        .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime));

      for (const slot of daySlots) {
        const slotStart = new Date(day);
        slotStart.setHours(0, this.timeToMinutes(slot.startTime), 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(0, this.timeToMinutes(slot.endTime), 0, 0);

        let candidateStart = roundUp(slotStart < now ? now : slotStart);
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const candidateEnd = new Date(candidateStart.getTime() + listing.durationMinutes * 60 * 1000);
          if (candidateEnd > slotEnd) break;

          const conflict = upcomingBookings.find((b) => b.scheduledStart < candidateEnd && b.scheduledEnd > candidateStart);
          if (!conflict) {
            return { scheduledStart: candidateStart.toISOString(), scheduledEnd: candidateEnd.toISOString() };
          }
          candidateStart = roundUp(conflict.scheduledEnd);
        }
      }
    }

    return null;
  }

  async createBooking(customerId: string, dto: CreateBookingDto) {
    const listing = await this.prisma.serviceListing.findUnique({ where: { id: dto.serviceId } });
    if (!listing || !listing.active) throw new NotFoundException("服务不存在或已下架");
    if (listing.providerId === customerId) throw new BadRequestException("不能预约自己发布的服务");

    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (start >= end) throw new BadRequestException("结束时间必须晚于开始时间");
    if (start.getTime() < Date.now()) throw new BadRequestException("不能预约过去的时间");
    if (end.getTime() - start.getTime() > DAY_MS) throw new BadRequestException("单次预约时长不能超过24小时");

    await this.assertWithinAvailability(dto.serviceId, start, end);

    const overlapping = await this.prisma.booking.findFirst({
      where: {
        providerId: listing.providerId,
        status: { in: [BookingStatus.PENDING_CONFIRMATION, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
    });
    if (overlapping) throw new BadRequestException("该时间段已被预约，请选择其他时间");

    const customer = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("用户不存在");

    const booking = await this.prisma.booking.create({
      data: {
        serviceId: dto.serviceId,
        customerId,
        providerId: listing.providerId,
        scheduledStart: start,
        scheduledEnd: end,
        addressLat: dto.address?.lat,
        addressLng: dto.address?.lng,
        addressText: dto.address?.address,
        notes: dto.notes,
      },
    });

    // 下单后立即发送短信验证码，客户需确认验证码后预约才会生效并同步Google日历
    await this.auth.requestOtp(customer.phone, OtpPurpose.BOOKING_CONFIRM);

    return serializeBooking(booking);
  }

  async confirmBookingOtp(bookingId: string, customerId: string, code: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, customer: true, provider: true },
    });
    if (!booking) throw new NotFoundException("预约不存在");
    if (booking.customerId !== customerId) throw new ForbiddenException("无权操作此预约");
    if (booking.status !== BookingStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException("该预约无需确认或已处理");
    }

    await this.auth.verifyOtpCode(booking.customer.phone, code, OtpPurpose.BOOKING_CONFIRM);

    let googleCalendarEventId: string | null = null;
    if (booking.provider.googleCalendarConnected && booking.provider.googleRefreshToken) {
      googleCalendarEventId = await this.googleCalendar.createEvent(booking.provider.googleRefreshToken, {
        summary: `[预约] ${booking.service.title} - ${booking.customer.name}`,
        description: booking.notes ?? undefined,
        startIso: booking.scheduledStart.toISOString(),
        endIso: booking.scheduledEnd.toISOString(),
        location: booking.addressText ?? undefined,
        attendeeEmails: booking.customer.email ? [booking.customer.email] : undefined,
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        otpVerifiedAt: new Date(),
        googleCalendarEventId,
      },
    });

    await this.notifications.create(
      booking.providerId,
      NotificationType.BOOKING_CONFIRMED,
      "新预约已确认",
      `客户 ${booking.customer.name} 已确认预约「${booking.service.title}」`,
      { bookingId },
    );

    return serializeBooking(updated);
  }

  async listMyBookings(userId: string, as: "customer" | "provider") {
    const bookings = await this.prisma.booking.findMany({
      where: as === "customer" ? { customerId: userId } : { providerId: userId },
      orderBy: { scheduledStart: "desc" },
      include: {
        service: true,
        customer: { select: { id: true, name: true, avatarUrl: true } },
        provider: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return bookings.map(serializeBooking);
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("预约不存在");
    if (booking.customerId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException("无权操作此预约");
    }
    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException("已完成的预约无法取消");
    }

    if (booking.googleCalendarEventId) {
      const provider = await this.prisma.user.findUnique({ where: { id: booking.providerId } });
      if (provider?.googleRefreshToken) {
        await this.googleCalendar.deleteEvent(provider.googleRefreshToken, booking.googleCalendarEventId);
      }
    }

    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CANCELLED } });
    return serializeBooking(updated);
  }

  async completeBooking(bookingId: string, providerId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("预约不存在");
    if (booking.providerId !== providerId) throw new ForbiddenException("无权操作此预约");
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException("该预约状态不允许标记完成");
    }
    const updated = await this.prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.COMPLETED } });
    return serializeBooking(updated);
  }
}
