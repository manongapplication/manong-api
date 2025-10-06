import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaService) {}

  async fetchPaymentMethodByCode(code: string) {
    return await this.prisma.paymentMethod.findFirst({ where: { code } });
  }

  async fetchPaymentMethods() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await this.prisma.paymentMethod.findMany();
  }
}
