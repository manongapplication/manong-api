import { TransactionType } from '@prisma/client';

export interface TransactionStatusMessage {
  title: string;
  body: string;
}

// Transaction Type Messages
const transactionTypeMessages: Record<
  TransactionType,
  TransactionStatusMessage
> = {
  payment: {
    title: 'Payment Successful',
    body: 'Your payment has been processed successfully. Thank you for your purchase!',
  },
  refund: {
    title: 'Refund Processed',
    body: 'Your refund has been successfully processed. The amount will be credited to your account.',
  },
  adjustment: {
    title: 'Adjustment Completed',
    body: 'Your account adjustment has been successfully processed. Your balance has been updated.',
  },
};

/**
 * Get transaction type message
 * @param type - Transaction type
 * @returns TransactionStatusMessage
 */
export function getTransactionTypeMessage(
  type: TransactionType,
): TransactionStatusMessage {
  return (
    transactionTypeMessages[type] ?? {
      title: 'Transaction Processed',
      body: 'Your transaction has been successfully completed.',
    }
  );
}
