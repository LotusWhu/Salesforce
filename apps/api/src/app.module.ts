import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TasksModule } from "./tasks/tasks.module";
import { ServicesModule } from "./services/services.module";
import { CarpoolModule } from "./carpool/carpool.module";
import { ClassifiedsModule } from "./classifieds/classifieds.module";
import { PaymentsModule } from "./payments/payments.module";
import { UploadsModule } from "./uploads/uploads.module";
import { GeocodeModule } from "./geocode/geocode.module";
import { ChatModule } from "./chat/chat.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TasksModule,
    ServicesModule,
    CarpoolModule,
    ClassifiedsModule,
    PaymentsModule,
    UploadsModule,
    GeocodeModule,
    ChatModule,
    NotificationsModule,
  ],
})
export class AppModule {}
