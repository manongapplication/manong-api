import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReferralCodeUsageDto } from './dto/create-referral-code-usage.dto';

@Injectable()
export class ReferralCodeUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async createUsage(dto: CreateReferralCodeUsageDto) {
    return await this.prisma.referralCodeUsage.create({
      data: {
        referralCodeId: dto.referralCodeId!,
        userId: dto.userId,
        deviceId: dto.deviceId,
      },
    });
  }

  async checkIfUsageExists(referralCodeId: number, deviceId: string) {
    const check = await this.prisma.referralCodeUsage.findFirst({
      where: {
        referralCodeId,
        deviceId,
      },
    });

    // If check exists, return true (usage exists)
    // If check is null, return false (no usage exists)
    return !!check;
  }
}
