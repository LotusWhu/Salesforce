import { IsLatitude, IsLongitude, IsOptional, IsString } from "class-validator";

export class GeoPointDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsString()
  address?: string;
}
