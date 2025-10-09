import { $Enums } from '@prisma/client';
import { Decimal, JsonValue } from 'generated/prisma/runtime/library';

export interface CompleteServiceRequest {
  id: number;
  paymentTransactionId: string | null;
  userId: number;
  manongId: number | null;
  serviceItemId: number;
  subServiceItemId?: number | null;
  paymentMethodId: number | null;
  urgencyLevelId: number;
  otherServiceName: string | null;
  serviceDetails: string | null;
  imagesPath: JsonValue;
  customerFullAddress: string | null;
  customerLat: Decimal;
  customerLng: Decimal;
  notes: string | null;
  rating: number | null;
  status: string | null;
  profilePhoto: string | null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  total: Decimal | null;
  paymentStatus: $Enums.PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  arrivedAt?: Date | null;
  deletedAt?: Date | null;
}
