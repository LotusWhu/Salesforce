import { Type } from "class-transformer";
import { IsDateString, IsOptional, IsString, ValidateNested } from "class-validator";
import { GeoPointDto } from "../../tasks/dto/geo-point.dto";

export class CreateBookingDto {
  @IsString()
  serviceId!: string;

  @IsDateString()
  scheduledStart!: string;

  @IsDateString()
  scheduledEnd!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  address?: GeoPointDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
