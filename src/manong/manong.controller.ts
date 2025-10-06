import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { ManongService } from './manong.service';
import { FetchManongsQueryDto } from './dto/fetch-manongs-query.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';

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
}
