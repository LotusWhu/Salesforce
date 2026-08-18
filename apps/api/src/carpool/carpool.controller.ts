import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CarpoolService } from "./carpool.service";
import { CreateCarpoolTripDto } from "./dto/create-trip.dto";
import { CreateCarpoolBookingDto } from "./dto/create-carpool-booking.dto";
import { ListCarpoolTripsQueryDto } from "./dto/list-trips-query.dto";

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
}
