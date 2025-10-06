export interface VerificationRequest {
  account_sid: string;
  amount: number | null;
  channel: 'sms' | 'call';
  date_created: string;
  date_updated: string;
  send_code_attempts: {
    attempt_sid: string;
    channel: 'sms' | 'call';
    time: string;
  };
  service_sid: string;
  sid: string;
  status: string;
  to: string;
  url: string;
  valid: boolean;
}

export interface VerificationCheckRequest {
  account_sid: string;
  amount: number | null;
  channel: 'sms' | 'call';
  date_created: string;
  date_updated: string;
  service_sid: string;
  sid: string;
  status: string;
  to: string;
  valid: boolean;
}
