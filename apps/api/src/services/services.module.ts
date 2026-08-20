import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PaymentsModule } from "../payments/payments.module";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
