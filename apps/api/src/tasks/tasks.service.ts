import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, PaymentRelatedType, TaskOfferStatus, TaskStatus } from "@localhub/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../common/services/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import { serializeTask } from "../common/serializers";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTaskOfferDto } from "./dto/create-task-offer.dto";
import { SubmitTaskCompletionDto } from "./dto/submit-completion.dto";
import { ListTasksQueryDto } from "./dto/list-tasks-query.dto";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {}

  async create(posterId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        posterId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currency: dto.currency ?? "AUD",
        city: dto.city,
        locationLat: dto.location?.lat,
        locationLng: dto.location?.lng,
        locationAddress: dto.location?.address,
        isRemote: dto.isRemote ?? false,
        isUrgent: dto.isUrgent ?? false,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        attachmentUrls: dto.attachmentUrls ?? [],
      },
    });
    return serializeTask(task);
  }

  async list(query: ListTasksQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.urgentOnly ? { isUrgent: true } : {}),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: "insensitive" as const } },
              { description: { contains: query.keyword, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { poster: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items: items.map(serializeTask), total, page, pageSize };
  }

  async getById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        poster: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } },
        assignedTasker: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } },
        offers: { include: { tasker: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } } },
      },
    });
    if (!task) throw new NotFoundException("任务不存在");
    return serializeTask(task);
  }

  private async getOwnedTask(id: string, posterId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("任务不存在");
    if (task.posterId !== posterId) throw new ForbiddenException("无权操作此任务");
    return task;
  }

  async update(id: string, posterId: string, dto: UpdateTaskDto) {
    await this.getOwnedTask(id, posterId);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    return serializeTask(task);
  }

  async cancel(id: string, posterId: string) {
    const task = await this.getOwnedTask(id, posterId);
    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException("任务已完成，无法取消");
    }
    const updated = await this.prisma.task.update({ where: { id }, data: { status: TaskStatus.CANCELLED } });
    await this.payments.refundForContext(PaymentRelatedType.TASK, id);
    return serializeTask(updated);
  }

  async createOffer(taskId: string, taskerId: string, dto: CreateTaskOfferDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException("任务不存在");
    if (task.posterId === taskerId) throw new BadRequestException("不能给自己发布的任务报价");
    if (task.status !== TaskStatus.OPEN && task.status !== TaskStatus.OFFERED) {
      throw new BadRequestException("该任务当前不接受报价");
    }

    const offer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.taskOffer.create({
        data: { taskId, taskerId, price: dto.price, message: dto.message },
      });
      await tx.task.update({ where: { id: taskId }, data: { status: TaskStatus.OFFERED } });
      return created;
    });

    await this.notifications.create(
      task.posterId,
      NotificationType.TASK_NEW_OFFER,
      "收到新的任务报价",
      `你的任务「${task.title}」收到一个新报价`,
      { taskId },
    );

    return offer;
  }

  async acceptOffer(taskId: string, offerId: string, posterId: string) {
    const task = await this.getOwnedTask(taskId, posterId);
    const offer = await this.prisma.taskOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.taskId !== taskId) throw new NotFoundException("报价不存在");
    if (offer.status !== TaskOfferStatus.PENDING) throw new BadRequestException("该报价已处理");

    const [, , updatedTask] = await this.prisma.$transaction([
      this.prisma.taskOffer.update({ where: { id: offerId }, data: { status: TaskOfferStatus.ACCEPTED } }),
      this.prisma.taskOffer.updateMany({
        where: { taskId, id: { not: offerId }, status: TaskOfferStatus.PENDING },
        data: { status: TaskOfferStatus.REJECTED },
      }),
      this.prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.ASSIGNED, assignedTaskerId: offer.taskerId },
      }),
    ]);

    await this.notifications.create(
      offer.taskerId,
      NotificationType.TASK_ASSIGNED,
      "你的报价已被接受",
      `任务「${task.title}」已分配给你`,
      { taskId },
    );

    // 接单即把报价金额放入担保账户 (HELD)，任务确认完成后再释放给跑腿者
    await this.payments.holdForContext({
      relatedType: PaymentRelatedType.TASK,
      relatedId: taskId,
      payerId: task.posterId,
      payeeId: offer.taskerId,
      amount: Number(offer.price),
      currency: task.currency,
    });

    return serializeTask(updatedTask);
  }

  async startProgress(id: string, taskerId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("任务不存在");
    if (task.assignedTaskerId !== taskerId) throw new ForbiddenException("你未被分配此任务");
    if (task.status !== TaskStatus.ASSIGNED) throw new BadRequestException("任务状态不允许开始执行");
    const updated = await this.prisma.task.update({ where: { id }, data: { status: TaskStatus.IN_PROGRESS } });
    return serializeTask(updated);
  }

  async submitCompletion(id: string, taskerId: string, dto: SubmitTaskCompletionDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("任务不存在");
    if (task.assignedTaskerId !== taskerId) throw new ForbiddenException("你未被分配此任务");
    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException("任务状态不允许提交完成凭证");
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.SUBMITTED, proofUrls: dto.proofUrls, completionNote: dto.note },
    });

    await this.notifications.create(
      task.posterId,
      NotificationType.TASK_STATUS_CHANGED,
      "任务已提交完成凭证",
      `任务「${task.title}」的跑腿者已提交完成凭证，请确认`,
      { taskId: id },
    );

    return serializeTask(updated);
  }

  async confirmCompletion(id: string, posterId: string) {
    const task = await this.getOwnedTask(id, posterId);
    if (task.status !== TaskStatus.SUBMITTED) {
      throw new BadRequestException("任务尚未提交完成凭证");
    }
    const updated = await this.prisma.task.update({ where: { id }, data: { status: TaskStatus.COMPLETED } });

    if (task.assignedTaskerId) {
      await this.notifications.create(
        task.assignedTaskerId,
        NotificationType.TASK_STATUS_CHANGED,
        "任务已确认完成",
        `任务「${task.title}」已被确认完成`,
        { taskId: id },
      );
    }

    // 发布者确认完成后，从担保账户按平台服务费比例扣费，净额转给跑腿者
    await this.payments.releaseForContext(PaymentRelatedType.TASK, id);

    return serializeTask(updated);
  }
}
