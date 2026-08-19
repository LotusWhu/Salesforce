import { PaymentRelatedType } from "@localhub/shared-types";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreatePaymentIntentDto {
  @IsEnum(PaymentRelatedType)
  relatedType!: PaymentRelatedType;

  @IsString()
  relatedId!: string;

  @IsNumber()
  @Min(0.5)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
