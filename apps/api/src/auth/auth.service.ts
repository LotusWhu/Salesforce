import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OtpChannel, OtpPurpose } from "@localhub/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { OtpService } from "../common/services/otp.service";

const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(phone: string, purpose: OtpPurpose, channel: OtpChannel = OtpChannel.SMS) {
    const recent = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      throw new BadRequestException(`请求过于频繁，请 ${waitSeconds} 秒后再试`);
    }

    const code = this.otp.generateCode();
    const codeHash = this.otp.hashCode(code);
    const expiresAt = new Date(Date.now() + this.otp.ttlSeconds * 1000);

    await this.prisma.otpCode.create({
      data: { phone, purpose, channel, codeHash, expiresAt },
    });

    if (channel === OtpChannel.SMS) {
      await this.otp.sendSms(phone, code);
    }

    const isDev = process.env.NODE_ENV !== "production";
    return {
      success: true,
      expiresInSeconds: this.otp.ttlSeconds,
      debugCode: isDev ? code : undefined,
    };
  }

  /** 校验验证码是否有效；有效则标记为已使用。供登录及预约/任务完成确认复用 */
  async verifyOtpCode(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new BadRequestException("验证码不存在或已失效，请重新获取");
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("验证码已过期，请重新获取");
    }
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new BadRequestException("验证码尝试次数过多，请重新获取");
    }

    const codeHash = this.otp.hashCode(code);
    if (codeHash !== record.codeHash) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("验证码不正确");
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  async verifyOtpAndLogin(phone: string, code: string) {
    await this.verifyOtpCode(phone, code, OtpPurpose.LOGIN);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          phone,
          name: `用户${phone.slice(-4)}`,
          phoneVerified: true,
        },
      });
    } else if (!user.phoneVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    const accessToken = this.jwt.sign({ sub: user.id, phone: user.phone });
    return { success: true, accessToken, isNewUser };
  }
}
