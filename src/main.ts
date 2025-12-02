import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import express from 'express';
import { Reflector } from '@nestjs/core';
import { AppMaintenanceGuard } from './common/guards/app-maintenance.guard';
import { AppMaintenanceService } from './app-maintenance/app-maintenance.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global App Maintenance Guard
  app.useGlobalGuards(
    new AppMaintenanceGuard(app.get(Reflector), app.get(AppMaintenanceService)),
  );

  // Set JSON & URL limits
  app.use(
    express.json({ limit: '50mb' }),
    express.urlencoded({ limit: '50mb', extended: true }),
  );

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    credentials: false,
  });

  const allowedOrigins = [
    'https://dashboard.manongapp.com',
    'https://api.manongapp.com',
    'https://manongapp.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps)
      if (!origin) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return callback(null, true);
      }

      // Allow ngrok origins
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (origin.includes('ngrok.io') || origin.includes('ngrok-free.app')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return callback(null, true);
      }

      // Check if origin is in allowed list
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (allowedOrigins.includes(origin)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return callback(null, true);
      }

      // Block if not allowed
      console.warn(`CORS blocked: ${origin}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    credentials: true,
  });

  // ========== Global validation ==========
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorMessages = (errors || [])
          .map((error) => {
            const constraints = error.constraints || {};
            const messages = Object.values(constraints);
            return messages.length > 0
              ? `${error.property}: ${messages.join(', ')}`
              : `${error.property}: Validation failed`;
          })
          .filter((msg) => msg);

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
  console.log(`🌐 CORS enabled for all origins (*)`);
  console.log(`📊 Prisma Studio: http://localhost:5555`);
}

bootstrap().catch((err) => {
  console.error('❌ Error starting the app:', err);
  process.exit(1);
});
