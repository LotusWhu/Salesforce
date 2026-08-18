import { PaymentRelatedType, PaymentStatus } from "./enums";

export interface PaymentDto {
  id: string;
  payerId: string;
  payeeId?: string | null;
  relatedType: PaymentRelatedType;
  relatedId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string | null;
  createdAt: string;
}

export interface CreatePaymentIntentDto {
  relatedType: PaymentRelatedType;
  relatedId: string;
  amount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
}
