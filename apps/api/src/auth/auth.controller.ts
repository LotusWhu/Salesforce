import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpPurpose } from "@localhub/shared-types";
import { BadRequestException } from "@nestjs/common";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("otp/request")
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone, dto.purpose, dto.channel);
  }

  @Post("otp/verify")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    if (dto.purpose !== OtpPurpose.LOGIN) {
      throw new BadRequestException("此接口仅用于登录验证，其他场景请使用对应模块的确认接口");
    }
    return this.auth.verifyOtpAndLogin(dto.phone, dto.code);
  }
}
