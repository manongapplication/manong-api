import { PaymentStatus } from '@prisma/client';

export function mapPaymongoStatus(status: string): PaymentStatus {
  switch (status) {
    case 'paid':
      return PaymentStatus.paid;
    case 'failed':
    case 'cancelled':
      return PaymentStatus.failed;
    case 'pending':
    case 'awaiting_next_action':
      return PaymentStatus.pending;
    case 'refunded':
      return PaymentStatus.refunded;
    default:
      return PaymentStatus.unpaid; // fallback
  }
}
