import { Injectable, Logger } from "@nestjs/common";
import { NotificationType } from "@localhub/shared-types";
import { PrismaService } from "../../prisma/prisma.service";
import { ExpoPushService } from "./expo-push.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const notification = await this.prisma.notification.create({
        data: { userId, type, title, body, data },
      });

      // 站内通知创建成功后，如果用户注册过 Expo Push Token 就顺带推一条
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { expoPushToken: true } });
      if (user?.expoPushToken) {
        await this.expoPush.send(user.expoPushToken, title, body, data);
      }

      return notification;
    } catch (err) {
      this.logger.error(`创建通知失败: ${(err as Error).message}`);
      return null;
    }
  }
}
