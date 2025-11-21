import { AccountStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class AdminSeeder {
  async run() {
    // Create Admin User
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'User',
        nickname: 'SuperAdmin',
        email: 'admin@example.com',
        phone: '+639111111111',
        password: await bcrypt.hash('adminpassword', 10),
        role: UserRole.admin,
        isVerified: true,
        latitude: new Prisma.Decimal(14.676),
        longitude: new Prisma.Decimal(121.0437),
        status: AccountStatus.verified,
      },
    });

    console.log('Admin seeded successfully!');
  }
}
