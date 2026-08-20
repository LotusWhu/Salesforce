import { PaymentRelatedType, PaymentStatus } from "./enums";

export interface PaymentDto {
  id: string;
  payerId: string;
  payeeId?: string | null;
  relatedType: PaymentRelatedType;
  taskId?: string | null;
  bookingId?: string | null;
  carpoolBookingId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string | null;
  // 释放(RELEASED)时的分账明细: 平台服务费 + 实际到账净额
  platformFeeAmount?: number | null;
  netAmount?: number | null;
  stripeTransferId?: string | null;
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
