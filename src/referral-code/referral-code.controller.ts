import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ReferralCodeService } from './referral-code.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { UpdateReferralCodeDto } from './dto/update-referral-code.dto';
import { ValidateReferralCodeDto } from './dto/validate-referral-code.dto';

@Controller('api/referral-code')
export class ReferralCodeController {
  constructor(private readonly referralCodeService: ReferralCodeService) {}

  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Get()
  async index(@CurrentUserId() userId: number) {
    const result = await this.referralCodeService.fetchCodes(userId);

    return {
      success: true,
      data: result,
      message: 'Referral codes successfully fetched!',
    };
  }

  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateReferralCodeDto,
  ) {
    const result = await this.referralCodeService.createCode(userId, dto);

    return {
      success: true,
      data: result,
      message: 'Referral code created successfully!',
    };
  }

  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Put(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferralCodeDto,
  ) {
    const result = await this.referralCodeService.updateCode(userId, id, dto);

    return {
      success: true,
      data: result,
      message: 'Referral code successfully updated!',
    };
  }

  @UseGuards(JwtAuthGuard, AppMaintenanceGuard)
  @Delete(':id')
  async delete(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.referralCodeService.deleteCode(userId, id);

    return {
      success: true,
      data: result,
      message: 'Referral code successfully deleted!',
    };
  }

  @Post('validate')
  async checkCode(@Body() dto: ValidateReferralCodeDto) {
    const result = await this.referralCodeService.checkCodeAndUsage(dto);

    return {
      success: true,
      data: result,
      message: 'Valid Referral Code.',
    };
  }
}
