import { ClassifiedCategory } from "@localhub/shared-types";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { GeoPointDto } from "../../tasks/dto/geo-point.dto";

export class CreateClassifiedDto {
  @IsEnum(ClassifiedCategory)
  category!: ClassifiedCategory;

  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(3000)
  description!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @IsOptional()
  @IsString()
  city?: string;
}
