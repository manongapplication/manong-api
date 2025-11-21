import { PaymentStatus, ServiceRequestStatus } from '@prisma/client';

export interface UpdateDataServiceRequestDto {
  // id?: number | null | undefined;
  userId?: number | null | undefined;
  manongId?: number | null | undefined;
  manong?: any;
  serviceItemId?: number | null | undefined;
  subServiceItemId?: number | null | undefined;
  paymentMethodId?: number | null | undefined;
  urgencyLevelId?: number | null | undefined;
  otherServiceName?: string | null | undefined;
  serviceDetails?: string | null | undefined;
  imagesPath?: string | null | undefined;

  customerFullAddress?: string | null | undefined;
  customerLat?: number | null | undefined;
  customerLng?: number | null | undefined;

  notes?: string | null | undefined;
  status?: ServiceRequestStatus | null | undefined;
  profilePhoto?: string | null | undefined;
  total?: number | null | undefined;
  paymentStatus?: PaymentStatus | null | undefined;
  paymentIntentId?: string | null | undefined;
  paymentIdOnGateway?: string | null | undefined;
  paymentRedirectUrl?: string | null | undefined;
  paymentTransactions?: any;
}
