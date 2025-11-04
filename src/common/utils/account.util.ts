import { AccountStatus } from '@prisma/client';

export interface AccountStatusMessage {
  title: string;
  body: string;
}

const accountStatusMessages: Record<AccountStatus, AccountStatusMessage> = {
  pending: {
    title: 'Account Pending',
    body: 'Your account is pending. Please wait for approval.',
  },
  onHold: {
    title: 'Account On Hold',
    body: 'Your account is on hold. Please wait before using our services.',
  },
  verified: {
    title: 'Account Verified',
    body: 'Your account is verified. You can now use all services.',
  },
  rejected: {
    title: 'Account Rejected',
    body: 'Your account has been rejected. Please contact support.',
  },
  suspended: {
    title: 'Account Suspended',
    body: 'Your account is suspended. Access is temporarily disabled.',
  },
  deleted: {
    title: 'Account Deleted',
    body: 'Your account has been deleted. You can no longer use our services.',
  },
};

/**
 * Get account status message
 * @param status - Account status
 * @returns AccountStatusMessage
 */
export function getAccountStatusMessage(
  status: AccountStatus,
): AccountStatusMessage {
  return (
    accountStatusMessages[status] ?? {
      title: 'Unknown Status',
      body: 'There is an unknown issue with your account.',
    }
  );
}
