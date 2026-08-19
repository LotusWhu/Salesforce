import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CarpoolService } from "./carpool.service";
import { CreateCarpoolTripDto } from "./dto/create-trip.dto";
import { CreateCarpoolBookingDto } from "./dto/create-carpool-booking.dto";
import { ListCarpoolTripsQueryDto } from "./dto/list-trips-query.dto";
import { CreateCarpoolRequestDto } from "./dto/create-carpool-request.dto";

@ApiTags("carpool")
@Controller("carpool")
export class CarpoolController {
  constructor(private readonly carpool: CarpoolService) {}

  @Get("trips")
  listTrips(@Query() query: ListCarpoolTripsQueryDto) {
    return this.carpool.listTrips(query);
  }

  @Get("trips/:id")
  getTrip(@Param("id") id: string) {
    return this.carpool.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("trips")
  createTrip(@CurrentUser() user: User, @Body() dto: CreateCarpoolTripDto) {
    return this.carpool.createTrip(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("trips/:id/cancel")
  cancelTrip(@CurrentUser() user: User, @Param("id") id: string) {
    return this.carpool.cancelTrip(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("trips/:id/bookings")
  createBooking(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: CreateCarpoolBookingDto) {
    return this.carpool.createBooking(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("bookings/:id/cancel")
  cancelBooking(@CurrentUser() user: User, @Param("id") id: string) {
    return this.carpool.cancelBooking(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("bookings/mine")
  listMyBookings(@CurrentUser() user: User) {
    return this.carpool.listMyBookings(user.id);
  }

  // ---------------- 拼车需求 (NearMe 风格: 乘客发起需求, 系统自动匹配) ----------------

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("requests")
  createRequest(@CurrentUser() user: User, @Body() dto: CreateCarpoolRequestDto) {
    return this.carpool.createRequest(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("requests/mine")
  listMyRequests(@CurrentUser() user: User) {
    return this.carpool.listMyRequests(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("requests/:id/cancel")
  cancelRequest(@CurrentUser() user: User, @Param("id") id: string) {
    return this.carpool.cancelRequest(id, user.id);
  }
}
