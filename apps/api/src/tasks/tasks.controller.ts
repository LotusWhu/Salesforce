import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTaskOfferDto } from "./dto/create-task-offer.dto";
import { SubmitTaskCompletionDto } from "./dto/submit-completion.dto";
import { ListTasksQueryDto } from "./dto/list-tasks-query.dto";

@ApiTags("tasks")
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Query() query: ListTasksQueryDto) {
    return this.tasks.list(query);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.tasks.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/cancel")
  cancel(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasks.cancel(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/offers")
  createOffer(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: CreateTaskOfferDto) {
    return this.tasks.createOffer(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/offers/:offerId/accept")
  acceptOffer(@CurrentUser() user: User, @Param("id") id: string, @Param("offerId") offerId: string) {
    return this.tasks.acceptOffer(id, offerId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/start")
  startProgress(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasks.startProgress(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/submit-completion")
  submitCompletion(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: SubmitTaskCompletionDto) {
    return this.tasks.submitCompletion(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/confirm-completion")
  confirmCompletion(@CurrentUser() user: User, @Param("id") id: string) {
    return this.tasks.confirmCompletion(id, user.id);
  }
}
