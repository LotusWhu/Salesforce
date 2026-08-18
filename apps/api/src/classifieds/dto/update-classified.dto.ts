import { ClassifiedStatus } from "@renrenbang/shared-types";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateClassifiedDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(ClassifiedStatus)
  status?: ClassifiedStatus;
}
