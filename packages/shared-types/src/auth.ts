import { OtpChannel, OtpPurpose } from "./enums";

export interface RequestOtpDto {
  phone: string; // E.164
  purpose: OtpPurpose;
  channel?: OtpChannel; // 默认 SMS
}

export interface RequestOtpResponse {
  success: boolean;
  expiresInSeconds: number;
  // 开发环境下调试用，生产环境不返回
  debugCode?: string;
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResponse {
  success: boolean;
  accessToken?: string;
  isNewUser?: boolean;
}

export interface AuthTokenPayload {
  sub: string; // userId
  phone: string;
}
