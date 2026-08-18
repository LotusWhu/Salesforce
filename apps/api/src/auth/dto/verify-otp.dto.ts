import { OtpPurpose } from "@renrenbang/shared-types";
import { IsEnum, Length, Matches } from "class-validator";

export class VerifyOtpDto {
  @Matches(/^\+[1-9]\d{6,14}$/, { message: "手机号需为 E.164 格式，例如 +61412345678" })
  phone!: string;

  @Length(6, 6, { message: "验证码为6位数字" })
  code!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}
