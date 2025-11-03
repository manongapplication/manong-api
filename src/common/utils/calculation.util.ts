import { ServiceRequest, SubServiceItem, UrgencyLevel } from '@prisma/client';

export class CalculationUtil {
  private static readonly serviceTaxRate = 0.12;

  static calculateSubTotal(
    serviceRequest?:
      | (ServiceRequest & {
          subServiceItem?: SubServiceItem | null;
          urgencyLevel?: UrgencyLevel | null;
        })
      | null,
  ): number {
    if (!serviceRequest) return 0;

    let total = 0;

    if (serviceRequest.subServiceItem?.cost != null) {
      total += Number(serviceRequest.subServiceItem.cost);
    }

    if (serviceRequest.urgencyLevel?.price != null) {
      total += Number(serviceRequest.urgencyLevel.price);
    }

    return total;
  }

  static calculateServiceTaxAmount(
    serviceRequest?:
      | (ServiceRequest & {
          subServiceItem?: SubServiceItem | null;
          urgencyLevel?: UrgencyLevel | null;
        })
      | null,
  ): number {
    return this.calculateSubTotal(serviceRequest) * this.serviceTaxRate;
  }

  static calculateTotal(
    serviceRequest?:
      | (ServiceRequest & {
          subServiceItem?: SubServiceItem | null;
          urgencyLevel?: UrgencyLevel | null;
        })
      | null,
  ): number {
    let total = 0;

    if (serviceRequest == null) return 0;

    if (serviceRequest.subServiceItem?.fee != null) {
      total += Number(serviceRequest.subServiceItem.fee);
    }

    if (serviceRequest.urgencyLevel?.price != null) {
      total += Number(serviceRequest.urgencyLevel.price);
    }

    // return total + this.calculateServiceTaxAmount(serviceRequest);
    return total;
  }
}
