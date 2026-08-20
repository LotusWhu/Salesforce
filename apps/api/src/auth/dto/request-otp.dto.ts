import { OtpChannel, OtpPurpose } from "@localhub/shared-types";
import { IsEnum, IsOptional, Matches } from "class-validator";

export class RequestOtpDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: "手机号需为 E.164 格式，例如 +61412345678" })
  phone!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;

  @IsOptional()
  @IsEnum(OtpChannel)
  channel?: OtpChannel;
}
