import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class UrgencyLevelSeeder {
  async run() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await prisma.urgencyLevel.createMany({
        data: [
          {
            level: 'Normal',
            time: '2-4 hours',
            price: new Prisma.Decimal(0),
          },
          {
            level: 'Urgent',
            time: '1-2 hours',
            price: new Prisma.Decimal(20),
          },
          {
            level: 'Emergency',
            time: '30-60 mins',
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
