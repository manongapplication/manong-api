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
          iconName: 'mdi:wrench',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Electrical',
          description: 'Wiring, outlets, lighting repairs',
          priceMin: 400,
          priceMax: 1500,
          ratePerKm: 25,
          iconName: 'mdi:flash',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Carpentry',
          description: 'Furniture repair, installations',
          priceMin: 600,
          priceMax: 2500,
          ratePerKm: 30,
          iconName: 'mdi:hammer',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Painting',
          description: 'Interior/exterior painting',
          priceMin: 800,
          priceMax: 3000,
          ratePerKm: 30,
          iconName: 'tabler:paint-filled',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Appliance Repair',
          description: 'AC, refrigerator, washing machine',
          priceMin: 700,
          priceMax: 2800,
          ratePerKm: 28,
          iconName: 'mdi:tools',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Security',
          description: 'CCTV, locks, alarm systems',
          priceMin: 1000,
          priceMax: 4000,
          ratePerKm: 25,
          iconName: 'mdi:shield',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Home Maintenance',
          description:
            'Dryer vent cleaning, chimney cleaning, seasonal maintenance, and other home upkeep services.',
          priceMin: 1000,
          priceMax: 4000,
          ratePerKm: 28,
          iconName: 'mdi:home',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
        {
          title: 'Cleaning',
          description: 'Professional cleaning services for homes and offices',
          priceMin: 0,
          priceMax: 0,
          ratePerKm: 0,
          iconName: 'mdi:broom',
          iconColor: '#04697D',
          iconTextColor: '#80d8d6',
        },
      ],
    });

    console.log('Service items seeded successfully!');
  }
}
