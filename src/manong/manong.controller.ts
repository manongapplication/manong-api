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
} from '@nestjs/common';
import { ManongService } from './manong.service';
import { FetchManongsQueryDto } from './dto/fetch-manongs-query.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateManongDto } from './dto/create-manong.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('api/manongs')
export class ManongController {
  constructor(private readonly manongService: ManongService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async index(
    @Body() dto: FetchManongsQueryDto,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @CurrentUserId() userId: number,
  ) {
    const manongs = await this.manongService.fetchVerifiedManongs(
      userId,
      parseInt(page),
      parseInt(limit),
      dto.serviceItemId,
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
}
