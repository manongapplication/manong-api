import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class UrgencyLevelSeeder {
  async run() {
    try {
      await prisma.urgencyLevel.createMany({
        data: [
          {
            level: 'Standard',
            time: '3-5 business days',
            price: new Prisma.Decimal(50),
          },
          {
            level: 'Priority',
            time: '1-2 business days',
            price: new Prisma.Decimal(20),
          },
          {
            level: 'Urgent',
            time: 'Same-Day (book by 2PM)',
            price: new Prisma.Decimal(30),
          },
          {
            level: 'Emergency',
            time: '3 Hours',
            price: new Prisma.Decimal(30),
          },
        ],
      });

      console.log('Urgency Levels seeded successfully!');
    } catch (error) {
      console.error('Error seeding urgency levels:', error);
      throw error;
    }
  }
}
