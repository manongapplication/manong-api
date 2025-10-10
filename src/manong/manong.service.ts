import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateManongDto } from './dto/create-manong.dto';
import { join } from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ManongService {
  constructor(private prisma: PrismaService) {}

  async fetchManongs(serviceItemId?: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const manongs = this.prisma.user.findMany({
      where: {
        role: 'manong',
        ...(serviceItemId && {
          manongProfile: {
            some: {
              manongSpecialities: {
                some: { subServiceItem: { serviceItemId } },
              },
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
      take: limit,
    });

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

  async registerManong(userId: number, dto: CreateManongDto) {
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

    const files = await this.saveManongFiles(userId, {
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
        userId,
        documentType: 'skillImage',
        documentUrl: files.skillImagePaths[0],
      });
    }

    if (files.nbiImagePaths && files.nbiImagePaths.length > 0) {
      verificationData.push({
        userId,
        documentType: 'nbiImage',
        documentUrl: files.nbiImagePaths[0],
      });
    }

    if (files.govIdImagePaths && files.govIdImagePaths.length > 0) {
      verificationData.push({
        userId,
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
}
