import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { serializeClassified } from "../common/serializers";
import { CreateClassifiedDto } from "./dto/create-classified.dto";
import { UpdateClassifiedDto } from "./dto/update-classified.dto";
import { ListClassifiedsQueryDto } from "./dto/list-classifieds-query.dto";

@Injectable()
export class ClassifiedsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(posterId: string, dto: CreateClassifiedDto) {
    const listing = await this.prisma.classifiedListing.create({
      data: {
        posterId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? "AUD",
        photos: dto.photos ?? [],
        locationLat: dto.location?.lat,
        locationLng: dto.location?.lng,
        city: dto.city,
      },
    });
    return serializeClassified(listing);
  }

  async list(query: ListClassifiedsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      status: "ACTIVE" as const,
      ...(query.category ? { category: query.category } : {}),
      ...(query.city ? { city: query.city } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
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
      this.prisma.classifiedListing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { poster: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } },
      }),
      this.prisma.classifiedListing.count({ where }),
    ]);
    return { items: items.map(serializeClassified), total, page, pageSize };
  }

  async getById(id: string) {
    const listing = await this.prisma.classifiedListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: { poster: { select: { id: true, name: true, avatarUrl: true, ratingAvg: true } } },
    }).catch(() => null);
    if (!listing) throw new NotFoundException("信息不存在");
    return serializeClassified(listing);
  }

  async update(id: string, posterId: string, dto: UpdateClassifiedDto) {
    const listing = await this.prisma.classifiedListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("信息不存在");
    if (listing.posterId !== posterId) throw new ForbiddenException("无权操作此信息");
    const updated = await this.prisma.classifiedListing.update({ where: { id }, data: dto });
    return serializeClassified(updated);
  }

  async remove(id: string, posterId: string) {
    const listing = await this.prisma.classifiedListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException("信息不存在");
    if (listing.posterId !== posterId) throw new ForbiddenException("无权操作此信息");
    const updated = await this.prisma.classifiedListing.update({ where: { id }, data: { status: "REMOVED" } });
    return serializeClassified(updated);
  }

  async listMine(posterId: string) {
    const items = await this.prisma.classifiedListing.findMany({
      where: { posterId },
      orderBy: { createdAt: "desc" },
    });
    return items.map(serializeClassified);
  }
}
