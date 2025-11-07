import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { UpdateAppMaintenance } from './dto/update-app-maintenance.dto';

@Injectable()
export class AppMaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async fetchAppMaintenance() {
    return await this.prisma.appMaintenance.findFirst();
  }

  async updateAppMaintenance(
    userId: number,
    id: number,
    dto: UpdateAppMaintenance,
  ) {
    const { isActive, startTime, endTime, message } = dto;
    const user = await this.userService.findById(userId);

    if (!user) {
      return new NotFoundException('User not found!');
    }

    if (user.role !== UserRole.admin) {
      return new BadGatewayException('User is not admin!');
    }

    return await this.prisma.appMaintenance.update({
      where: { id },
      data: {
        isActive,
        startTime,
        endTime,
        message,
      },
    });
  }

  async getCurrentStatus() {
    return await this.prisma.appMaintenance.findFirst({
      orderBy: { id: 'desc' },
    });
  }
}
