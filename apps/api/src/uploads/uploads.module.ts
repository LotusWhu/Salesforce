import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";
import { LocalDiskStorageProvider } from "./storage.service";

@Module({
  controllers: [UploadsController],
  providers: [LocalDiskStorageProvider],
  exports: [LocalDiskStorageProvider],
})
export class UploadsModule {}
