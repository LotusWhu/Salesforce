import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConversationContextType, NotificationType } from "@localhub/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../common/services/notifications.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { containsPhoneNumber } from "./phone-filter";

const VALID_CONTEXT_TYPES = Object.values(ConversationContextType);

const SENDER_SELECT = { id: true, name: true, avatarUrl: true } as const;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertValidContextType(contextType: string): asserts contextType is ConversationContextType {
    if (!VALID_CONTEXT_TYPES.includes(contextType as ConversationContextType)) {
      throw new BadRequestException(`未知的会话类型: ${contextType}`);
    }
  }

  /**
   * 校验 contextId 对应的业务对象确实存在，并返回"该通知谁"的候选人列表
   * (任务发布者/接单者、预约的客户与服务者、拼车司机、分类信息发布者)。
   */
  private async resolveContextOwners(contextType: ConversationContextType, contextId: string): Promise<string[]> {
    switch (contextType) {
      case ConversationContextType.TASK: {
        const task = await this.prisma.task.findUnique({ where: { id: contextId } });
        if (!task) throw new NotFoundException("任务不存在");
        return [task.posterId, task.assignedTaskerId].filter((id): id is string => !!id);
      }
      case ConversationContextType.BOOKING: {
        const booking = await this.prisma.booking.findUnique({ where: { id: contextId } });
        if (!booking) throw new NotFoundException("预约不存在");
        return [booking.customerId, booking.providerId];
      }
      case ConversationContextType.CARPOOL_TRIP: {
        const trip = await this.prisma.carpoolTrip.findUnique({ where: { id: contextId } });
        if (!trip) throw new NotFoundException("拼车行程不存在");
        return [trip.driverId];
      }
      case ConversationContextType.CLASSIFIED_LISTING: {
        const listing = await this.prisma.classifiedListing.findUnique({ where: { id: contextId } });
        if (!listing) throw new NotFoundException("信息不存在");
        return [listing.posterId];
      }
      default:
        throw new BadRequestException(`未知的会话类型: ${contextType}`);
    }
  }

  private async findOrCreateConversation(contextType: ConversationContextType, contextId: string) {
    return this.prisma.conversation.upsert({
      where: { contextType_contextId: { contextType, contextId } },
      create: { contextType, contextId },
      update: {},
    });
  }

  /**
   * 留言流是公开的: 类似帖子下面的评论区，任何登录用户都能看/都能发言，
   * 不做 participantIds 白名单限制——这是刻意的设计，避免私信里悄悄交换联系方式。
   */
  async listMessages(contextType: string, contextId: string) {
    this.assertValidContextType(contextType);
    const conversation = await this.prisma.conversation.findUnique({
      where: { contextType_contextId: { contextType, contextId } },
    });
    if (!conversation) return [];

    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: SENDER_SELECT } },
    });
    return messages;
  }

  async sendMessage(contextType: string, contextId: string, senderId: string, dto: SendMessageDto) {
    this.assertValidContextType(contextType);

    const text = dto.text?.trim() ?? "";
    const attachmentUrls = dto.attachmentUrls ?? [];
    if (!text && attachmentUrls.length === 0) {
      throw new BadRequestException("消息内容不能为空");
    }
    if (text && containsPhoneNumber(text)) {
      throw new BadRequestException("消息中不能包含电话号码，请通过站内消息完成沟通");
    }

    const owners = await this.resolveContextOwners(contextType, contextId);
    const conversation = await this.findOrCreateConversation(contextType, contextId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId: conversation.id, senderId, text, attachmentUrls },
        include: { sender: { select: SENDER_SELECT } },
      }),
      this.prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
      this.prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: conversation.id, userId: senderId } },
        create: { conversationId: conversation.id, userId: senderId, lastReadAt: new Date() },
        update: { lastReadAt: new Date() },
      }),
    ]);

    await this.notifyOthers(conversation.id, senderId, owners, contextType, contextId, text);

    return message;
  }

  private async notifyOthers(
    conversationId: string,
    senderId: string,
    owners: string[],
    contextType: ConversationContextType,
    contextId: string,
    text: string,
  ) {
    const priorParticipants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipientIds = new Set([...owners, ...priorParticipants.map((p) => p.userId)]);
    recipientIds.delete(senderId);

    const preview = text || "[图片/语音消息]";
    await Promise.all(
      [...recipientIds].map((userId) =>
        this.notifications.create(
          userId,
          NotificationType.NEW_MESSAGE,
          "收到新留言",
          preview.length > 60 ? `${preview.slice(0, 60)}...` : preview,
          { conversationId, contextType, contextId },
        ),
      ),
    );
  }

  async markRead(contextType: string, contextId: string, userId: string) {
    this.assertValidContextType(contextType);
    const conversation = await this.prisma.conversation.findUnique({
      where: { contextType_contextId: { contextType, contextId } },
    });
    if (!conversation) return;
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      create: { conversationId: conversation.id, userId, lastReadAt: new Date() },
      update: { lastReadAt: new Date() },
    });
  }

  async listMyConversations(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: { conversation: true },
      orderBy: { conversation: { lastMessageAt: "desc" } },
    });

    return Promise.all(
      participations.map(async (p) => {
        const lastMessage = await this.prisma.message.findFirst({
          where: { conversationId: p.conversationId },
          orderBy: { createdAt: "desc" },
        });
        return {
          contextType: p.conversation.contextType,
          contextId: p.conversation.contextId,
          lastMessageAt: p.conversation.lastMessageAt,
          lastMessagePreview: lastMessage?.text || (lastMessage ? "[图片/语音消息]" : null),
          unread: !!lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt),
        };
      }),
    );
  }
}
