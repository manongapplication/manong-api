import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  BadGatewayException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppPlatform, UpdatePriority } from '@prisma/client';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { CheckUpdateDto } from './dto/check-update.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AppVersionService {
  private readonly logger = new Logger(AppVersionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * Check if user needs to update their app
   */
  async checkUpdate(checkUpdateDto: CheckUpdateDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { platform, currentVersion, currentBuild } = checkUpdateDto;

      // Validate platform
      const platformEnum = this.validatePlatform(platform);

      // Get latest active version for this platform
      const latest = await this.prisma.appVersion.findFirst({
        where: {
          platform: platformEnum,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!latest) {
        this.logger.warn(`No active version found for platform: ${platform}`);
        return {
          updateAvailable: false,
          message: 'No active version configured',
        };
      }

      // Compare versions
      const needsUpdate =
        this.compareVersions(currentVersion, latest.version) < 0;

      // Check if update is mandatory
      const isMandatory = this.isUpdateMandatory(currentVersion, latest);

      // Check if force update date has passed
      const forceUpdateRequired = this.isForceUpdateRequired(latest);

      // Get appropriate store URL
      const storeUrl = this.getStoreUrl(platform, latest);

      this.logger.log(
        `Update check for ${platform} v${currentVersion}: ${needsUpdate ? 'Update available' : 'Up to date'}`,
      );

      return {
        updateAvailable: needsUpdate,
        isMandatory: isMandatory || forceUpdateRequired,
        forceUpdateRequired,
        priority: latest.priority,
        latestVersion: latest.version,
        latestBuild: latest.buildNumber,
        whatsNew: latest.whatsNew,
        releaseNotes: latest.releaseNotes,
        storeUrl,
        forceUpdateDate: latest.forceUpdateDate,
        minVersion: latest.minVersion,
        releaseDate: latest.releaseDate,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error checking update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get latest version info (public endpoint)
   */
  async getLatestVersion(platform: string) {
    const platformEnum = this.validatePlatform(platform);

    const version = await this.prisma.appVersion.findFirst({
      where: {
        platform: platformEnum,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        version: true,
        buildNumber: true,
        whatsNew: true,
        releaseNotes: true,
        releaseDate: true,
        createdAt: true,
      },
    });

    if (!version) {
      throw new NotFoundException(
        `No active version found for platform: ${platform}`,
      );
    }

    return version;
  }

  /**
   * Create a new app version (Admin only)
   */
  async createVersion(userId: number, dto: CreateAppVersionDto) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    try {
      const platformEnum = this.validatePlatform(dto.platform);

      // Validate version format (SemVer)
      this.validateVersionFormat(dto.version);

      // Check for duplicate version or build number
      await this.checkForDuplicates(platformEnum, dto.version, dto.buildNumber);

      // Deactivate previous active version for this platform
      await this.deactivatePreviousVersion(platformEnum);

      // Create new version
      const newVersion = await this.prisma.appVersion.create({
        data: {
          platform: platformEnum,
          version: dto.version,
          buildNumber: dto.buildNumber,
          isMandatory: dto.isMandatory || false,
          priority: dto.priority || UpdatePriority.NORMAL,
          minVersion: dto.minVersion,
          releaseNotes: dto.releaseNotes,
          whatsNew: dto.whatsNew,
          androidStoreUrl: dto.androidStoreUrl,
          iosStoreUrl: dto.iosStoreUrl,
          forceUpdateDate: dto.forceUpdateDate
            ? new Date(dto.forceUpdateDate)
            : null,
        },
      });

      this.logger.log(
        `Created new version: ${platformEnum} v${dto.version} (build ${dto.buildNumber})`,
      );

      return newVersion;
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `Error creating version: ${error.message}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all versions (Admin only)
   */
  async getAllVersions(userId: number) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    const versions = await this.prisma.appVersion.findMany({
      orderBy: { createdAt: 'desc' },
      // Remove the include or use a different approach
    });

    // Get user counts separately
    const versionsWithStats = await Promise.all(
      versions.map(async (version) => {
        const userCount = await this.prisma.userAppVersion.count({
          where: {
            platform: version.platform,
            version: version.version,
          },
        });

        const recentUserCount = await this.prisma.userAppVersion.count({
          where: {
            platform: version.platform,
            version: version.version,
            lastSeen: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });

        return {
          ...version,
          userStats: {
            totalUsers: userCount,
            activeUsersLast7Days: recentUserCount,
          },
        };
      }),
    );

    return versionsWithStats;
  }

  /**
   * Force update for versions below minimum version (Admin only)
   */
  async forceUpdate(userId: number, platform: string, minVersion: string) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    const platformEnum = this.validatePlatform(platform);

    this.validateVersionFormat(minVersion);

    const result = await this.prisma.appVersion.updateMany({
      where: {
        platform: platformEnum,
        version: { lt: minVersion },
      },
      data: {
        isMandatory: true,
        minVersion: minVersion,
      },
    });

    this.logger.log(
      `Force update applied to ${result.count} versions for ${platform} below v${minVersion}`,
    );

    return {
      message: `Force update applied to ${result.count} versions`,
      count: result.count,
    };
  }

  /**
   * Deactivate a version (Admin only)
   */
  async deactivateVersion(userId: number, id: number) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    const version = await this.prisma.appVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    const updated = await this.prisma.appVersion.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    this.logger.log(
      `Deactivated version: ${version.platform} v${version.version}`,
    );

    return updated;
  }

  /**
   * Track user's app version (call when user opens app)
   */
  async trackUserVersion(
    userId: number,
    platform: string,
    version: string,
    buildNumber: number,
  ) {
    try {
      const platformEnum = this.validatePlatform(platform);

      return await this.prisma.userAppVersion.upsert({
        where: {
          userId_platform: {
            userId,
            platform: platformEnum,
          },
        },
        update: {
          version,
          buildNumber,
          lastSeen: new Date(),
        },
        create: {
          userId,
          platform: platformEnum,
          version,
          buildNumber,
        },
      });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.warn(`Failed to track user version: ${error.message}`);
      // Don't throw error, tracking shouldn't break app
    }
  }

  /**
   * Get statistics about user versions
   */
  async getUserVersionStats(
    userId: number,
    platform?: AppPlatform,
    version?: string,
  ) {
    const isAdmin = await this.userService.isAdmin(userId);

    if (!isAdmin) {
      throw new BadGatewayException('User is not admin!');
    }

    const where: any = {};

    if (platform) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.platform = platform;
    }

    if (version) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.version = version;
    }

    const [totalUsers, latestUsers] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.prisma.userAppVersion.count({ where }),
      this.prisma.userAppVersion.count({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: {
          ...where,
          lastSeen: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsersLast7Days: latestUsers,
    };
  }

  // ========== PRIVATE HELPER METHODS ==========

  private validatePlatform(platform: string): AppPlatform {
    const platformUpper = platform.toUpperCase();
    if (!(platformUpper in AppPlatform)) {
      throw new BadRequestException(
        `Invalid platform: ${platform}. Must be 'ANDROID' or 'IOS'`,
      );
    }
    return AppPlatform[platformUpper as keyof typeof AppPlatform];
  }

  private validateVersionFormat(version: string) {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(version)) {
      throw new BadRequestException(
        `Invalid version format: ${version}. Must be in SemVer format (e.g., 1.0.0)`,
      );
    }
  }

  private async checkForDuplicates(
    platform: AppPlatform,
    version: string,
    buildNumber: number,
  ) {
    const existing = await this.prisma.appVersion.findFirst({
      where: {
        platform,
        OR: [{ version }, { buildNumber }],
      },
    });

    if (existing) {
      if (existing.version === version) {
        throw new BadRequestException(
          `Version ${version} already exists for ${platform}`,
        );
      }
      if (existing.buildNumber === buildNumber) {
        throw new BadRequestException(
          `Build number ${buildNumber} already exists for ${platform}`,
        );
      }
    }
  }

  private async deactivatePreviousVersion(platform: AppPlatform) {
    await this.prisma.appVersion.updateMany({
      where: {
        platform,
        isActive: true,
      },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  private isUpdateMandatory(
    currentVersion: string,
    latestVersion: any,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!latestVersion.isMandatory) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!latestVersion.minVersion) {
      return true; // All versions need update if isMandatory is true
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.compareVersions(currentVersion, latestVersion.minVersion) < 0;
  }

  private isForceUpdateRequired(latestVersion: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!latestVersion.forceUpdateDate) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return new Date() > latestVersion.forceUpdateDate;
  }

  private getStoreUrl(platform: string, latestVersion: any): string {
    const platformLower = platform.toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (platformLower === 'android' && latestVersion.androidStoreUrl) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return latestVersion.androidStoreUrl;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (platformLower === 'ios' && latestVersion.iosStoreUrl) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return latestVersion.iosStoreUrl;
    }

    // Default store URLs
    return platformLower === 'android'
      ? 'market://details?id=com.yourapp'
      : 'https://apps.apple.com/app/idYOUR_APP_ID';
  }
}
