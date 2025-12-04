import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { BookmarkItemService } from './bookmark-item.service';
import { BookmarkItemController } from './bookmark-item.controller';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
  providers: [BookmarkItemService, AppMaintenanceGuard, AppMaintenanceService],
  controllers: [BookmarkItemController],
  exports: [BookmarkItemService],
})
export class BookmarkItemModule {}
