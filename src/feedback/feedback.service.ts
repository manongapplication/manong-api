import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async findByServiceRequestId(serviceRequestId: number) {
    const result = await this.prisma.feedback.findUnique({
      where: { serviceRequestId },
    });

    return result;
  }

  async createFeedbackByServiceRequestId(
    userId: number,
    dto: CreateFeedbackDto,
  ) {
    const exists = await this.findByServiceRequestId(dto.serviceRequestId);

    if (exists) {
      return await this.prisma.feedback.update({
        where: { serviceRequestId: dto.serviceRequestId },
        data: {
          rating: dto.rating,
          comment: dto.comment,
          attachmentsPath: dto.attachmentsPath,
        },
      });
    }

    return await this.prisma.feedback.create({
      data: {
        serviceRequestId: dto.serviceRequestId,
        reviewerId: userId,
        revieweeId: dto.revieweeId,
        rating: dto.rating,
        comment: dto.comment,
        attachmentsPath: dto.attachmentsPath,
      },
    });
  }
}
