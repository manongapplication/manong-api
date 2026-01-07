import { AccountStatus, Prisma, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class ModeratorSeeder {
  async run() {
    // Create Moderator User
    await prisma.user.create({
      data: {
        firstName: 'Moderator',
        lastName: 'User',
        nickname: 'Moderator',
        email: 'moderator@moderator.com',
        phone: '+639111111112',
        password: await bcrypt.hash('moderatorpassword', 10),
        role: UserRole.moderator,
        isVerified: true,
        latitude: new Prisma.Decimal(14.676),
        longitude: new Prisma.Decimal(121.0437),
        status: AccountStatus.verified,
      },
    });

    console.log('Moderator seeded successfully!');
  }
}
