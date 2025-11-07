import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';
import { CreateServiceItems } from './dto/create-service-items.dto';
import { ServiceItemStatus, UserRole } from '@prisma/client';
import { ServiceItemSeeder } from 'prisma/seeders/service-item.seeder';
import { SubServiceItemSeeder } from 'prisma/seeders/sub-service-item.seeder';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ServiceItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async fetchServiceItems() {
    return this.prisma.serviceItem.findMany({
      where: { deletedAt: null },
      include: { subServiceItems: { where: { deletedAt: null } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLastUpdated(): Promise<Date | null> {
    const latest = await this.prisma.serviceItem.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return latest?.updatedAt ?? null;
  }

  async getETag(): Promise<string> {
    const [latest, count] = await Promise.all([
      this.prisma.serviceItem.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.serviceItem.count(),
    ]);

    const updatedAt = latest?.updatedAt?.toISOString() ?? '0';
    const hashBase = `${updatedAt}-${count}`;
    const schemaVersion = 'v1'; // change if structure changes
    return crypto
      .createHash('md5')
      .update(`${hashBase}-${schemaVersion}`)
      .digest('hex');
  }

  async saveServiceItems(dto: CreateServiceItems) {
    const { serviceItems } = dto;
    const now = new Date();

    const existingItems = await this.prisma.serviceItem.findMany({
      include: { subServiceItems: true },
    });

    const existingIds = existingItems.map((i) => i.id);

    const itemsToUpdate = serviceItems.filter(
      (item) => existingIds.includes(item.id ?? 0) && !item.markAsDelete,
    );

    const itemsToCreate = serviceItems.filter(
      (item) => !existingIds.includes(item.id ?? 0) && !item.markAsDelete,
    );

    const itemsToDelete = serviceItems.filter(
      (item) => item.markAsDelete && existingIds.includes(item.id ?? 0),
    );

    await this.prisma.$transaction(async (tx) => {
      // --- UPDATE EXISTING ITEMS ---
      for (const item of itemsToUpdate) {
        await tx.serviceItem.update({
          where: { id: item.id },
          data: {
            title: item.title,
            description: item.description,
            priceMin: item.priceMin,
            priceMax: item.priceMax,
            ratePerKm: item.ratePerKm,
            iconName: item.iconName,
            iconColor: item.iconColor,
            iconTextColor: item.iconTextColor,
            status: item.status,
          },
        });

        // Handle subservices manually
        if (item.subServices?.length) {
          const existingSubs = await tx.subServiceItem.findMany({
            where: { serviceItemId: item.id },
          });

          const existingSubIds = existingSubs.map((s) => s.id);

          const subsToUpdate = item.subServices.filter(
            (s) => existingSubIds.includes(s.id ?? 0) && !s.markAsDelete,
          );
          const subsToCreate = item.subServices.filter(
            (s) => !existingSubIds.includes(s.id ?? 0) && !s.markAsDelete,
          );
          const subsToDelete = item.subServices.filter(
            (s) => s.markAsDelete && existingSubIds.includes(s.id ?? 0),
          );

          // Update existing subs
          for (const sub of subsToUpdate) {
            await tx.subServiceItem.update({
              where: { id: sub.id },
              data: {
                title: sub.title,
                description: sub.description,
                cost: Number(sub.cost ?? 0),
                fee: Number(sub.fee ?? 0),
                iconName: sub.iconName,
                iconTextColor: sub.iconTextColor,
                status: sub.status ?? item.status,
              },
            });
          }

          // Create new subs
          for (const sub of subsToCreate) {
            await tx.subServiceItem.create({
              data: {
                serviceItemId: item.id!,
                title: sub.title,
                description: sub.description ?? '',
                cost: Number(sub.cost ?? 0),
                fee: Number(sub.fee ?? 0),
                iconName: sub.iconName,
                iconTextColor: sub.iconTextColor,
                status: sub.status ?? item.status,
              },
            });
          }

          // Soft delete subs
          for (const sub of subsToDelete) {
            await tx.subServiceItem.update({
              where: { id: sub.id },
              data: {
                status: ServiceItemStatus.deleted,
                deletedAt: now,
              },
            });
          }
        }
      }

      // --- CREATE NEW ITEMS ---
      for (const item of itemsToCreate) {
        const created = await tx.serviceItem.create({
          data: {
            title: item.title,
            description: item.description ?? '',
            priceMin: item.priceMin ?? 0,
            priceMax: item.priceMax ?? 0,
            ratePerKm: item.ratePerKm,
            iconName: item.iconName,
            iconColor: item.iconColor,
            iconTextColor: item.iconTextColor,
            status: item.status,
          },
        });

        if (item.subServices?.length) {
          await tx.subServiceItem.createMany({
            data: item.subServices.map((sub) => ({
              serviceItemId: created.id,
              title: sub.title,
              description: sub.description ?? '',
              cost: Number(sub.cost ?? 0),
              fee: Number(sub.fee ?? 0),
              iconName: sub.iconName,
              iconTextColor: sub.iconTextColor,
              status: sub.status ?? item.status,
            })),
          });
        }
      }

      // --- DELETE ITEMS ---
      for (const item of itemsToDelete) {
        await tx.serviceItem.update({
          where: { id: item.id },
          data: {
            status: ServiceItemStatus.deleted,
            deletedAt: now,
          },
        });

        // also delete subservices
        await tx.subServiceItem.updateMany({
          where: { serviceItemId: item.id },
          data: {
            status: ServiceItemStatus.deleted,
            deletedAt: now,
          },
        });
      }
    });

    return { message: 'Service items successfully saved!' };
  }

  async resetDefaults(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) return;

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException('Must be an admin to do this!');
    }

    await this.prisma.$transaction([
      this.prisma.subServiceItem.deleteMany(),
      this.prisma.serviceItem.deleteMany(),
    ]);

    await this.prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "SubServiceItem_id_seq" RESTART WITH 1`,
    );
    await this.prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "ServiceItem_id_seq" RESTART WITH 1`,
    );

    const serviceSeeder = new ServiceItemSeeder();
    const subServiceSeeder = new SubServiceItemSeeder();

    await serviceSeeder.run();
    await subServiceSeeder.run();

    return { success: true, message: 'Reset completed successfully' };
  }
}
