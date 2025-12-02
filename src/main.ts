import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import express from 'express';
import { Reflector } from '@nestjs/core';
import { AppMaintenanceGuard } from './common/guards/app-maintenance.guard';
import { AppMaintenanceService } from './app-maintenance/app-maintenance.service';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global App Maintenance Guard
  app.useGlobalGuards(
    new AppMaintenanceGuard(app.get(Reflector), app.get(AppMaintenanceService)),
  );

  // Correctly set JSON & URL limits on Nest's underlying Express
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const expressApp = app.getHttpAdapter().getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressApp.use(express.json({ limit: '50mb' }));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressApp.use(express.urlencoded({ limit: '50mb', extended: true }));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressApp.use((err: any, req: any, res: any, next: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (err.type === 'entity.too.large') {
      throw new BadRequestException('Payload too large. Maximum size is 50MB');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    next(err);
  });

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global validation
  // main.ts - Update the exceptionFactory section
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        // Safe handling of potentially undefined errors
        const errorMessages = (errors || [])
          .map((error) => {
            const constraints = error.constraints || {};
            const messages = Object.values(constraints);
            return messages.length > 0
              ? `${error.property}: ${messages.join(', ')}`
              : `${error.property}: Validation failed`;
          })
          .filter((msg) => msg); // Remove empty messages

        return new BadRequestException(
          errorMessages.length > 0
            ? errorMessages.join('; ')
            : 'Validation failed',
        );
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📊 Prisma Studio: http://localhost:5555`);
  console.log(`🗄️  PgAdmin: http://localhost:8080`);
  console.log(`📡 Redis Commander: http://localhost:8082`);
}

bootstrap().catch((err) => {
  console.error('❌ Error starting the app:', err);
  process.exit(1);
});
