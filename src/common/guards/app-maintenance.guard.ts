import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ADMIN_ONLY_KEY } from '../decorators/admin-only.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class AppMaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly appMaintenanceService: AppMaintenanceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(
      ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user = request.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const path = request.route?.path || '';

    // 1. Get current maintenance status
    const maintenance = await this.appMaintenanceService.getCurrentStatus?.();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (isAdminOnly && user?.role === UserRole.admin) return true;

    if (!maintenance?.isActive) return true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user?.role === UserRole.admin) return true;

    // health check bypass
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (path.includes('health') || path.includes('status')) return true;

    // fallback
    throw new ForbiddenException(
      maintenance.message ||
        'The app is currently under maintenance. Please try again later.',
    );
  }
}
