import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongDto } from './dto/create-manong.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { AccountStatus, ManongStatus, UserRole } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { UpdateManongDto } from './dto/update-manong.dto';

@Injectable()
export class ManongService {
  constructor(
    private prisma: PrismaService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly userService: UserService,
  ) {}

  async fetchVerifiedManongs(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const allManongs = await this.prisma.user.findMany({
      where: {
        role: UserRole.manong,
        ...(serviceItemId && {
          manongProfile: {
            manongSpecialities: {
              some: { subServiceItem: { serviceItemId } },
            },
          },
        }),
        status: AccountStatus.verified,
      },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: {
              include: {
                subServiceItem: true,
              },
            },
          },
        },
      },
      skip,
      take: limit * 2,
    });

    const filteredManongs = (
      await Promise.all(
        allManongs.map(async (manong) => {
          const count = await this.serviceRequestService.findByManongIdAndCount(
            manong.id,
          );

          return count < (manong.manongProfile?.dailyServiceLimit ?? 5)
            ? manong
            : null;
        }),
      )
    ).filter(Boolean);

    return filteredManongs;
  }

  async fetchManongs(
    userId: number,
    serviceItemId?: number,
    page = 1,
    limit = 10,
  ) {
    const user = await this.userService.findById(userId);

    if (!user) return;

    let isAdmin = false;

    if (user.role == UserRole.admin) {
      isAdmin = true;
    }
    const skip = (page - 1) * limit;

    const allManongs = await this.prisma.user.findMany({
      where: {
        role: UserRole.manong,
        ...(serviceItemId && {
          manongProfile: {
            manongSpecialities: {
              some: { subServiceItem: { serviceItemId } },
            },
          },
        }),
      },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: {
              include: {
                subServiceItem: true,
              },
            },
            manongAssistants: true,
          },
        },
        providerVerifications: isAdmin,
      },
      skip,
      take: limit * 2,
    });

    const filteredManongs = (
      await Promise.all(
        allManongs.map(async (manong) => {
          const count = await this.serviceRequestService.findByManongIdAndCount(
            manong.id,
          );

          return count < (manong.manongProfile?.dailyServiceLimit ?? 5)
            ? manong
            : null;
        }),
      )
    ).filter(Boolean);

    return filteredManongs;
  }

  async fetchManongsRaw(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Pass ISO strings (still fine)
    const startISO = startOfToday.toISOString();
    const endISO = endOfToday.toISOString();

    const query = `
      SELECT u.*
      FROM "User" u
      LEFT JOIN "ServiceRequest" sr
        ON sr."manongId" = u.id
        AND sr."createdAt" >= $1::timestamp
        AND sr."createdAt" < $2::timestamp
      ${
        serviceItemId
          ? `
      INNER JOIN "ManongProfile" mp ON mp."userId" = u.id
      INNER JOIN "ManongSpecialities" ms ON ms."manongProfileId" = mp.id
      INNER JOIN "SubServiceItem" ssi ON ssi.id = ms."subServiceItemId"
      `
          : ''
      }
      WHERE u."role" = 'manong'
      ${serviceItemId ? 'AND ssi."serviceItemId" = $5' : ''}
      GROUP BY u.id
      HAVING COUNT(sr.id) < 5
      ORDER BY u.id ASC
      LIMIT $3 OFFSET $4
    `;

    const params = serviceItemId
      ? [startISO, endISO, limit, skip, serviceItemId]
      : [startISO, endISO, limit, skip];

    const manongs = await this.prisma.$queryRawUnsafe(query, ...params);

    console.log(JSON.stringify(manongs));

    return manongs;
  }

  async findManongById(id: number) {
    return this.prisma.user.findFirst({
      where: { id, role: 'manong' },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: {
              include: {
                subServiceItem: true,
              },
            },
            manongAssistants: true,
          },
        },
      },
    });
  }

  async saveManongFiles(
    userId: number,
    files: {
      skillImage?: Express.Multer.File[];
      nbiImage?: Express.Multer.File[];
      govIdImage?: Express.Multer.File[];
    },
  ) {
    const savedPaths = {
      skillImagePaths: [] as string[],
      nbiImagePaths: [] as string[],
      govIdImagePaths: [] as string[],
    };

    if (files.skillImage && files.skillImage.length > 0) {
      const dest = join('uploads', 'manong', String(userId), 'skill');
      await fs.mkdir(dest, { recursive: true });

      for (const file of files.skillImage) {
        const filePath = join(dest, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        savedPaths.skillImagePaths.push(filePath);
      }
    }

    if (files.nbiImage && files.nbiImage.length > 0) {
      const dest = join('uploads', 'manong', String(userId), 'nbi');
      await fs.mkdir(dest, { recursive: true });

      for (const file of files.nbiImage) {
        const filePath = join(dest, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        savedPaths.nbiImagePaths.push(filePath);
      }
    }

    if (files.govIdImage && files.govIdImage.length > 0) {
      const dest = join('uploads', 'manong', String(userId), 'govId');
      await fs.mkdir(dest, { recursive: true });

      for (const file of files.govIdImage) {
        const filePath = join(dest, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        savedPaths.govIdImagePaths.push(filePath);
      }
    }

    return savedPaths;
  }

  async registerManong(dto: CreateManongDto) {
    const {
      firstName,
      lastName,
      email,
      phone,
      latitude,
      longitude,
      password,
      confirmPassword,
      yearsExperience,
      experienceDescription,
      skillImage,
      nbiImage,
      govIdImage,
      addressLine,
    } = dto;

    if (password != confirmPassword) {
      throw new BadRequestException(
        'Password and confirmation password do not match.',
      );
    }

    // Check phone uniqueness
    const exists = await this.prisma.user.findUnique({ where: { phone } });
    if (exists)
      throw new BadRequestException('Phone number is already registered.');

    // Optional email check
    if (email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { email },
      });
      if (emailExists) {
        throw new BadRequestException('Email is already registered.');
      }
    }

    if (!skillImage) throw new BadGatewayException('Skill image is missing.');
    if (!nbiImage) throw new BadGatewayException('NBI image is missing.');
    if (!govIdImage)
      throw new BadGatewayException('Government ID image is missing.');

    const manong = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        latitude,
        longitude,
        password,
        role: UserRole.manong,
        addressLine,
      },
    });

    const manongProfile = await this.prisma.manongProfile.create({
      data: {
        userId: manong.id,
        yearsExperience,
        experienceDescription,
      },
    });

    if (dto.subServiceItems?.length) {
      await this.prisma.manongSpecialities.createMany({
        data: dto.subServiceItems.map((subServiceId) => ({
          manongProfileId: manongProfile.id,
          subServiceItemId: Number(subServiceId),
        })),
      });
    }

    const files = await this.saveManongFiles(manong.id, {
      skillImage,
      nbiImage,
      govIdImage,
    });

    const verificationData = [
      ...files.skillImagePaths.map((p) => ({
        userId: manong.id,
        documentType: 'skillImage',
        documentUrl: p,
      })),

      ...files.nbiImagePaths.map((p) => ({
        userId: manong.id,
        documentType: 'nbiImage',
        documentUrl: p,
      })),

      ...files.govIdImagePaths.map((p) => ({
        userId: manong.id,
        documentType: 'govIdImage',
        documentUrl: p,
      })),
    ];

    if (verificationData.length) {
      await this.prisma.providerVerification.createMany({
        data: verificationData,
      });
    }

    if (dto.assistants && dto.assistants.length > 0) {
      await this.prisma.manongAssistant.createMany({
        data: dto.assistants.map((assistant) => ({
          manongProfileId: manongProfile.id,
          fullName: assistant.fullName,
          phone: assistant.phone || null,
        })),
      });
    }

    return {
      manong,
      manongProfile,
      verificationData,
    };
  }

  async updateManong(id: number, dto: UpdateManongDto) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new BadGatewayException('Manong not found!');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        latitude: dto.latitude,
        longitude: dto.longitude,
        password: dto.password,
        addressLine: dto.addressLine,
        status: dto.status,
      },
    });

    await this.prisma.manongProfile.update({
      where: { userId: updated.id },
      data: {
        yearsExperience: dto.yearsExperience,
        experienceDescription: dto.experienceDescription,
      },
    });

    return updated;
  }

  async deleteManong(userId: number, id: number) {
    const now = new Date();

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new BadGatewayException('User not logged in!');
    }

    if (user.role != UserRole.admin) {
      throw new BadGatewayException('User is not admin!');
    }

    const manong = await this.prisma.user.findUnique({
      where: { id },
      include: {
        manongProfile: {
          include: { manongSpecialities: true, manongAssistants: true },
        },
      },
    });

    if (!manong) {
      throw new NotFoundException(`Manong with ID ${id} not found`);
    }

    const manongId = manong.id;

    await this.prisma.user.update({
      where: { id: manongId },
      data: { deletedAt: now, status: AccountStatus.deleted },
    });

    if (manong.manongProfile) {
      const manongProfile = await this.prisma.manongProfile.update({
        where: { userId: manongId },
        data: { deletedAt: now, status: ManongStatus.deleted },
      });

      const manongProfileId = manongProfile.id;

      await this.prisma.manongSpecialities.updateMany({
        where: { manongProfileId },
        data: {
          deletedAt: now,
        },
      });

      await this.prisma.manongAssistant.updateMany({
        where: { manongProfileId },
        data: {
          deletedAt: now,
        },
      });
    }

    return { id };
  }

  async bulkDeleteManongs(userId: number, ids: number[]) {
    const now = new Date();

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new BadGatewayException('User not logged in!');
    }

    if (user.role != UserRole.admin) {
      throw new BadGatewayException('User is not admin!');
    }

    const manongs = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      include: {
        manongProfile: {
          include: {
            manongSpecialities: true,
            manongAssistants: true,
          },
        },
      },
    });

    if (!manongs.length) {
      throw new NotFoundException('No Manongs found for given IDs');
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: now, status: AccountStatus.deleted },
    });

    const profileIds = manongs
      .map((u) => u.manongProfile?.id)
      .filter((id): id is number => !!id);

    if (profileIds.length) {
      await this.prisma.manongProfile.updateMany({
        where: { id: { in: profileIds } },
        data: { deletedAt: now, status: ManongStatus.deleted },
      });

      await this.prisma.manongSpecialities.updateMany({
        where: { id: { in: profileIds } },
        data: { deletedAt: now },
      });

      await this.prisma.manongAssistant.updateMany({
        where: { id: { in: profileIds } },
        data: { deletedAt: now },
      });
    }

    return { deletedCount: manongs.length, ids };
  }
}
