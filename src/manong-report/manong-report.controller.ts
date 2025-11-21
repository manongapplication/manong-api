import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ManongReportService } from './manong-report.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateManongReportDto } from './dto/create-manong-report.dto';
import { UpdateManongReportDto } from './dto/update-manong-report';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/manong-report')
export class ManongReportController {
  constructor(private readonly manongReportService: ManongReportService) {}

  @Get()
  async fetchManongReports(@CurrentUserId() userId: number) {
    const result = await this.manongReportService.fetchManongReports(userId);

    return {
      success: true,
      data: result,
      message: 'Manong reports fetched successfully!',
    };
  }

  @Get(':id')
  async fetchManongReportsByManongId(
    @Param('id', ParseIntPipe) userId: number,
  ) {
    const result =
      await this.manongReportService.fetchManongReportsByManongId(userId);

    return {
      success: true,
      data: result,
      message: 'Fetched manong reports by id.',
    };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateManongReportDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    dto.images = images;
    const result = await this.manongReportService.createManongReport(
      userId,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Manong report successfully created.',
    };
  }

  @Post(':id')
  @UseInterceptors(FilesInterceptor('images', 3))
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManongReportDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    dto.images = images;
    const result = await this.manongReportService.updateManongReport(
      userId,
      id,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Manong report successfully updated.',
    };
  }
}
