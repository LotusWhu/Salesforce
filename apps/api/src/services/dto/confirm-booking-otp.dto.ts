import { Length } from "class-validator";

export class ConfirmBookingOtpDto {
  @Length(6, 6, { message: "验证码为6位数字" })
  code!: string;
}
