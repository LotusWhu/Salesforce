import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateReviewDto } from "./dto/create-review.dto";

@ApiTags("users")
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me")
  getMe(@CurrentUser() user: User) {
    return user;
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete("me/google-calendar")
  disconnectGoogleCalendar(@CurrentUser() user: User) {
    return this.users.disconnectGoogleCalendar(user.id);
  }
}
