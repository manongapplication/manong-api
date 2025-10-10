import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule);

  app.use(
    express.json({ limit: '20mb' }),
    express.urlencoded({ limit: '20mb', extended: true }),
  );

  server.set('trust proxy', 1);

  // Enable CORS for Flutter app
  app.enableCors({
    origin: '*', // Configure properly for production
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
