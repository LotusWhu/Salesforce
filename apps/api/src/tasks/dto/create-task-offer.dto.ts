import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTaskOfferDto {
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  message?: string;
}
