import { Injectable, Logger } from "@nestjs/common";
import { NotificationType } from "@renrenbang/shared-types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      return await this.prisma.notification.create({
        data: { userId, type, title, body, data },
      });
    } catch (err) {
      this.logger.error(`创建通知失败: ${(err as Error).message}`);
      return null;
    }
  }
}
