import { PaymentStatus, WalletTransactionStatus } from '@prisma/client';

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

export function mapPaymongoStatusForWallet(
  status: string,
): WalletTransactionStatus {
  switch (status) {
    case 'paid':
      return WalletTransactionStatus.completed;
    case 'failed':
    case 'cancelled':
      return WalletTransactionStatus.failed;
    case 'pending':
    case 'awaiting_next_action':
      return WalletTransactionStatus.pending;
    default:
      return WalletTransactionStatus.pending; // fallback
  }
}

export function mapPaymongoRefundStatus(refundStatus: string): PaymentStatus {
  switch (refundStatus) {
    case 'pending':
      return PaymentStatus.pending;
      break;
    case 'succeeded':
      return PaymentStatus.refunded;
      break;
    case 'failed':
      return PaymentStatus.failed;
      break;
    default:
      return PaymentStatus.pending; // fallback
  }
}
