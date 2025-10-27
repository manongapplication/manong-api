import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
  BadGatewayException,
} from '@nestjs/common';
import { JwtAuthGuard } from './guard/jwt.guard';
import type { Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { LoginDto } from './dto/login.dto';

interface RequestWithUser extends Request {
  user: { id: number };
}

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerNumber(dto);
  }

  @Post('register-instant')
  async registerInstant(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-sms')
  async verifySms(@Body() dto: RegisterDto) {
    return this.authService.verifySms(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    return this.authService.me(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) throw new UnauthorizedException();

    this.authService.revokeToken(token);

    return { message: 'Logged out' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('edit-profile')
  async update(@CurrentUserId() userId, @Body() dto: UpdateUserDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const updated = await this.authService.updateUser(userId, dto);
    return { success: true, data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Post('fcmToken')
  async updateFcmToken(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    if (dto.fcmToken == null) {
      throw new BadGatewayException('Please input fcmtoken!');
    }

    const result = await this.authService.saveFcmToken(userId, dto.fcmToken);

    return {
      success: true,
      data: result,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }
}
