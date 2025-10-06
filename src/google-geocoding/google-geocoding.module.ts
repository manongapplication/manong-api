import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleGeocodingService } from './google-geocoding.service';
import { GoogleGeocodingController } from './google-geocoding.controller';

@Module({
  imports: [AuthModule],
  providers: [GoogleGeocodingService],
  controllers: [GoogleGeocodingController],
  exports: [GoogleGeocodingService],
})
export class GoogleGeocodingModule {}
