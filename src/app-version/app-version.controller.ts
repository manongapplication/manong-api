import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppVersionService } from './app-version.service';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { CheckUpdateDto } from './dto/check-update.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@ApiTags('App Version')
@Controller('api/app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  /**
   * Check if app needs update
   */
  @Get('check')
  @ApiOperation({ summary: 'Check for app updates' })
  @ApiResponse({ status: 200, description: 'Update check completed' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async checkUpdate(@Query() checkUpdateDto: CheckUpdateDto) {
    return this.appVersionService.checkUpdate(checkUpdateDto);
  }

  /**
   * Get latest version information
   */
  @Get('latest')
  @ApiOperation({ summary: 'Get latest app version info' })
  @ApiResponse({ status: 200, description: 'Latest version info' })
  @ApiResponse({ status: 404, description: 'No active version found' })
  @ApiQuery({ name: 'platform', required: true, enum: ['android', 'ios'] })
  async getLatestVersion(@Query('platform') platform: string) {
    if (!platform) {
      throw new BadRequestException('Platform query parameter is required');
    }
    return this.appVersionService.getLatestVersion(platform);
  }

  /**
   * Track user's app version (called when user opens app)
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track user app version' })
  @ApiResponse({ status: 200, description: 'Version tracked successfully' })
  async trackUserVersion(
    @Body()
    body: {
      userId: number;
      platform: string;
      version: string;
      buildNumber: number;
    },
  ) {
    const { userId, platform, version, buildNumber } = body;

    if (!userId || !platform || !version || !buildNumber) {
      throw new BadRequestException(
        'Missing required fields: userId, platform, version, buildNumber',
      );
    }

    return this.appVersionService.trackUserVersion(
      userId,
      platform,
      version,
      buildNumber,
    );
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Get all versions (Admin only)
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all app versions (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all versions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllVersions(@CurrentUserId() userId: number) {
    return this.appVersionService.getAllVersions(userId);
  }

  /**
   * Create new version (Admin only)
   */
  @Post('admin/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new app version (Admin only)' })
  @ApiResponse({ status: 201, description: 'Version created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or duplicate version',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createVersion(
    @Body() createAppVersionDto: CreateAppVersionDto,
    @CurrentUserId() userId: number,
  ) {
    return this.appVersionService.createVersion(userId, createAppVersionDto);
  }

  /**
   * Force update for old versions (Admin only)
   */
  @Post('admin/force-update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force update for old versions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Force update applied' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async forceUpdate(
    @Body() body: { platform: string; minVersion: string },
    @CurrentUserId() userId: number,
  ) {
    const { platform, minVersion } = body;

    if (!platform || !minVersion) {
      throw new BadRequestException('Platform and minVersion are required');
    }

    return this.appVersionService.forceUpdate(userId, platform, minVersion);
  }

  /**
   * Deactivate a version (Admin only)
   */
  @Post('admin/deactivate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a version (Admin only)' })
  @ApiResponse({ status: 200, description: 'Version deactivated' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateVersion(
    @Param('id') id: string,
    @CurrentUserId() userId: number,
  ) {
    const versionId = parseInt(id, 10);

    if (isNaN(versionId)) {
      throw new BadRequestException('Invalid version ID');
    }

    return this.appVersionService.deactivateVersion(userId, versionId);
  }

  /**
   * Get user version statistics (Admin only)
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user version statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Version statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'platform', required: false, enum: ['ANDROID', 'IOS'] })
  @ApiQuery({
    name: 'version',
    required: false,
    description: 'Specific version to filter',
  })
  async getUserStats(
    @CurrentUserId() userId: number,
    @Query('platform') platform?: string,
    @Query('version') version?: string,
  ) {
    return this.appVersionService.getUserVersionStats(
      userId,
      platform as any,
      version,
    );
  }
}
