import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [PaymentsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
