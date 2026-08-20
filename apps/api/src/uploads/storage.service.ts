import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export interface StoredFile {
  url: string;
  key: string;
}

/**
 * 存储层抽象：本地磁盘是开发环境占位实现 (零配置、不需要云账号)，
 * 后续要换 S3 / Cloudflare R2 只需要新增一个实现这个接口的 Provider，
 * 用 STORAGE_PROVIDER 环境变量切换，UploadsController/其他调用方不需要跟着改。
 */
export interface StorageProvider {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
}

@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalDiskStorageProvider.name);
  private readonly storageDir = join(process.cwd(), "storage", "uploads");

  constructor(private readonly config: ConfigService) {
    mkdirSync(this.storageDir, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string, _mimeType: string): Promise<StoredFile> {
    const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : "";
    const key = `${randomUUID()}${ext}`;
    const filePath = join(this.storageDir, key);
    writeFileSync(filePath, buffer);
    const publicUrl = this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:3001";
    this.logger.log(`已保存上传文件: ${key}`);
    return { url: `${publicUrl}/uploads/${key}`, key };
  }
}
