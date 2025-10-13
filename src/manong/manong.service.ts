import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongDto } from './dto/create-manong.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ServiceRequestService } from 'src/service-request/service-request.service';

@Injectable()
export class ManongService {
  constructor(
    private prisma: PrismaService,
    private readonly serviceRequestService: ServiceRequestService,
  ) {}

  async fetchManongs(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const allManongs = await this.prisma.user.findMany({
      where: {
        role: 'manong',
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
      yearsExperience,
      experienceDescription,
      skillImage,
      nbiImage,
      govIdImage,
    } = dto;
    const manong = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        latitude,
        longitude,
        password,
      },
    });

    const manongProfile = await this.prisma.manongProfile.create({
      data: {
        userId: manong.id,
        yearsExperience,
        experienceDescription,
      },
    });

    const specialitiesData = dto.subServiceItems.map((subServiceId) => ({
      manongProfileId: manongProfile.id,
      subServiceItemId: subServiceId,
    }));

    await this.prisma.manongSpecialities.createMany({
      data: specialitiesData,
    });

    const files = await this.saveManongFiles(manong.id, {
      skillImage,
      nbiImage,
      govIdImage,
    });

    const verificationData: {
      userId: number;
      documentType: string;
      documentUrl: string;
    }[] = [];

    if (files.skillImagePaths && files.skillImagePaths.length > 0) {
      verificationData.push({
        userId: manong.id,
        documentType: 'skillImage',
        documentUrl: files.skillImagePaths[0],
      });
    }

    if (files.nbiImagePaths && files.nbiImagePaths.length > 0) {
      verificationData.push({
        userId: manong.id,
        documentType: 'nbiImage',
        documentUrl: files.nbiImagePaths[0],
      });
    }

    if (files.govIdImagePaths && files.govIdImagePaths.length > 0) {
      verificationData.push({
        userId: manong.id,
        documentType: 'govIdImage',
        documentUrl: files.govIdImagePaths[0],
      });
    }

    await this.prisma.providerVerification.createMany({
      data: verificationData,
    });

    return {
      manong,
      manongProfile,
      verificationData,
    };
  }

  // -- For Manong Registration (Future)
  // return this.prisma.$transaction(async (tx) => {
  //   const manong = await tx.user.create(...);
  //   const manongProfile = await tx.manongProfile.create(...);
  //   await tx.manongSpecialities.createMany(...);
  //   await tx.providerVerification.createMany(...);
  //   return { manong, manongProfile, verificationData };
  // });
}
