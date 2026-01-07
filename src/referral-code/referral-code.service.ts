import { BadGatewayException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import { UpdateReferralCodeDto } from './dto/update-referral-code.dto';
import { ReferralCodeUsageService } from 'src/referral-code-usage/referral-code-usage.service';
import { CreateReferralCodeUsageDto } from 'src/referral-code-usage/dto/create-referral-code-usage.dto';
import { ValidateReferralCodeDto } from './dto/validate-referral-code.dto';

@Injectable()
export class ReferralCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly referralCodeUsageService: ReferralCodeUsageService,
  ) {}

  async findByCode(code: string) {
    return await this.prisma.referralCode.findFirst({
      where: {
        code,
      },
    });
  }

  async checkCodeAndUsage(dto: ValidateReferralCodeDto) {
    const check = await this.findByCode(dto.code);

    if (!check) {
      throw new BadGatewayException('Not a valid code!');
    }

    const hasUsed = await this.referralCodeUsageService.checkIfUsageExists(
      check.id,
      dto.deviceId,
    );

    if (hasUsed) {
      throw new BadGatewayException(
        'You have already used this referral code!',
      );
    }

    return check;
  }

  async createUsage(code: string, dto: CreateReferralCodeUsageDto) {
    const validateDto: ValidateReferralCodeDto = {
      code,
      deviceId: dto.deviceId,
    };

    const referralCode = await this.checkCodeAndUsage(validateDto);

    const usageDto: CreateReferralCodeUsageDto = {
      ...dto,
      referralCodeId: referralCode.id,
    };

    return await this.referralCodeUsageService.createUsage(usageDto);
  }

  async fetchCodes(userId: number) {
    const isAdmin = await this.userService.isAdminAndModerator(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.referralCode.findMany({
      include: {
        usages: true,
        owner: true,
      },
    });
  }

  async createCode(userId: number, dto: CreateReferralCodeDto) {
    const isAdmin = await this.userService.isAdminAndModerator(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.referralCode.create({
      data: {
        code: dto.code,
        ownerId: dto.ownerId,
      },
    });
  }

  async updateCode(userId: number, id: number, dto: UpdateReferralCodeDto) {
    const isAdmin = await this.userService.isAdminAndModerator(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.referralCode.update({
      where: { id },
      data: {
        code: dto.code,
        ownerId: dto.ownerId,
      },
    });
  }

  async deleteCode(userId: number, id: number) {
    const isAdmin = await this.userService.isAdminAndModerator(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.referralCode.delete({
      where: { id },
    });
  }
}
