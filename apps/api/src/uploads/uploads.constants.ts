// 图片: 发布任务/服务/分类信息的配图；音频: 站内消息里的语音留言
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
export const ALLOWED_AUDIO_MIME_TYPES = ["audio/m4a", "audio/mp4", "audio/mpeg", "audio/webm", "audio/x-m4a", "audio/aac"];
export const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_AUDIO_MIME_TYPES];

export const MAX_UPLOAD_SIZE_BYTES = 30 * 1024 * 1024; // 30MB
