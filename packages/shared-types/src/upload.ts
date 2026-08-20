export interface UploadResponseDto {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export const MAX_UPLOAD_SIZE_BYTES = 30 * 1024 * 1024; // 30MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
