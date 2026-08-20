import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";

@ApiTags("payments")
@Controller("payments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("intent")
  createIntent(@CurrentUser() user: User, @Body() dto: CreatePaymentIntentDto) {
    return this.payments.createPaymentIntent(user.id, dto);
  }

  @Get("mine")
  listMine(@CurrentUser() user: User) {
    return this.payments.listMyPayments(user.id);
  }
}
