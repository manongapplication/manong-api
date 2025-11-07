import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UrgencyLevelSeeder } from 'prisma/seeders/urgency-level.seeder';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateUrgencyLevel } from './dto/create-urgency-level.dto';

@Injectable()
export class UrgencyLevelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async fetchUrgencyLevels() {
    const result = await this.prisma.urgencyLevel.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return result;
  }

  async updateUrgencyLevel(
    userId: number,
    id: number,
    updateData: CreateUrgencyLevel,
  ) {
    // Verify user is admin
    const user = await this.userService.findById(userId);
    if (!user || user.role !== UserRole.admin) {
      throw new UnauthorizedException(
        'Must be an admin to update urgency levels!',
      );
    }

    // Check if urgency level exists
    const existingUrgencyLevel = await this.prisma.urgencyLevel.findUnique({
      where: { id },
    });

    if (!existingUrgencyLevel) {
      throw new NotFoundException(`Urgency level with ID ${id} not found`);
    }

    // Validate the data
    if (!updateData.level || updateData.level.trim() === '') {
      throw new BadRequestException('Level name is required');
    }

    // Prepare data for update
    const dataToUpdate: any = {
      level: updateData.level.trim(),
    };

    // Handle time field (can be null/empty)
    if (updateData.time !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      dataToUpdate.time = updateData.time?.trim() || null;
    }

    // Handle price field (can be null/empty)
    if (updateData.price !== undefined) {
      if (updateData.price === null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dataToUpdate.price = null;
      } else {
        // Convert string price to number if needed
        const priceValue =
          typeof updateData.price === 'string'
            ? parseFloat(updateData.price)
            : updateData.price;

        if (isNaN(priceValue) || priceValue < 0) {
          throw new BadRequestException(
            'Price must be a valid non-negative number',
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        dataToUpdate.price = priceValue;
      }
    }

    // Update the urgency level
    const updatedUrgencyLevel = await this.prisma.urgencyLevel.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: dataToUpdate,
    });

    return updatedUrgencyLevel;
  }

  async resetDefaults(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) return;

    if (user.role !== UserRole.admin) {
      throw new UnauthorizedException('Must be an admin to do this!');
    }

    await this.prisma.urgencyLevel.deleteMany();

    const urgencyLevelSeeder = new UrgencyLevelSeeder();

    await urgencyLevelSeeder.run();

    return { success: true, message: 'Reset completed successfully' };
  }
}
