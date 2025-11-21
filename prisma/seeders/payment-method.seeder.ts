import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentMethodSeeder {
  async run() {
    await prisma.paymentMethod.createMany({
      data: [
        { name: 'Cash', code: 'cash', isActive: true },
        { name: 'Credit/Debit Card', code: 'card', isActive: true },
        { name: 'Gcash', code: 'gcash', isActive: true },
        { name: 'Paypal', code: 'paypal', isActive: true },
        { name: 'Maya', code: 'paymaya', isActive: true },
      ],
      skipDuplicates: true,
    });

    console.log('Payment Methods seeded successfully!');
  }
}
