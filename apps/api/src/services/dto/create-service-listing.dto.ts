import { PriceType, ServiceCategory } from "@localhub/shared-types";
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateServiceListingDto {
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(3000)
  description!: string;

  @IsEnum(PriceType)
  priceType!: PriceType;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsInt()
  @Min(15)
  @Max(24 * 60)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsBoolean()
  supportsInstantBooking?: boolean;
}
