import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Get,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompleteProfileUserDto } from './dto/complete-profile-user.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const updatedUser = await this.userService.updateUser(id, dto);
    return { success: true, data: updatedUser };
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  @UseInterceptors(FileInterceptor('validId'))
  async completeProfile(
    @CurrentUserId() userId: number,
    @Body() dto: CompleteProfileUserDto,
    @UploadedFile() validIdImage: Express.Multer.File,
  ) {
    dto.validId = validIdImage;
    const result = await this.userService.completeProfile(userId, dto);

    return {
      success: true,
      data: result,
      message:
        'Profile complete. You’ll be able to use our services once approved.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async fetchManongs(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @CurrentUserId() userId: number,
  ) {
    const users = await this.userService.fetchUsers(
      userId,
      parseInt(page),
      parseInt(limit),
    );

    return { success: true, data: users };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.userService.deleteUser(userId, id);

    return {
      success: true,
      data: result,
      message: 'User successfully deleted',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-delete')
  async bulkDelete(
    @CurrentUserId() userId: number,
    @Body('ids') ids: number[],
  ) {
    if (!Array.isArray(ids) || ids.length == 0) {
      throw new Error('Please provide an array of User IDs.');
    }

    const result = await this.userService.bulkDeleteUsers(userId, ids);

    return {
      success: true,
      data: result,
      message: 'Users with IDs successfully deleted.',
    };
  }
}
