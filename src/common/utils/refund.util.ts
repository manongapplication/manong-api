import { RefundStatus, ServiceRequestStatus } from '@prisma/client';
import { RefundAmountType } from 'src/refund-request/types/refund-amount.types';

export interface RefundStatusMessage {
  title: string;
  body: string;
}

const refundStatusMessages: Record<RefundStatus, RefundStatusMessage> = {
  pending: {
    title: 'Refund Request Pending',
    body: 'Your refund request is pending review. We will process it shortly.',
  },
  approved: {
    title: 'Refund Approved',
    body: 'Your refund has been approved. The amount will be credited to your account within 3-5 business days.',
  },
  rejected: {
    title: 'Refund Rejected',
    body: 'Your refund request has been rejected. Please contact support if you have questions.',
  },
  processing: {
    title: 'Refund Processing',
    body: 'Your refund is currently being processed. This may take a few business days to complete.',
  },
  processed: {
    title: 'Refund Processed',
    body: 'Your refund has been successfully processed. The amount has been credited to your account.',
  },
  failed: {
    title: 'Refund Failed',
    body: 'We encountered an issue processing your refund. Please try again or contact support.',
  },
  requiresAction: {
    title: 'Action Required',
    body: 'Additional information is needed to process your refund. Please check your email for instructions.',
  },
};

/**
 * Get refund status message
 * @param status - Refund status
 * @returns RefundStatusMessage
 */
export function getRefundStatusMessage(
  status: RefundStatus,
): RefundStatusMessage {
  return (
    refundStatusMessages[status] ?? {
      title: 'Unknown Refund Status',
      body: 'There is an unknown issue with your refund request.',
    }
  );
}

export function calculateRefundAmount(
  requestStatus: ServiceRequestStatus,
  totalAmount: number,
) {
  switch (requestStatus) {
    case ServiceRequestStatus.awaitingAcceptance:
    case ServiceRequestStatus.pending:
      return totalAmount; // Full refund

    case ServiceRequestStatus.accepted:
      return Math.max(0, totalAmount - 300); // Minus ₱300

    case ServiceRequestStatus.inProgress:
      // Calculate based on time spent or fixed partial refund
      return totalAmount * 0.5; // 50% refund

    case ServiceRequestStatus.completed:
    case ServiceRequestStatus.failed:
      return 0; // No refund

    default:
      return totalAmount; // Full refund for other cases
  }
}

export function getRefundAmountTypeEnum(
  requestStatus: ServiceRequestStatus,
): RefundAmountType {
  switch (requestStatus) {
    case ServiceRequestStatus.awaitingAcceptance:
    case ServiceRequestStatus.pending:
      return RefundAmountType.FULL_REFUND;

    case ServiceRequestStatus.accepted:
      return RefundAmountType.MINUS_300;

    case ServiceRequestStatus.inProgress:
      return RefundAmountType.FIFTY_PERCENT;

    case ServiceRequestStatus.completed:
    case ServiceRequestStatus.failed:
      return RefundAmountType.NO_REFUND;

    default:
      return RefundAmountType.FULL_REFUND;
  }
}
