import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateImageUploadDto } from './dto/create-image-upload.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ImageUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadImage(dto: CreateImageUploadDto) {
    if (!dto.images || dto.images.length < 1 || dto.images.length > 3) {
      throw new BadRequestException(
        'You must upload between 1 and 3 images to continue.',
      );
    }

    const attachments: any = [];

    for (const file of dto.images) {
      const dest = join(
        'uploads',
        'service_requests',
        String(dto.serviceRequestId),
      );
      await fs.mkdir(dest, { recursive: true });
      const filePath = join(dest, `${Date.now()}-${file.originalname}`);
      await fs.writeFile(filePath, file.buffer);

      const attachment = await this.prisma.attachment.create({
        data: {
          messageId: dto.messageId,
          type: 'image',
          url: filePath,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      attachments.push(attachment);
    }

    // **Trigger socket emission**
    this.eventEmitter.emit('chat.message.updated', {
      messageId: dto.messageId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      attachments,
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      attachments,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      count: attachments.length,
    };
  }
}
