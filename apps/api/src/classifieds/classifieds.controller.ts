import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ClassifiedsService } from "./classifieds.service";
import { CreateClassifiedDto } from "./dto/create-classified.dto";
import { UpdateClassifiedDto } from "./dto/update-classified.dto";
import { ListClassifiedsQueryDto } from "./dto/list-classifieds-query.dto";

@ApiTags("classifieds")
@Controller("classifieds")
export class ClassifiedsController {
  constructor(private readonly classifieds: ClassifiedsService) {}

  @Get()
  list(@Query() query: ListClassifiedsQueryDto) {
    return this.classifieds.list(query);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("mine")
  listMine(@CurrentUser() user: User) {
    return this.classifieds.listMine(user.id);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.classifieds.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateClassifiedDto) {
    return this.classifieds.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateClassifiedDto) {
    return this.classifieds.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.classifieds.remove(id, user.id);
  }
}
