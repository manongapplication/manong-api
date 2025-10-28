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
} from '@nestjs/common';
import { ManongService } from './manong.service';
import { FetchManongsQueryDto } from './dto/fetch-manongs-query.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateManongDto } from './dto/create-manong.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateManongDto } from './dto/update-manong.dto';

@Controller('api/manongs')
export class ManongController {
  constructor(private readonly manongService: ManongService) {}

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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
          fileSize: 5 * 1024 * 1024,
          fieldSize: 10 * 1024 * 1024,
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
    dto.skillImage = files.skillImage;
    dto.nbiImage = files.nbiImage;
    dto.govIdImage = files.govIdImage;

    const result = await this.manongService.registerManong(dto);

    return {
      success: true,
      data: result,
      message:
        "Registration successful! We'll notify you via the email you provided once your application has been reviewed.",
    };
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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
}
