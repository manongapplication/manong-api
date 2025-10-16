import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProviderVerificationDto } from './dto/create-provider-verification.dto';

@Injectable()
export class ProviderVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createProviderVerification(
    userId: number,
    dto: CreateProviderVerificationDto,
  ) {
    const created = await this.prisma.providerVerification.create({
      data: {
        userId,
        documentType: dto.documentType,
        documentUrl: dto.documentUrl,
        status: dto.status,
      },
    });

    return created;
  }
}
