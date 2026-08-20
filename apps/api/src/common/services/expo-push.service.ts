import { Injectable, Logger } from "@nestjs/common";

/**
 * Expo Push 推送: 直接调用 Expo 的公开 REST 推送接口，不需要额外的 SDK 依赖。
 * https://docs.expo.dev/push-notifications/sending-notifications/#http2-api
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async send(expoPushToken: string, title: string, body: string, data?: Record<string, unknown>) {
    if (!expoPushToken.startsWith("ExponentPushToken")) {
      this.logger.warn(`忽略无效的 Expo Push Token: ${expoPushToken}`);
      return;
    }
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ to: expoPushToken, title, body, data, sound: "default" }),
      });
      if (!res.ok) {
        this.logger.warn(`Expo 推送请求失败: ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Expo 推送异常: ${(err as Error).message}`);
    }
  }
}
