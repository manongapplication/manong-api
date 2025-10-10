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
} from '@nestjs/common';
import { ManongService } from './manong.service';
import { FetchManongsQueryDto } from './dto/fetch-manongs-query.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateManongDto } from './dto/create-manong.dto';

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
    const manongs = await this.manongService.fetchManongs(
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
    FileFieldsInterceptor([
      { name: 'skillImage', maxCount: 1 },
      { name: 'nbiImage', maxCount: 1 },
      { name: 'govIdImage', maxCount: 1 },
    ]),
  )
  async registerManong(
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
        'Registration successful. Your profile and documents have been submitted for review.',
    };
  }
}
