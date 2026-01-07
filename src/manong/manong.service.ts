import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongDto } from './dto/create-manong.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import {
  AccountStatus,
  ManongStatus,
  ServiceRequestStatus,
  UserRole,
} from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { UpdateManongDto } from './dto/update-manong.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ManongService {
  constructor(
    private prisma: PrismaService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly userService: UserService,
  ) {}

  async checkManongDailyLimit(manongId: number): Promise<{
    isReached: boolean;
    timeLeft: {
      hours: number;
      minutes: number;
      seconds: number;
    };
    count: number;
    limit: number;
    nextReset: Date;
  }> {
    // Get manong's daily limit
    const manong = await this.prisma.user.findUnique({
      where: {
        id: manongId,
        role: UserRole.manong,
      },
      select: {
        manongProfile: {
          select: {
            dailyServiceLimit: true,
          },
        },
      },
    });

    if (!manong) {
      throw new NotFoundException(`Manong with ID ${manongId} not found`);
    }

    const dailyLimit = manong.manongProfile?.dailyServiceLimit ?? 5;

    // Get today's service count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await this.prisma.serviceRequest.count({
      where: {
        manongId: manongId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate time until reset (midnight)
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);

    const timeDiff = nextReset.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return {
      isReached: todayCount >= dailyLimit,
      timeLeft: {
        hours,
        minutes,
        seconds,
      },
      count: todayCount,
      limit: dailyLimit,
      nextReset,
    };
  }

  async checkMultipleManongsDailyLimits(manongIds: number[]): Promise<{
    [manongId: number]: {
      isReached: boolean;
      timeLeft: {
        hours: number;
        minutes: number;
        seconds: number;
      };
      count: number;
      limit: number;
      nextReset: Date;
    };
  }> {
    if (manongIds.length === 0) {
      return {};
    }

    // Get manongs' daily limits
    const manongs = await this.prisma.user.findMany({
      where: {
        id: { in: manongIds },
        role: UserRole.manong,
      },
      select: {
        id: true,
        manongProfile: {
          select: {
            dailyServiceLimit: true,
          },
        },
      },
    });

    // Create a map of manongId -> dailyLimit
    const limitMap = new Map(
      manongs.map((m) => [m.id, m.manongProfile?.dailyServiceLimit ?? 5]),
    );

    // Get today's service counts for all manongs
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyCounts = await this.prisma.serviceRequest.groupBy({
      by: ['manongId'],
      where: {
        manongId: { in: manongIds },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: {
        id: true,
      },
    });

    // Create count map
    const countMap = new Map(
      dailyCounts.map((item) => [item.manongId, item._count.id]),
    );

    // Calculate time until reset (midnight)
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);

    const timeDiff = nextReset.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // Build result object
    const result: {
      [manongId: number]: {
        isReached: boolean;
        timeLeft: { hours: number; minutes: number; seconds: number };
        count: number;
        limit: number;
        nextReset: Date;
      };
    } = {};

    for (const manongId of manongIds) {
      const limit = limitMap.get(manongId) ?? 5;
      const count = countMap.get(manongId) ?? 0;

      result[manongId] = {
        isReached: count >= limit,
        timeLeft: { hours, minutes, seconds },
        count,
        limit,
        nextReset: new Date(nextReset),
      };
    }

    return result;
  }

  async fetchVerifiedManongsWithLimitInfo(
    serviceItemId?: number,
    page = 1,
    limit = 10,
  ) {
    const manongs = await this.fetchVerifiedManongs(serviceItemId, page, limit);

    if (manongs.length === 0) {
      return {
        manongs: [],
        limitInfo: {},
      };
    }

    const manongIds = manongs.map((m) => m.id);
    const limitInfo = await this.checkMultipleManongsDailyLimits(manongIds);

    return {
      manongs,
      limitInfo,
    };
  }

  async fetchVerifiedManongs(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Step 1: Fetch manongs with their daily limits
    const manongsWithLimits = await this.prisma.user.findMany({
      where: {
        role: UserRole.manong,
        ...(serviceItemId && {
          manongProfile: {
            manongSpecialities: {
              some: { subServiceItem: { serviceItemId } },
            },
            status: {
              in: [ManongStatus.available, ManongStatus.busy],
            },
          },
        }),
        status: AccountStatus.verified,
        deletedAt: null,
      },
      select: {
        id: true,
        manongProfile: {
          select: {
            dailyServiceLimit: true,
          },
        },
      },
      skip,
      take: limit * 2, // Fetch extra to account for filtering
    });

    if (manongsWithLimits.length === 0) {
      return [];
    }

    // Step 2: Batch check daily service counts for all manongs
    const manongIds = manongsWithLimits.map((manong) => manong.id);

    // Create a batch query to get today's service counts for all manongs
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyCounts = await this.prisma.serviceRequest.groupBy({
      by: ['manongId'],
      where: {
        manongId: { in: manongIds },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: {
        id: true,
      },
    });

    // Convert to a map for easy lookup
    const countMap = new Map(
      dailyCounts.map((item) => [item.manongId, item._count.id]),
    );

    // Step 3: Filter manongs who haven't reached their daily limit
    const filteredManongIds = manongsWithLimits
      .filter((manong) => {
        const dailyCount = countMap.get(manong.id) || 0;
        const dailyLimit = manong.manongProfile?.dailyServiceLimit ?? 5;
        return dailyCount < dailyLimit;
      })
      .map((manong) => manong.id);

    if (filteredManongIds.length === 0) {
      return [];
    }

    // Step 4: Fetch full details for filtered manongs
    const filteredManongs = await this.prisma.user.findMany({
      where: {
        id: { in: filteredManongIds },
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
      orderBy: { id: 'asc' },
    });

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

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can access all manongs');
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
      orderBy: { createdAt: 'desc' },
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

    if (!dto.password) throw new BadRequestException('Password is required');

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
        ...(dto.password
          ? { password: await bcrypt.hash(dto.password, 10) }
          : {}),
        role: UserRole.manong,
        addressLine,
        status: AccountStatus.onHold,
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

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
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
        dailyServiceLimit: dto.dailyServiceLimit,
        isProfessionallyVerified: dto.isProfessionallyVerified,
      },
    });

    if (dto.subServiceItemIds && Array.isArray(dto.subServiceItemIds)) {
      await this.updateManongSpecialities(id, dto.subServiceItemIds);
    }

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

  async getManongStats(manongId: number) {
    // Get completed service requests count
    const completedCount = await this.prisma.serviceRequest.count({
      where: {
        manongId: manongId,
        status: ServiceRequestStatus.completed,
      },
    });

    // Get average rating from feedback
    const feedbackAggregate = await this.prisma.feedback.aggregate({
      where: {
        revieweeId: manongId,
        rating: { not: undefined },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const averageRating = feedbackAggregate._avg.rating || 0;
    const ratingCount = feedbackAggregate._count.rating || 0;

    return {
      completedServices: completedCount,
      averageRating: averageRating,
      ratingCount: ratingCount,
    };
  }

  async getAllManongsWithStats(
    userId: number,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const user = await this.userService.findById(userId);

    if (!user) return;

    let isAdmin = false;

    if (user.role == UserRole.admin) {
      isAdmin = true;
    }

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can access all manongs');
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: UserRole.manong,
      deletedAt: null,
    };

    // Add search filter if provided
    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch manongs (users with role 'manong')
    const manongs = await this.prisma.user.findMany({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
      orderBy: { createdAt: 'desc' },
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
      take: limit,
    });

    // For each manong, fetch their stats
    const manongsWithStats = await Promise.all(
      manongs.map(async (manong) => {
        const stats = await this.getManongStats(manong.id);

        return {
          ...manong,
          stats: {
            completedServices: stats.completedServices,
            averageRating: stats.averageRating,
            ratingCount: stats.ratingCount,
          },
        };
      }),
    );

    // Get total count for pagination
    const totalCount = await this.prisma.user.count({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where,
    });

    return {
      data: manongsWithStats,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    };
  }

  // In manong.service.ts, add these methods:
  async updateManongSpecialities(
    manongId: number,
    subServiceItemIds: number[],
  ) {
    // Find manong profile
    const manong = await this.prisma.user.findUnique({
      where: { id: manongId },
      include: { manongProfile: true },
    });

    if (!manong || !manong.manongProfile) {
      throw new NotFoundException(`Manong with ID ${manongId} not found`);
    }

    const manongProfileId = manong.manongProfile.id;

    // Delete existing specialities
    await this.prisma.manongSpecialities.deleteMany({
      where: { manongProfileId },
    });

    // Create new specialities
    if (subServiceItemIds.length > 0) {
      await this.prisma.manongSpecialities.createMany({
        data: subServiceItemIds.map((subServiceItemId) => ({
          manongProfileId,
          subServiceItemId,
        })),
      });
    }

    // Return updated manong with specialities
    return this.findManongById(manongId);
  }

  async getAvailableSubServiceItems() {
    return this.prisma.subServiceItem.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      include: {
        serviceItem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        {
          serviceItemId: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  async updateManongStatus(userId: number, status: ManongStatus) {
    const user = await this.userService.isManong(userId);

    if (!user) {
      throw new BadGatewayException('User is not manong!');
    }

    return await this.prisma.user.update({
      where: {
        id: userId,
        role: UserRole.manong,
      },
      data: {
        manongProfile: {
          update: {
            status: status,
          },
        },
      },
    });
  }
}
