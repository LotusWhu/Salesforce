import { CarpoolType } from "@renrenbang/shared-types";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class ListCarpoolTripsQueryDto {
  @IsOptional()
  @IsEnum(CarpoolType)
  type?: CarpoolType;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
