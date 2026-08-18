export type ConversationContextType =
  | "TASK"
  | "BOOKING"
  | "CARPOOL_TRIP"
  | "CLASSIFIED_LISTING";

export interface ConversationDto {
  id: string;
  contextType: ConversationContextType;
  contextId: string;
  participantIds: string[];
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachmentUrls: string[];
  createdAt: string;
  readBy: string[];
}

export interface SendMessageDto {
  conversationId?: string; // 若为空则需提供 contextType+contextId 由后端创建/查找会话
  contextType?: ConversationContextType;
  contextId?: string;
  text: string;
  attachmentUrls?: string[];
}
