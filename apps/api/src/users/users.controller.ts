import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateReviewDto } from "./dto/create-review.dto";

@ApiTags("users")
@Controller()
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me")
  getMe(@CurrentUser() user: User) {
    return this.users.getById(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch("me")
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.users.getById(id);
  }

  @Get("users/:id/reviews")
  getUserReviews(@Param("id") id: string) {
    return this.users.listReviewsFor(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("reviews")
  createReview(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.users.createReview(user.id, dto);
  }

  // ---------------- Google Calendar 授权 (用于上门服务预约同步日程) ----------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me/google-calendar/auth-url")
  getGoogleCalendarAuthUrl(@CurrentUser() user: User) {
    return { url: this.users.getGoogleCalendarAuthUrl(user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("me/google-calendar/connect")
  connectGoogleCalendar(@CurrentUser() user: User, @Query("code") code: string) {
    return this.users.connectGoogleCalendar(user.id, code);
  }

  /**
   * Google OAuth 授权后浏览器直接跳转到这里 (无 JWT 上下文)，
   * 用户身份靠 getAuthUrl 时塞进 state 里的 userId 还原，
   * 完成后跳回网页版个人中心 (GOOGLE_OAUTH_REDIRECT_URL 需配置成这个地址)。
   */
  @Get("me/google-calendar/callback")
  async googleCalendarCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response,
  ) {
    const webAppUrl = this.config.get<string>("WEB_APP_URL") ?? "http://localhost:3000";
    if (error || !code || !state) {
      return res.redirect(`${webAppUrl}/me?googleCalendar=error`);
    }
    try {
      await this.users.connectGoogleCalendar(state, code);
      return res.redirect(`${webAppUrl}/me?googleCalendar=connected`);
    } catch {
      return res.redirect(`${webAppUrl}/me?googleCalendar=error`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete("me/google-calendar")
  disconnectGoogleCalendar(@CurrentUser() user: User) {
    return this.users.disconnectGoogleCalendar(user.id);
  }

  // ---------------- Stripe Connect 入驻 (个体户跑腿者/服务提供者/车主接收担保交易分账) ----------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me/stripe-connect/onboarding-link")
  getStripeConnectOnboardingLink(@CurrentUser() user: User) {
    const webAppUrl = this.config.get<string>("WEB_APP_URL") ?? "http://localhost:3000";
    return this.users.getStripeConnectOnboardingLink(user.id, `${webAppUrl}/me`, `${webAppUrl}/me?stripeConnect=done`);
  }

  /**
   * Stripe 入驻是异步的，没有接 webhook，前端从 Stripe 页面跳回来后
   * 调这个接口主动去 Stripe 查一下入驻账号的真实状态再更新本地记录。
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("me/stripe-connect/refresh-status")
  refreshStripeConnectStatus(@CurrentUser() user: User) {
    return this.users.refreshStripeConnectStatus(user.id);
  }
}
