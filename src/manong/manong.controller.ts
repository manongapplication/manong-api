import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  Put,
  Delete,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ManongService } from './manong.service';
import { FetchManongsQueryDto } from './dto/fetch-manongs-query.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateManongDto } from './dto/create-manong.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateManongDto } from './dto/update-manong.dto';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ManongStatus } from '@prisma/client';

@Controller('api/manongs')
export class ManongController {
  constructor(private readonly manongService: ManongService) {}
  private readonly logger = new Logger(ManongController.name);

  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post()
  async index(
    @Body() dto: FetchManongsQueryDto,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const manongs = await this.manongService.fetchVerifiedManongs(
      dto.serviceItemId,
      parseInt(page),
      parseInt(limit),
    );

    return { success: true, data: manongs };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post('all')
  async fetchManongs(
    @Body() dto: FetchManongsQueryDto,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @CurrentUserId() userId: number,
  ) {
    const manongs = await this.manongService.fetchManongs(
      userId,
      dto.serviceItemId,
      parseInt(page),
      parseInt(limit),
    );

    return { success: true, data: manongs };
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    const manong = await this.manongService.findManongById(id);

    return { success: true, data: manong };
  }

  @UseGuards(AppMaintenanceGuard)
  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'skillImage', maxCount: 1 },
        { name: 'nbiImage', maxCount: 1 },
        { name: 'govIdImage', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB per file
          fieldSize: 30 * 1024 * 1024, // 30MB total for all fields
        },
      },
    ),
  )
  async registerManong(
    @UploadedFiles()
    files: {
      skillImage?: Express.Multer.File[];
      nbiImage?: Express.Multer.File[];
      govIdImage?: Express.Multer.File[];
    },
    @Body() dto: CreateManongDto,
  ) {
    this.logger.log(`Registration attempt for: ${dto.email || dto.phone}`);

    // Enhanced file validation
    const validateFile = (
      file: Express.Multer.File | undefined,
      fieldName: string,
    ) => {
      if (!file) {
        throw new BadRequestException(`${fieldName} is required`);
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          `${fieldName} exceeds 10MB limit. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        );
      }

      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `${fieldName} must be JPG, PNG, or PDF. Received: ${file.mimetype}`,
        );
      }

      return file;
    };

    try {
      // Validate all files
      const skillImage = validateFile(files.skillImage?.[0], 'Skill proof');
      const nbiImage = validateFile(files.nbiImage?.[0], 'NBI clearance');
      const govIdImage = validateFile(files.govIdImage?.[0], 'Government ID');

      // Assign validated files to DTO
      dto.skillImage = [skillImage];
      dto.nbiImage = [nbiImage];
      dto.govIdImage = [govIdImage];

      // Log file sizes for debugging
      this.logger.debug(
        `File sizes - Skill: ${skillImage.size} bytes, NBI: ${nbiImage.size} bytes, GovID: ${govIdImage.size} bytes`,
      );

      const result = await this.manongService.registerManong(dto);

      return {
        success: true,
        data: result,
        message:
          "Registration successful! We'll notify you via email/SMS once your application has been reviewed.",
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Put(':id')
  async updateManong(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManongDto,
  ) {
    const result = await this.manongService.updateManong(id, dto);
    return {
      success: true,
      data: result,
      message: 'Manong successfully updated!',
    };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Delete(':id')
  async deleteManong(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.manongService.deleteManong(userId, id);

    return {
      success: true,
      data: result,
      message: 'Manong successfully deleted',
    };
  }

  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post('bulk-delete')
  async bulkDelete(
    @CurrentUserId() userId: number,
    @Body('ids') ids: number[],
  ) {
    if (!Array.isArray(ids) || ids.length == 0) {
      throw new Error('Please provide an array of Manong IDs.');
    }

    const result = await this.manongService.bulkDeleteManongs(userId, ids);

    return {
      success: true,
      data: result,
      message: 'Manongs with IDs successfully deleted.',
    };
  }

  @Post('with-stats')
  @UseGuards(JwtAuthGuard)
  async getAllManongsWithStats(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const result = await this.manongService.getAllManongsWithStats(
      userId,
      parseInt(page),
      parseInt(limit),
      search,
    );

    return {
      success: true,
      data: result?.data, // Wrap the data
      totalCount: result?.totalCount,
      totalPages: result?.totalPages,
      currentPage: result?.currentPage,
      limit: result?.limit,
    };
  }

  @Get('sub-service-items/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableSubServiceItems() {
    const subServiceItems =
      await this.manongService.getAvailableSubServiceItems();
    return {
      success: true,
      data: subServiceItems,
    };
  }

  @Put(':id/specialities')
  @AdminOnly()
  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  async updateManongSpecialities(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { subServiceItemIds: number[] },
  ) {
    const result = await this.manongService.updateManongSpecialities(
      id,
      dto.subServiceItemIds,
    );

    return {
      success: true,
      data: result,
      message: 'Manong specialities updated successfully!',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('status-update')
  async updateManongStatus(
    @CurrentUserId() userId: number,
    @Body('status') status: ManongStatus,
  ) {
    const result = await this.manongService.updateManongStatus(userId, status);

    return {
      success: true,
      data: result,
      message: 'Status updated!',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('daily-limit/check')
  async checkDailyLimit(
    @CurrentUserId() userId: number,
    @Body('manongId') manongId?: number,
  ) {
    const idToCheck = manongId ? manongId : userId;

    const result = await this.manongService.checkManongDailyLimit(idToCheck);

    return {
      success: true,
      data: {
        ...result,
        canAcceptMore: !result.isReached,
        remainingSlots: Math.max(0, result.limit - result.count),
        message: result.isReached
          ? `User request limit reached. You can still accept jobs. Resets in ${result.timeLeft.hours}h ${result.timeLeft.minutes}m.`
          : `Users can send ${result.limit - result.count} more request(s) today.`,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('daily-limit/status')
  async checkDailyLimitStatus(
    @CurrentUserId() userId: number,
    @Body('manongId') manongId?: number,
  ) {
    const idToCheck = manongId ? manongId : userId;
    const result = await this.manongService.checkManongDailyLimit(idToCheck);

    return {
      success: true,
      data: {
        isReached: result.isReached,
        canAcceptMore: !result.isReached,
        remainingSlots: Math.max(0, result.limit - result.count),
        timeUntilReset: `${result.timeLeft.hours}h ${result.timeLeft.minutes}m ${result.timeLeft.seconds}s`,
        nextReset: result.nextReset,
      },
    };
  }
}
