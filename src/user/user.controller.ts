import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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

  @Post()
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
}
