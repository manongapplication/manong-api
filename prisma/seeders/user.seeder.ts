import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserSeeder {
  async run() {
    // Get sub-service item IDs for specialities
    const leakRepair = await prisma.subServiceItem.findFirst({
      where: { title: 'Leak Repair' },
    });
    const pipeInstall = await prisma.subServiceItem.findFirst({
      where: { title: 'Pipe Install' },
    });
    const toiletRepair = await prisma.subServiceItem.findFirst({
      where: { title: 'Toilet Repair & Installation' },
    });
    const outletReplacement = await prisma.subServiceItem.findFirst({
      where: { title: 'Outlet Replacement' },
    });
    const lightingSetup = await prisma.subServiceItem.findFirst({
      where: { title: 'Lighting Setup' },
    });
    const doorCabinet = await prisma.subServiceItem.findFirst({
      where: { title: 'Door & Cabinet' },
    });
    const shelvingInstall = await prisma.subServiceItem.findFirst({
      where: { title: 'Shelving Install' },
    });
    const roomRepaint = await prisma.subServiceItem.findFirst({
      where: { title: 'Room Repaint' },
    });
    const acRepair = await prisma.subServiceItem.findFirst({
      where: { title: 'AC Repair' },
    });
    const cctvSetup = await prisma.subServiceItem.findFirst({
      where: { title: 'CCTV Setup' },
    });
    const dryerVent = await prisma.subServiceItem.findFirst({
      where: { title: 'Dryer Vent Cleaning' },
    });
    const gutterCleaning = await prisma.subServiceItem.findFirst({
      where: { title: 'Gutter Cleaning' },
    });

    // Example manongs
    const manongs = [
      {
        firstName: 'Pedro',
        lastName: 'Pedro',
        email: 'pedro@example.com',
        phone: '+639987654321',
        licenseNumber: 'PLMBR-12345',
        yearsExperience: 8,
        hourlyRate: 280,
        startingPrice: 500,
        latitude: 14.6091,
        longitude: 121.0223,
        specialities: [
          leakRepair?.id,
          pipeInstall?.id,
          toiletRepair?.id,
        ].filter(Boolean),
      },
      {
        firstname: 'Mario',
        lastName: 'Electrician',
        email: 'mario@example.com',
        phone: '+639876543210',
        licenseNumber: 'ELEC-67890',
        yearsExperience: 6,
        hourlyRate: 300,
        startingPrice: 450,
        latitude: 14.5995,
        longitude: 120.9842,
        specialities: [outletReplacement?.id, lightingSetup?.id].filter(
          Boolean,
        ),
      },
      {
        firstName: 'Juan',
        lastName: 'Carpenter',
        email: 'juan@example.com',
        phone: '+639765432109',
        licenseNumber: 'CRPT-54321',
        yearsExperience: 12,
        hourlyRate: 320,
        startingPrice: 600,
        latitude: 14.676,
        longitude: 121.0437,
        specialities: [doorCabinet?.id, shelvingInstall?.id].filter(Boolean),
      },
      {
        firstName: 'Rico',
        lastName: 'Painter',
        email: 'rico@example.com',
        phone: '+639654321098',
        licenseNumber: 'PNTR-98765',
        yearsExperience: 4,
        hourlyRate: 250,
        startingPrice: 800,
        latitude: 14.5794,
        longitude: 121.0359,
        specialities: [roomRepaint?.id].filter(Boolean),
      },
      {
        firstName: 'Carlos',
        lastName: 'Technician',
        email: 'carlos@example.com',
        phone: '+639543210987',
        licenseNumber: 'TECH-13579',
        yearsExperience: 7,
        hourlyRate: 350,
        startingPrice: 700,
        latitude: 14.6349,
        longitude: 121.0419,
        specialities: [acRepair?.id].filter(Boolean),
      },
      {
        firstName: 'Roberto',
        lastName: 'Security',
        email: 'roberto@example.com',
        phone: '+639432109876',
        licenseNumber: 'SECU-24680',
        yearsExperience: 9,
        hourlyRate: 400,
        startingPrice: 1000,
        latitude: 14.6137,
        longitude: 121.027,
        specialities: [cctvSetup?.id].filter(Boolean),
      },
      {
        firstName: 'Antonio',
        lastName: 'Maintenance',
        email: 'antonio@example.com',
        phone: '+639321098765',
        licenseNumber: 'MAINT-97531',
        yearsExperience: 5,
        hourlyRate: 220,
        startingPrice: 300,
        latitude: 14.5906,
        longitude: 121.0142,
        specialities: [dryerVent?.id, gutterCleaning?.id].filter(Boolean),
      },
      {
        firstName: 'Miguel',
        lastName: 'Multi-Skilled',
        email: 'miguel@example.com',
        phone: '+639210987654',
        licenseNumber: 'MULTI-86420',
        yearsExperience: 15,
        hourlyRate: 380,
        startingPrice: 450,
        latitude: 14.6425,
        longitude: 121.0308,
        specialities: [
          leakRepair?.id,
          outletReplacement?.id,
          doorCabinet?.id,
          pipeInstall?.id,
          toiletRepair?.id,
          shelvingInstall?.id,
          roomRepaint?.id,
          acRepair?.id,
          cctvSetup?.id,
          dryerVent?.id,
          gutterCleaning?.id,
        ].filter(Boolean),
      },
      {
        firstName: 'Eduardo',
        lastName: 'Expert',
        email: 'eduardo@example.com',
        phone: '+639109876543',
        licenseNumber: 'EXPR-75319',
        yearsExperience: 20,
        hourlyRate: 450,
        startingPrice: 800,
        latitude: 14.5833,
        longitude: 121.05,
        specialities: [
          pipeInstall?.id,
          lightingSetup?.id,
          cctvSetup?.id,
        ].filter(Boolean),
      },
      {
        firstName: 'Benito',
        lastName: 'Budget',
        email: 'benito@example.com',
        phone: '+639098765432',
        licenseNumber: 'BUDG-64208',
        yearsExperience: 3,
        hourlyRate: 200,
        startingPrice: 250,
        latitude: 14.62,
        longitude: 121.01,
        specialities: [
          dryerVent?.id,
          gutterCleaning?.id,
          shelvingInstall?.id,
        ].filter(Boolean),
      },
      {
        firstName: 'Fernando',
        lastName: 'Fast',
        email: 'fernando@example.com',
        phone: '+639987654320',
        licenseNumber: 'FAST-53197',
        yearsExperience: 6,
        hourlyRate: 290,
        startingPrice: 400,
        latitude: 14.605,
        longitude: 121.035,
        specialities: [toiletRepair?.id, outletReplacement?.id].filter(Boolean),
      },
      {
        firstName: 'Gerardo',
        lastName: 'General',
        email: 'gerardo@example.com',
        phone: '+639876543201',
        licenseNumber: 'GEN-42086',
        yearsExperience: 10,
        hourlyRate: 310,
        startingPrice: 500,
        latitude: 14.575,
        longitude: 121.025,
        specialities: [
          leakRepair?.id,
          doorCabinet?.id,
          dryerVent?.id,
          acRepair?.id,
        ].filter(Boolean),
      },
    ];

    // Create manong users with profiles + specialties
    for (const m of manongs) {
      await prisma.user.create({
        data: {
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          password: await bcrypt.hash('password', 10),
          role: 'manong',
          isVerified: true,
          latitude: m.latitude,
          longitude: m.longitude,
          manongProfile: {
            create: {
              licenseNumber: m.licenseNumber,
              hourlyRate: m.hourlyRate,
              startingPrice: m.startingPrice,
              isProfessionallyVerified: true,
              manongSpecialities: {
                create: m.specialities.map((sid) => ({
                  subServiceItem: { connect: { id: sid } },
                })),
              },
            },
          },
        },
      });
    }

    // Create Admin User
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '+639111111111',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'admin',
        isVerified: true,
        latitude: new Prisma.Decimal(14.676),
        longitude: new Prisma.Decimal(121.0437),
      },
    });

    // Create some Customers
    const customers = [
      {
        firstName: 'Maria',
        lastName: 'Customer',
        email: 'maria@customer.com',
        phone: '+639222222222',
        latitude: 14.6,
        longitude: 121.03,
      },
      {
        firstName: 'Jose',
        lastName: 'Client',
        email: 'jose@client.com',
        phone: '+639333333333',
        latitude: 14.61,
        longitude: 121.04,
      },
      {
        firstName: 'Ana',
        lastName: 'Homeowner',
        email: 'ana@homeowner.com',
        phone: '+639444444444',
        latitude: 14.59,
        longitude: 121.02,
      },
    ];

    for (const c of customers) {
      await prisma.user.create({
        data: {
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          password: await bcrypt.hash('password', 10),
          role: 'customer',
          isVerified: true,
          latitude: new Prisma.Decimal(c.latitude),
          longitude: new Prisma.Decimal(c.longitude),
        },
      });
    }

    console.log('✅ Users, manongs, and customers seeded successfully!');
  }
}
