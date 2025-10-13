import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ServiceSettingsSeeder {
  async run() {
    // Check if settings already exist to avoid duplicates
    const existing = await prisma.serviceSettings.findFirst();
    if (!existing) {
      await prisma.serviceSettings.create({
        data: {
          serviceTax: 0.12, // 12%
          maxDistanceFee: 400, // capped distance fee
        },
      });
      console.log('Global ServiceSettings seeded successfully!');
    } else {
      console.log('ServiceSettings already exists.');
    }
  }
}
