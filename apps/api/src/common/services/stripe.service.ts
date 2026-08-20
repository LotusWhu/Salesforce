import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly client: Stripe | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    this.client = key ? new Stripe(key) : null;
  }

  get isConfigured() {
    return this.client !== null;
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>) {
    if (!this.client) {
      throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    }
    // Stripe 金额单位为最小货币单位 (如 AUD 分)
    const amountInMinorUnits = Math.round(amount * 100);
    return this.client.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  /** 创建 Stripe Connect Express 账号，用于个体户(跑腿者/服务提供者/车主)接收分账 */
  async createConnectedAccount(email: string) {
    if (!this.client) throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    return this.client.accounts.create({
      type: "express",
      country: "AU",
      email,
      capabilities: { transfers: { requested: true } },
    });
  }

  async createAccountOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
    if (!this.client) throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    const link = await this.client.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return link.url;
  }

  /** 担保交易释放: 从平台账户把净额(已扣服务费)转给收款人的 Connect 账号 */
  async transfer(amount: number, currency: string, destinationAccountId: string, metadata: Record<string, string>) {
    if (!this.client) throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    const amountInMinorUnits = Math.round(amount * 100);
    return this.client.transfers.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      destination: destinationAccountId,
      metadata,
    });
  }

  async refund(paymentIntentId: string) {
    if (!this.client) throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    return this.client.refunds.create({ payment_intent: paymentIntentId });
  }

  async getConnectedAccountStatus(accountId: string) {
    if (!this.client) throw new Error("Stripe 未配置 (STRIPE_SECRET_KEY)");
    const account = await this.client.accounts.retrieve(accountId);
    return { chargesEnabled: !!account.charges_enabled, payoutsEnabled: !!account.payouts_enabled };
  }
}
