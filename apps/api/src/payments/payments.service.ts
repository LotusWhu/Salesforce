import { Injectable } from "@nestjs/common";
import { PaymentRelatedType, PaymentStatus } from "@renrenbang/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../common/services/stripe.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";

/**
 * 担保交易(escrow)风格支付: 顾客下单时创建 PaymentIntent 并持有(HELD)，
 * 待任务/预约/拼车确认完成后再释放(RELEASED)给跑腿者/服务提供者/车主。
 * 释放/退款的具体触发目前由各业务模块在状态确认完成时调用，此模块只负责创建与查询。
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async createPaymentIntent(payerId: string, dto: CreatePaymentIntentDto) {
    const currency = dto.currency ?? "AUD";
    const payment = await this.prisma.payment.create({
      data: {
        payerId,
        relatedType: dto.relatedType,
        taskId: dto.relatedType === PaymentRelatedType.TASK ? dto.relatedId : undefined,
        bookingId: dto.relatedType === PaymentRelatedType.BOOKING ? dto.relatedId : undefined,
        carpoolBookingId: dto.relatedType === PaymentRelatedType.CARPOOL_BOOKING ? dto.relatedId : undefined,
        amount: dto.amount,
        currency,
        status: PaymentStatus.PENDING,
      },
    });

    if (!this.stripe.isConfigured) {
      return { paymentId: payment.id, clientSecret: null, note: "Stripe 未配置，返回演示数据" };
    }

    const intent = await this.stripe.createPaymentIntent(dto.amount, currency, {
      paymentId: payment.id,
      relatedType: dto.relatedType,
      relatedId: dto.relatedId,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentIntentId: intent.id, status: PaymentStatus.HELD },
    });

    return { paymentId: payment.id, clientSecret: intent.client_secret };
  }

  async listMyPayments(payerId: string) {
    return this.prisma.payment.findMany({ where: { payerId }, orderBy: { createdAt: "desc" } });
  }
}
