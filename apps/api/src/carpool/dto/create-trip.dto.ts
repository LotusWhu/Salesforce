import { CarpoolType } from "@localhub/shared-types";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { GeoPointDto } from "../../tasks/dto/geo-point.dto";

export class CreateCarpoolTripDto {
  @IsEnum(CarpoolType)
  type!: CarpoolType;

  @ValidateNested()
  @Type(() => GeoPointDto)
  origin!: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  destination!: GeoPointDto;

  @IsDateString()
  departureTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  flightNumber?: string;

  @IsInt()
  @Min(1)
  @Max(8)
  totalSeats!: number;

  @IsNumber()
  @Min(0)
  pricePerSeat!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
