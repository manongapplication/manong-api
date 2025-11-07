import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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

  // Correctly set JSON & URL limits on Nest's underlying Express
  app.use(
    express.json({ limit: '50mb' }),
    express.urlencoded({ limit: '50mb', extended: true }),
  );

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
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
