import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";

@ApiTags("chat")
@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // 留言流是公开的 (类似帖子评论区)，未登录也能看
  @Get("chat/:contextType/:contextId/messages")
  listMessages(@Param("contextType") contextType: string, @Param("contextId") contextId: string) {
    return this.chat.listMessages(contextType, contextId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("chat/:contextType/:contextId/messages")
  sendMessage(
    @Param("contextType") contextType: string,
    @Param("contextId") contextId: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.sendMessage(contextType, contextId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("chat/:contextType/:contextId/read")
  markRead(@Param("contextType") contextType: string, @Param("contextId") contextId: string, @CurrentUser() user: User) {
    return this.chat.markRead(contextType, contextId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("chat/mine")
  listMyConversations(@CurrentUser() user: User) {
    return this.chat.listMyConversations(user.id);
  }
}
