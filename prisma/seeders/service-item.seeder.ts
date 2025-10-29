import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ServiceItemSeeder {
  async run() {
    await prisma.serviceItem.createMany({
      data: [
        {
          title: 'Plumbing',
          description: 'Pipe repairs, leak fixes, installations',
          priceMin: 500,
          priceMax: 2000,
          ratePerKm: 25,
          iconName: 'plumbing',
          iconColor: '#3B82F6',
        },
        {
          title: 'Electrical',
          description: 'Wiring, outlets, lighting repairs',
          priceMin: 400,
          priceMax: 1500,
          ratePerKm: 25,
          iconName: 'electrical_services',
          iconColor: '#F59E0B',
        },
        {
          title: 'Carpentry',
          description: 'Furniture repair, installations',
          priceMin: 600,
          priceMax: 2500,
          ratePerKm: 30,
          iconName: 'construction',
          iconColor: '#EF4444',
        },
        {
          title: 'Painting',
          description: 'Interior/exterior painting',
          priceMin: 800,
          priceMax: 3000,
          ratePerKm: 30,
          iconName: 'format_paint',
          iconColor: '#8B5CF6',
        },
        {
          title: 'Appliance Repair',
          description: 'AC, refrigerator, washing machine',
          priceMin: 700,
          priceMax: 2800,
          ratePerKm: 28,
          iconName: 'build',
          iconColor: '#10B981',
        },
        {
          title: 'Security',
          description: 'CCTV, locks, alarm systems',
          priceMin: 1000,
          priceMax: 4000,
          ratePerKm: 25,
          iconName: 'security',
          iconColor: '#6366F1',
        },
        {
          title: 'Home Maintenance',
          description:
            'Dryer vent cleaning, chimney cleaning, seasonal maintenance, and other home upkeep services.',
          priceMin: 1000,
          priceMax: 4000,
          ratePerKm: 28,
          iconName: 'home',
          iconColor: '#EC4899',
        },
      ],
    });

    console.log('Service items seeded successfully!');
  }
}
