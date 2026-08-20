import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, Matches, Max, Min, ValidateNested } from "class-validator";

class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "时间格式需为 HH:mm" })
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "时间格式需为 HH:mm" })
  endTime!: string;
}

export class SetAvailabilityDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
