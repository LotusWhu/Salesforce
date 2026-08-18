import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { Twilio } from "twilio";

const OTP_TTL_SECONDS = 5 * 60;
const OTP_LENGTH = 6;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly twilioClient: Twilio | null;
  private readonly fromNumber: string | undefined;
  private readonly isDev: boolean;

  constructor(private readonly config: ConfigService) {
    const sid = this.config.get<string>("TWILIO_ACCOUNT_SID");
    const token = this.config.get<string>("TWILIO_AUTH_TOKEN");
    this.fromNumber = this.config.get<string>("TWILIO_FROM_NUMBER");
    this.isDev = this.config.get<string>("NODE_ENV") !== "production";
    this.twilioClient = sid && token ? new Twilio(sid, token) : null;
  }

  generateCode(): string {
    const max = 10 ** OTP_LENGTH;
    const code = crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
    return code;
  }

  hashCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  get ttlSeconds() {
    return OTP_TTL_SECONDS;
  }

  async sendSms(phone: string, code: string): Promise<void> {
    const body = `【华人生活服务平台】您的验证码是 ${code}，${OTP_TTL_SECONDS / 60} 分钟内有效，请勿泄露给他人。`;

    if (!this.twilioClient || !this.fromNumber) {
      if (this.isDev) {
        this.logger.warn(
          `[DEV] Twilio 未配置，跳过真实发送。phone=${phone} code=${code}`,
        );
        return;
      }
      throw new Error("短信服务未配置 (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)");
    }

    await this.twilioClient.messages.create({
      to: phone,
      from: this.fromNumber,
      body,
    });
  }
}
