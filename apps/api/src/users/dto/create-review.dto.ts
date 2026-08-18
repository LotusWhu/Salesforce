import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateReviewDto {
  @IsIn(["TASK", "BOOKING", "CARPOOL_BOOKING"])
  relatedType!: "TASK" | "BOOKING" | "CARPOOL_BOOKING";

  @IsString()
  relatedId!: string;

  @IsString()
  revieweeId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
