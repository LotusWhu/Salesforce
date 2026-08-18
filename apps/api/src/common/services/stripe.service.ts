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
}
