import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentRelatedType, PaymentStatus } from "@localhub/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../common/services/stripe.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";

const DEFAULT_PLATFORM_FEE_PERCENT = 10;

/**
 * 担保交易(escrow)风格支付: 顾客/发布者的钱先进平台账户并标记 HELD，
 * 待任务/预约/拼车"完成并被确认"后由对应业务模块调用 releaseForContext()，
 * 自动按平台服务费比例扣费，净额通过 Stripe Connect 转给跑腿者/服务提供者/车主；
 * 中途取消则调用 refundForContext() 原路退款。
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  private get platformFeePercent(): number {
    const raw = this.config.get<string>("PLATFORM_FEE_PERCENT");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : DEFAULT_PLATFORM_FEE_PERCENT;
  }

  // ---------------- 手动创建支付意向 (预留给未来的收银台 UI 直接调用) ----------------

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

  // ---------------- 业务模块自动触发的担保交易生命周期 ----------------

  /**
   * 任务被接单 / 预约验证码确认 / 拼车下单成功时调用: 把款项标记为 HELD，
   * 并尝试创建真实的 Stripe PaymentIntent (client_secret 供未来的收银台 UI 完成扣款用)。
   * 注意: 本仓库目前还没有收银台前端 (Stripe Elements)，所以"HELD"是平台侧的担保记账状态，
   * 不代表已经从客户卡里真实划走钱——真实扣款仍需要客户在收银台里完成这个 PaymentIntent。
   */
  async holdForContext(params: {
    relatedType: PaymentRelatedType;
    relatedId: string;
    payerId: string;
    payeeId: string;
    amount: number;
    currency?: string;
  }) {
    const { relatedType, relatedId, payerId, payeeId, amount } = params;
    const currency = params.currency ?? "AUD";
    if (amount <= 0) return null;

    const payment = await this.prisma.payment.create({
      data: {
        payerId,
        payeeId,
        relatedType,
        taskId: relatedType === PaymentRelatedType.TASK ? relatedId : undefined,
        bookingId: relatedType === PaymentRelatedType.BOOKING ? relatedId : undefined,
        carpoolBookingId: relatedType === PaymentRelatedType.CARPOOL_BOOKING ? relatedId : undefined,
        amount,
        currency,
        status: PaymentStatus.HELD,
      },
    });

    if (this.stripe.isConfigured) {
      try {
        const intent = await this.stripe.createPaymentIntent(amount, currency, {
          paymentId: payment.id,
          relatedType,
          relatedId,
        });
        await this.prisma.payment.update({ where: { id: payment.id }, data: { stripePaymentIntentId: intent.id } });
      } catch (err) {
        this.logger.warn(`创建 Stripe PaymentIntent 失败 (paymentId=${payment.id}): ${(err as Error).message}`);
      }
    }

    return payment;
  }

  private async findHeldPayments(relatedType: PaymentRelatedType, relatedId: string) {
    const where =
      relatedType === PaymentRelatedType.TASK
        ? { taskId: relatedId }
        : relatedType === PaymentRelatedType.BOOKING
          ? { bookingId: relatedId }
          : { carpoolBookingId: relatedId };
    return this.prisma.payment.findMany({ where: { ...where, status: PaymentStatus.HELD }, include: { payee: true } });
  }

  /**
   * 任务确认完成 / 预约标记完成 / 拼车行程完成时调用:
   * 按平台服务费比例扣费，净额通过 Stripe Connect 转给收款人 (如果已完成 Connect 入驻)。
   */
  async releaseForContext(relatedType: PaymentRelatedType, relatedId: string) {
    const payments = await this.findHeldPayments(relatedType, relatedId);
    for (const payment of payments) {
      const amount = Number(payment.amount);
      const feeAmount = Math.round(amount * (this.platformFeePercent / 100) * 100) / 100;
      const netAmount = Math.round((amount - feeAmount) * 100) / 100;

      let stripeTransferId: string | null = null;
      if (this.stripe.isConfigured && payment.payee?.stripeConnectedAccountId && payment.payee.stripeConnectOnboarded) {
        try {
          const transfer = await this.stripe.transfer(netAmount, payment.currency, payment.payee.stripeConnectedAccountId, {
            paymentId: payment.id,
            relatedType,
            relatedId,
          });
          stripeTransferId = transfer.id;
        } catch (err) {
          this.logger.warn(`Stripe Connect 转账失败 (paymentId=${payment.id}): ${(err as Error).message}`);
        }
      } else {
        this.logger.log(
          `跳过真实转账 (paymentId=${payment.id}): Stripe 未配置或收款人未完成 Connect 入驻，仅记录担保交易已释放`,
        );
      }

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.RELEASED,
          platformFeeAmount: feeAmount,
          netAmount,
          stripeTransferId,
        },
      });
    }
    return payments.length;
  }

  /** 任务/预约/拼车在完成前被取消时调用: 原路退款给付款人 */
  async refundForContext(relatedType: PaymentRelatedType, relatedId: string) {
    const payments = await this.findHeldPayments(relatedType, relatedId);
    for (const payment of payments) {
      if (this.stripe.isConfigured && payment.stripePaymentIntentId) {
        try {
          await this.stripe.refund(payment.stripePaymentIntentId);
        } catch (err) {
          this.logger.warn(`Stripe 退款失败 (paymentId=${payment.id}): ${(err as Error).message}`);
        }
      }
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.REFUNDED } });
    }
    return payments.length;
  }
}
