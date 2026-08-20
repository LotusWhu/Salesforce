import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { CarpoolController } from "./carpool.controller";
import { CarpoolService } from "./carpool.service";

@Module({
  imports: [PaymentsModule],
  controllers: [CarpoolController],
  providers: [CarpoolService],
})
export class CarpoolModule {}
