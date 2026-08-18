import { IsInt, Max, Min } from "class-validator";

export class CreateCarpoolBookingDto {
  @IsInt()
  @Min(1)
  @Max(8)
  seats!: number;
}
