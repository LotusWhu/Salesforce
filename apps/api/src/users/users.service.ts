import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleCalendarService } from "../common/services/google-calendar.service";
import { StripeService } from "../common/services/stripe.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateReviewDto } from "./dto/create-review.dto";

// googleRefreshToken 是 Google OAuth 刷新令牌，绝不能出现在任何 API 响应里
const SAFE_USER_SELECT = {
  id: true,
  phone: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  language: true,
  city: true,
  phoneVerified: true,
  ratingAvg: true,
  ratingCount: true,
  googleCalendarConnected: true,
  stripeConnectOnboarded: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
    private readonly stripe: StripeService,
  ) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
    if (!user) throw new NotFoundException("用户不存在");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: SAFE_USER_SELECT });
  }

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException("不能评价自己");
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          reviewerId,
          revieweeId: dto.revieweeId,
          rating: dto.rating,
          comment: dto.comment,
          taskId: dto.relatedType === "TASK" ? dto.relatedId : undefined,
          bookingId: dto.relatedType === "BOOKING" ? dto.relatedId : undefined,
        },
      });

      const agg = await tx.review.aggregate({
        where: { revieweeId: dto.revieweeId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.user.update({
        where: { id: dto.revieweeId },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
        },
      });

      return created;
    });

    return review;
  }

  async listReviewsFor(userId: string) {
    return this.prisma.review.findMany({
      where: { revieweeId: userId },
      orderBy: { createdAt: "desc" },
      include: { reviewer: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  /** 生成 Google Calendar 授权链接，state 中携带 userId 以便回调时关联账号 */
  getGoogleCalendarAuthUrl(userId: string): string {
    return this.googleCalendar.getAuthUrl(userId);
  }

  async connectGoogleCalendar(userId: string, code: string) {
    const refreshToken = await this.googleCalendar.exchangeCodeForRefreshToken(code);
    if (!refreshToken) {
      throw new BadRequestException("Google 授权失败，未获取到 refresh token");
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleRefreshToken: refreshToken, googleCalendarConnected: true },
      select: SAFE_USER_SELECT,
    });
  }

  async disconnectGoogleCalendar(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleRefreshToken: null, googleCalendarConnected: false },
      select: SAFE_USER_SELECT,
    });
  }

  /** 生成 Stripe Connect Express 入驻链接; 首次调用时顺带创建 Connect 账号 */
  async getStripeConnectOnboardingLink(userId: string, refreshUrl: string, returnUrl: string) {
    if (!this.stripe.isConfigured) {
      throw new BadRequestException("Stripe 未配置，暂时无法入驻收款账号");
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("用户不存在");

    let accountId = user.stripeConnectedAccountId;
    if (!accountId) {
      const account = await this.stripe.createConnectedAccount(user.email ?? `${user.phone}@localhub.example`);
      accountId = account.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeConnectedAccountId: accountId } });
    }

    const url = await this.stripe.createAccountOnboardingLink(accountId, refreshUrl, returnUrl);
    return { url };
  }

  async refreshStripeConnectStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("用户不存在");
    if (!user.stripeConnectedAccountId) {
      return { stripeConnectOnboarded: false };
    }
    const status = await this.stripe.getConnectedAccountStatus(user.stripeConnectedAccountId);
    const onboarded = status.chargesEnabled && status.payoutsEnabled;
    await this.prisma.user.update({ where: { id: userId }, data: { stripeConnectOnboarded: onboarded } });
    return { stripeConnectOnboarded: onboarded };
  }
}
