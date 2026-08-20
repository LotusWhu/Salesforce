import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LocalDiskStorageProvider } from "./storage.service";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "./uploads.constants";

@ApiTags("uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly storage: LocalDiskStorageProvider) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException(`不支持的文件类型: ${file.mimetype}，仅支持 jpg/png 图片或常见音频格式`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("未收到文件");
    const stored = await this.storage.save(file.buffer, file.originalname, file.mimetype);
    return { url: stored.url, mimeType: file.mimetype, sizeBytes: file.size };
  }
}
