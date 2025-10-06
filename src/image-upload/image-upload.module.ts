import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImageUploadService } from './image-upload.service';
import { ImageUploadController } from './image-upload.controller';
import { AuthModule } from 'src/auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [PrismaModule, AuthModule, EventEmitterModule.forRoot()],
  providers: [ImageUploadService],
  controllers: [ImageUploadController],
  exports: [ImageUploadService],
})
export class ImageUploadModule {}
