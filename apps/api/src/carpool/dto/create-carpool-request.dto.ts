import { CarpoolFareMode, CarpoolType } from "@localhub/shared-types";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { GeoPointDto } from "../../tasks/dto/geo-point.dto";

export class CreateCarpoolRequestDto {
  @IsEnum(CarpoolType)
  type!: CarpoolType;

  @IsString()
  @MaxLength(120)
  airport!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  terminal?: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  otherLocation!: GeoPointDto;

  @IsOptional()
  @IsString()
  city?: string;

  @IsDateString()
  scheduledTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  flightNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  passengerCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  luggageCount?: number;

  @IsOptional()
  @IsEnum(CarpoolFareMode)
  fareMode?: CarpoolFareMode;

  @IsOptional()
  @IsDateString()
  returnScheduledTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24 * 60)
  flexibilityMinutes?: number;
}
