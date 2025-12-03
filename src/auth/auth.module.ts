import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwilioModule } from 'src/twilio/twilio.module';
import { ReferralCodeModule } from 'src/referral-code/referral-code.module';
import { OtpService } from 'src/otp/otp.service';
import { OtpModule } from 'src/queues/otp/otp.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    TwilioModule,
    forwardRef(() => ReferralCodeModule),
    OtpModule,
  ],
  providers: [AuthService, JwtStrategy, OtpService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
