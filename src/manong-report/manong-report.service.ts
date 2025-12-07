import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateManongReportDto } from './dto/create-manong-report.dto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UpdateManongReportDto } from './dto/update-manong-report';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class ManongReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly serviceRequestService: ServiceRequestService,
  ) {}

  private readonly logger = new Logger(ManongReportService.name);

  async fetchManongReports(userId: number) {
    const user = await this.userService.isAdmin(userId);

    if (!user) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.manongReport.findMany({
      include: {
        serviceRequest: {
          include: {
            user: true,
            manong: true,
          },
        },
      },
    });
  }

  async fetchManongReportsByManongId(manongId: number) {
    const manong = await this.userService.isManong(manongId);

    if (!manong) {
      throw new BadGatewayException('User is not manong!');
    }

    return await this.prisma.manongReport.findMany({
      where: { manongId },
    });
  }

  async createManongReport(userId: number, dto: CreateManongReportDto) {
    const manong = await this.userService.isManong(userId);
    if (!manong) {
      throw new BadGatewayException('User is not manong!');
    }

    if (!dto.images || dto.images.length < 1 || dto.images.length > 3) {
      throw new BadGatewayException(
        'You must upload between 1 and 3 images to continue.',
      );
    }

    const request = await this.serviceRequestService.findById(
      dto.serviceRequestId,
    );

    if (!request) {
      throw new NotFoundException('Service request not found!');
    }

    const dtoIsPaid =
      dto.servicePaid == true ? PaymentStatus.paid : PaymentStatus.pending;

    if (request.paymentStatus != dtoIsPaid) {
      await this.serviceRequestService.updateServiceRequestPaymentStatus(
        request.id,
        dtoIsPaid,
      );
    }

    // Save uploaded images
    const imagePaths: string[] = [];
    for (const file of dto.images) {
      const dest = join(
        'uploads',
        'manong_reports',
        String(dto.serviceRequestId),
      );
      await fs.mkdir(dest, { recursive: true });
      const filePath = join(dest, file.originalname);
      await fs.writeFile(filePath, file.buffer);
      imagePaths.push(filePath);
    }

    return await this.prisma.manongReport.create({
      data: {
        serviceRequestId: dto.serviceRequestId,
        manongId: dto.manongId,
        summary: dto.summary,
        details: dto.details,
        materialsUsed: dto.materialsUsed,
        laborDuration: dto.laborDuration,
        imagesPath: JSON.stringify(imagePaths),
        issuesFound: dto.issuesFound,
        customerPresent: dto.customerPresent,
        verifiedByUser: dto.verfiedByUser,
        totalCost: dto.totalCost,
        warrantyInfo: dto.warrantyInfo,
        recommendations: dto.recommendations,
      },
    });
  }

  async updateManongReport(
    userId: number,
    id: number,
    dto: UpdateManongReportDto,
  ) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.role != UserRole.admin && user.role != UserRole.manong) {
      throw new BadGatewayException('User is not manong!');
    }

    // Check if report exists
    const existingReport = await this.prisma.manongReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      throw new NotFoundException('Manong report not found');
    }

    // Handle images - only require images if they are provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let imagePaths: string[] = existingReport.imagesPath
      ? JSON.parse(existingReport.imagesPath)
      : [];

    if (dto.images && dto.images.length > 0) {
      // Validate image count only if new images are provided
      if (dto.images.length < 1 || dto.images.length > 3) {
        throw new BadRequestException('You must upload between 1 and 3 images');
      }

      // Save new uploaded images
      imagePaths = [];
      for (const file of dto.images) {
        const dest = join(
          'uploads',
          'manong_reports',
          String(existingReport.serviceRequestId),
        );
        await fs.mkdir(dest, { recursive: true });
        const filePath = join(dest, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        imagePaths.push(filePath);
      }
    }
    // If no new images provided, keep the existing images
    const updateData: any = {
      summary: dto.summary,
      details: dto.details,
      materialsUsed: dto.materialsUsed,
      laborDuration: dto.laborDuration,
      imagesPath: JSON.stringify(imagePaths), // Always set imagesPath, even if no new images
      issuesFound: dto.issuesFound,
      customerPresent: dto.customerPresent,
      verifiedByUser: dto.verfiedByUser,
      totalCost: dto.totalCost,
      warrantyInfo: dto.warrantyInfo,
      recommendations: dto.recommendations,
    };

    // Remove undefined fields to avoid overwriting with null
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.keys(updateData).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (updateData[key] === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete updateData[key];
      }
    });

    const result = await this.prisma.manongReport.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
    });

    return result;
  }
}
