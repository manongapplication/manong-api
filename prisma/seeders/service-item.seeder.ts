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
          iconName: 'plumbing',
          iconColor: '#3B82F6',
          isActive: true,
        },
        {
          title: 'Electrical',
          description: 'Wiring, outlets, lighting repairs',
          priceMin: 400,
          priceMax: 1500,
          iconName: 'electrical_services',
          iconColor: '#F59E0B',
          isActive: true,
        },
        {
          title: 'Carpentry',
          description: 'Furniture repair, installations',
          priceMin: 600,
          priceMax: 2500,
          iconName: 'construction',
          iconColor: '#EF4444',
          isActive: true,
        },
        {
          title: 'Painting',
          description: 'Interior/exterior painting',
          priceMin: 800,
          priceMax: 3000,
          iconName: 'format_paint',
          iconColor: '#8B5CF6',
          isActive: true,
        },
        {
          title: 'Appliance Repair',
          description: 'AC, refrigerator, washing machine',
          priceMin: 700,
          priceMax: 2800,
          iconName: 'build',
          iconColor: '#10B981',
          isActive: true,
        },
        {
          title: 'Security',
          description: 'CCTV, locks, alarm systems',
          priceMin: 1000,
          priceMax: 4000,
          iconName: 'security',
          iconColor: '#6366F1',
          isActive: true,
        },
        {
          title: 'Home Maintenance',
          description:
            'Dryer vent cleaning, chimney cleaning, seasonal maintenance, and other home upkeep services.',
          priceMin: 1000,
          priceMax: 4000,
          iconName: 'home',
          iconColor: '#EC4899',
          isActive: true,
        },
      ],
    });

    console.log('Service items seeded successfully!');
  }
}
