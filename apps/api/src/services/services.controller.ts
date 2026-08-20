import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ServicesService } from "./services.service";
import { CreateServiceListingDto } from "./dto/create-service-listing.dto";
import { SetAvailabilityDto } from "./dto/set-availability.dto";
import { ListServicesQueryDto } from "./dto/list-services-query.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { ConfirmBookingOtpDto } from "./dto/confirm-booking-otp.dto";

@ApiTags("services")
@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get("services")
  list(@Query() query: ListServicesQueryDto) {
    return this.services.listListings(query);
  }

  @Get("services/:id")
  getById(@Param("id") id: string) {
    return this.services.getListingById(id);
  }

  @Get("services/:id/next-available")
  getNextAvailable(@Param("id") id: string) {
    return this.services.getNextAvailable(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("services")
  create(@CurrentUser() user: User, @Body() dto: CreateServiceListingDto) {
    return this.services.createListing(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("services/:id/availability")
  setAvailability(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: SetAvailabilityDto) {
    return this.services.setAvailability(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("bookings")
  createBooking(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.services.createBooking(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("bookings/:id/confirm-otp")
  confirmBookingOtp(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: ConfirmBookingOtpDto) {
    return this.services.confirmBookingOtp(id, user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("bookings/mine")
  listMyBookings(@CurrentUser() user: User, @Query("as") as?: "customer" | "provider") {
    return this.services.listMyBookings(user.id, as === "provider" ? "provider" : "customer");
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("bookings/:id/cancel")
  cancelBooking(@CurrentUser() user: User, @Param("id") id: string) {
    return this.services.cancelBooking(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("bookings/:id/complete")
  completeBooking(@CurrentUser() user: User, @Param("id") id: string) {
    return this.services.completeBooking(id, user.id);
  }
}
