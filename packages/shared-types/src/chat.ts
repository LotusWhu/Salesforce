import { ConversationContextType } from "./enums";

// 留言流是公开的 (类似帖子评论区): 任何登录用户都能在任务/预约/拼车行程/分类信息下面留言，
// 不是私信，目的是逼着双方在平台内公开沟通，方便纠纷仲裁，也杜绝私下交换联系方式。
export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  sender: { id: string; name: string; avatarUrl?: string | null };
  text: string;
  attachmentUrls: string[]; // 图片或语音留言 (音频文件按扩展名识别，前端渲染成播放器)
  createdAt: string;
}

export interface SendMessageDto {
  text?: string; // 纯语音/图片留言时可为空，但 text 和 attachmentUrls 至少要有一个
  attachmentUrls?: string[];
}

export interface ConversationSummaryDto {
  contextType: ConversationContextType;
  contextId: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unread: boolean;
}
