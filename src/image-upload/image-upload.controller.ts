import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateImageUploadDto } from './dto/create-image-upload.dto';
import { ImageUploadService } from './image-upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('api/image-upload')
export class ImageUploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per file
    }),
  )
  async uploadImages(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() body: any, // Use any for now to bypass validation issues
  ) {
    // Manual validation and transformation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const serviceRequestId = parseInt(body.serviceRequestId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const messageId = parseInt(body.messageId);

    // Log for debugging
    console.log('Received request:', {
      serviceRequestId,
      messageId,
      serviceRequestIdType: typeof serviceRequestId,
      messageIdType: typeof messageId,
      imagesCount: images?.length || 0,
      imagesIsArray: Array.isArray(images),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      bodyKeys: Object.keys(body),
    });

    // Manual validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new BadRequestException('At least 1 image is required');
    }

    if (images.length > 3) {
      throw new BadRequestException('Maximum 3 images allowed');
    }

    if (isNaN(serviceRequestId) || isNaN(messageId)) {
      throw new BadRequestException(
        'serviceRequestId and messageId must be valid numbers',
      );
    }

    // Create DTO manually
    const dto: CreateImageUploadDto = {
      images,
      serviceRequestId,
      messageId,
    };

    const result = await this.imageUploadService.uploadImage(dto);

    return {
      success: true,
      data: result,
      message: 'Images uploaded successfully',
    };
  }
}
