import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AppMaintenanceSeeder {
  async run() {
    await prisma.appMaintenance.create({
      data: {
        isActive: false,
      },
    });

    console.log('App Maintenance seeded successfully!');
  }
}
