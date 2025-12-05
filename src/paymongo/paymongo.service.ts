import axios from 'axios';
import { UserPaymentMethodService } from 'src/user-payment-method/user-payment-method.service';
import { CreateCardDto } from './dto/create-card.dto';
import {
  BadGatewayException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateAttachIntentDto } from './dto/create-attach-intent.dto';
import { UpdateUserPaymentMethodDto } from 'src/user-payment-method/dto/update-user-payment-method.dto';
import {
  PaymongoAttach,
  PaymongoPaymentIntent,
  PaymongoPaymentMethod,
  PaymongoRefund,
} from './types/paymongo.types';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { UpdateServiceRequestDto } from 'src/service-request/dto/update-service-request.dto';
import { PaymentStatus, ServiceRequestStatus } from '@prisma/client';
import { mapPaymongoRefundStatus } from 'src/common/utils/payment.util';
import { AuthService } from 'src/auth/auth.service';
import { FIVE_MINUTES } from 'src/common/utils/time.util';
import { calculateRefundAmount } from 'src/common/utils/refund.util';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PaymongoService {
  private readonly logger = new Logger(PaymongoService.name);

  constructor(
    private readonly userPaymentMethod: UserPaymentMethodService,
    @Inject(forwardRef(() => ServiceRequestService))
    private readonly serviceRequestService: ServiceRequestService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  private baseUrl = 'https://api.paymongo.com/v1';
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
  };

  async createPaymentMethod(userId: number, dto: CreateCardDto) {
    const data = {
      attributes: {
        ...(dto.type == 'card' && {
          details: {
            card_number: dto.number,
            exp_month:
              dto.expMonth != undefined ? parseInt(dto.expMonth) : null,
            exp_year: dto.expYear != undefined ? parseInt(dto.expYear) : null,
            cvc: dto.cvc,
          },
          billing: {
            name: dto.cardHolderName,
            email: dto.email,
          },
        }),
        type: dto.type,
      },
    };
    try {
      const result = await axios.post<PaymongoPaymentMethod>(
        `${this.baseUrl}/payment_methods`,
        {
          data,
        },
        { headers: this.headers },
      );

      const resultData = result.data.data;

      const paymentMethodDetails: UpdateUserPaymentMethodDto = {
        paymentMethodIdOnGateway: resultData?.id ?? '',
        last4: resultData?.attributes?.details?.last4 ?? '',
        expMonth: resultData?.attributes?.details?.exp_month ?? null,
        expYear: resultData?.attributes?.details?.exp_year ?? null,
        cardHolderName: resultData?.attributes?.billing?.name ?? '',
        billingEmail: resultData?.attributes?.billing?.email ?? '',
        type: resultData?.attributes?.type ?? '',
      };

      await this.userPaymentMethod.setUpdatePaymentMethodToDefault(
        userId,
        paymentMethodDetails,
      );

      this.logger.debug(
        `paymentMethodDetails ${JSON.stringify(paymentMethodDetails)}`,
      );

      return result.data.data;
    } catch (error) {
      this.logger.error('Error creating payment method', error);
      throw error;
    }
  }

  async createPaymentIntent(userId: number, dto: CreatePaymentIntentDto) {
    try {
      const result = await axios.post<PaymongoPaymentIntent>(
        `${this.baseUrl}/payment_intents`,
        {
          data: {
            attributes: {
              amount: dto.amount,
              payment_method_allowed: [
                'qrph',
                'card',
                'dob',
                'paymaya',
                'billease',
                'gcash',
                'grab_pay',
              ],
              payment_method_options: {
                card: {
                  request_three_d_secure: 'any',
                },
              },
              currency: 'PHP',
              capture_type: 'automatic',
              description: `Payment for service request with a total amount of ${dto.amount}`,
            },
          },
        },
        { headers: this.headers },
      );

      return result.data.data;
    } catch (error) {
      this.logger.error('Error creating payment intent', error);
      throw error;
    }
  }

  async createAttach(
    userId: number,
    paymentIntentId: string,
    dto: CreateAttachIntentDto,
  ) {
    try {
      const data = {
        attributes: {
          payment_method: dto.payment_method,
          ...(dto.return_url != null && {
            return_url: dto.return_url,
          }),
        },
      };

      const result = await axios.post<PaymongoAttach>(
        `${this.baseUrl}/payment_intents/${paymentIntentId}/attach`,
        {
          data,
        },
        { headers: this.headers },
      );

      this.logger.debug(`createAttach ${JSON.stringify(result.data.data)}`);

      return result.data.data;
    } catch (error) {
      this.logger.error('Error attaching payment intent', error);
      throw error;
    }
  }

  async createPayment(
    userId: number,
    dto: CreatePaymentIntentDto,
    serviceRequestId: number,
  ): Promise<PaymongoAttach> {
    try {
      const attachDto: CreateAttachIntentDto = {
        payment_method: '',
      };

      const intentDto: CreatePaymentIntentDto = {
        amount: dto.amount * 100,
        currency: dto.currency,
        description: dto.description,
        capture_type: dto.capture_type,
      };

      const intent = await this.createPaymentIntent(userId, intentDto);

      let userPaymentMethod =
        await this.userPaymentMethod.getUserDefaultPaymentMethod(userId);

      if (userPaymentMethod == null) {
        throw new BadGatewayException('User not found!');
      }

      this.logger.debug(
        `userPaymentMethod ${JSON.stringify(userPaymentMethod)}`,
      );

      if (
        userPaymentMethod.paymentMethod.code == 'gcash' ||
        userPaymentMethod.paymentMethod.code == 'paymaya'
      ) {
        const cardDto: CreateCardDto = {
          type: userPaymentMethod.paymentMethod.code,
        };

        await this.createPaymentMethod(userId, cardDto);
        this.logger.debug(
          `Payment created for ${userPaymentMethod.paymentMethod.code}`,
        );

        userPaymentMethod =
          await this.userPaymentMethod.getUserDefaultPaymentMethod(userId);

        attachDto.return_url = `${process.env.BASE_URL}/api/paymongo/payment-complete?id=${serviceRequestId}`;
      }

      if (userPaymentMethod?.paymentMethodIdOnGateway == null) {
        throw new BadGatewayException('Payment method on gateway is not set!');
      }

      const paymentMethodIdOnGateway =
        userPaymentMethod.paymentMethodIdOnGateway;

      attachDto.payment_method = paymentMethodIdOnGateway;

      const result = await this.createAttach(userId, intent.id, attachDto);

      return { data: result };
    } catch (error) {
      this.logger.error(`Error processing payment. ${error}`);
      throw error;
    }
  }

  // async retrieveCustomer(email: string) {
  //   try {
  //     const result = await axios.get<PaymongoCustomer>(
  //       `${this.baseUrl}/customers`,
  //       {
  //         params: { email: email },
  //         headers: this.headers,
  //       },
  //     );

  //     return result.data.data[0];
  //   } catch (error) {
  //     this.logger.error('Error getting customer');
  //     throw error;
  //   }
  // }

  // async createCustomer(dto: CreateCustomerDto) {
  //   try {
  //     const customer = await this.retrieveCustomer(dto.email);
  //     if (customer.id != null) {
  //       return customer;
  //     }

  //     const result = await axios.post<PaymongoCreateCustomer>(
  //       `${this.baseUrl}/customers`,
  //       {
  //         data: {
  //           attributes: {
  //             first_name: dto.firstName,
  //             last_name: dto.lastName,
  //             email: dto.email,
  //             default_device: dto.defaultDevice,
  //           },
  //         },
  //       },
  //       { headers: this.headers },
  //     );

  //     return result.data.data;
  //   } catch (error) {
  //     this.logger.error('Error creating customer');
  //     throw error;
  //   }
  // }

  async fetchPaymentIntent(
    payment_intent_id: string,
  ): Promise<PaymongoPaymentIntent | null> {
    try {
      const response = await axios.get<PaymongoPaymentIntent>(
        `${this.baseUrl}/payment_intents/${payment_intent_id}`,
        {
          headers: this.headers,
        },
      );

      return response.data;
    } catch (e) {
      this.logger.error(`Error fetching payment ${e}`);
      return null;
    }
  }

  async paymentCompleteOutside(
    id: number,
    payment_intent_id: string,
  ): Promise<{ redirectUrl: string; token: string } | null> {
    if (payment_intent_id == null) {
      throw new BadGatewayException('Payment intent id is required.');
    }

    const serviceRequest = await this.serviceRequestService.findById(id);

    if (!serviceRequest) {
      throw new NotFoundException('Service Request not found!');
    }

    let token: string = '';

    const createdAt: any = new Date(serviceRequest.createdAt);
    const now: any = new Date();
    const diff = now - createdAt;

    if (
      serviceRequest.paymentStatus === PaymentStatus.paid &&
      diff > FIVE_MINUTES
    ) {
      token = '';
    } else {
      token = this.authService.giveTemporaryToken(serviceRequest.userId);
    }

    const dto: UpdateServiceRequestDto = {
      status: ServiceRequestStatus.awaitingAcceptance,
      paymentStatus: PaymentStatus.paid,
    };

    const paymentIntent = await this.fetchPaymentIntent(payment_intent_id);

    if (!paymentIntent) {
      this.logger.error('Failed to fetch payment intent');
      return null;
    }

    const paymentIdOnGateway = paymentIntent.data.attributes.payments[0]?.id;
    dto.paymentIdOnGateway = paymentIdOnGateway;

    const result = await this.serviceRequestService.updateServiceRequest(
      id,
      dto,
    );

    this.logger.debug(`paymentcompleteOutside: ${JSON.stringify(result)}`);

    return {
      redirectUrl: `manong_application://payment-complete?payment_intent_id=${payment_intent_id}`,
      token,
    };
  }

  async getPayment(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}`,
        { headers: this.headers },
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return response.data.data;
    } catch (error) {
      this.logger.error(`Error fetching payment ${paymentId}`, error);
      throw error;
    }
  }

  async canRefundPayment(
    paymentId: string,
  ): Promise<{ canRefund: boolean; availableDate?: Date; reason?: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payment = await this.getPayment(paymentId);

      // Check if payment is paid
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payment.attributes.status !== 'paid') {
        return {
          canRefund: false,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          reason: `Payment status is ${payment.attributes.status}, not paid.`,
        };
      }

      // Check available_at field - THIS IS THE KEY!
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const availableAt = payment.attributes.available_at;
      const now = Math.floor(Date.now() / 1000); // Current Unix timestamp

      if (availableAt && now < availableAt) {
        const availableDate = new Date(availableAt * 1000);
        const daysRemaining = Math.ceil((availableAt - now) / 86400); // Convert seconds to days

        return {
          canRefund: false,
          availableDate,
          reason: `Funds will be available for refund on ${availableDate.toDateString()} (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} from now).`,
        };
      }

      // Check if already refunded
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payment.attributes.refunds && payment.attributes.refunds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const totalRefunded = payment.attributes.refunds.reduce(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          (sum: number, refund: any) => sum + refund.attributes.amount,
          0,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (totalRefunded >= payment.attributes.amount) {
          return {
            canRefund: false,
            reason: 'Payment has already been fully refunded.',
          };
        }
      }

      return { canRefund: true };
    } catch (error) {
      this.logger.error(
        `Error checking refund eligibility for ${paymentId}`,
        error,
      );
      return {
        canRefund: false,
        reason: 'Unable to verify payment status.',
      };
    }
  }

  async requestRefund(
    userId: number,
    serviceRequestId: number,
    isAdmin?: boolean,
  ): Promise<{ data: PaymongoRefund; refundAmount: number } | null> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const serviceRequest =
      await this.serviceRequestService.findByIdIncludesPaymentTransaction(
        serviceRequestId,
      );

    if (!serviceRequest) {
      throw new NotFoundException('Service Request not found!');
    }

    if (!isAdmin && serviceRequest.userId !== userId) {
      throw new BadGatewayException('User is not permitted!');
    }

    const paymentIntentId: any =
      serviceRequest.paymentTransactions[0].paymentIntentId;

    if (!paymentIntentId) {
      throw new NotFoundException('Service Request intent id not found!');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const paymentIntent = await this.fetchPaymentIntent(paymentIntentId);
    const paymentId = paymentIntent?.data.attributes.payments[0].id;

    if (!paymentId) {
      throw new NotFoundException('Payment Id not found!');
    }

    const eligibility = await this.canRefundPayment(paymentId);
    if (!eligibility.canRefund) {
      throw new BadGatewayException(
        eligibility.reason || 'Refund cannot be processed at this time.',
      );
    }
    // ============ END OF NEW CHECK ============

    // Calculate refund amount
    let refundAmount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payment = await this.getPayment(paymentId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const netAmountInCents = payment.attributes.net_amount; // e.g., 24375 (₱243.75)
    const netAmountInPesos = netAmountInCents / 100; // e.g., 243.75

    const refundAmountInPesos = calculateRefundAmount(
      serviceRequest.status!,
      netAmountInPesos, // Pass in pesos
    );

    refundAmount = Math.round(refundAmountInPesos * 100);

    // Check if this is a same-day payment
    const paymentCreatedAt = new Date(serviceRequest.createdAt);
    const now = new Date();
    const isSameDay = paymentCreatedAt.toDateString() === now.toDateString();

    // Check if this is a partial refund
    const isPartialRefund = refundAmount < netAmountInCents;

    // Paymongo doesn't allow same-day partial refunds
    if (isSameDay && isPartialRefund) {
      this.logger.error(
        'Paymongo Error: Cannot partially refund for payments done on the same day',
      );
      throw new BadGatewayException('same_day_partial_refund_not_allowed');
    }

    const data = {
      attributes: {
        amount: refundAmount,
        payment_id: paymentId,
        reason: 'requested_by_customer',
      },
    };

    console.log(`requestRefund ${JSON.stringify(data)}`);

    try {
      const response = await axios.post<PaymongoRefund>(
        `${this.baseUrl}/refunds`,
        {
          data,
        },
        {
          headers: this.headers,
        },
      );

      const dto: UpdateServiceRequestDto = {
        refundIdOnGateway: response.data.data.id,
        paymentStatus: mapPaymongoRefundStatus(
          response.data.data.attributes.status ?? '',
        ),
      };

      await this.serviceRequestService.updateServiceRequestStatusForRefund(
        serviceRequest.id,
        dto,
      );

      return {
        data: response.data,
        refundAmount: refundAmount / 100, // Convert cents to pesos
      };
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (axios.isAxiosError(e) && e.response?.data?.errors) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const errors = e.response.data.errors;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const firstError = errors[0];
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Paymongo Refund Error - Code: ${firstError.code}, Detail: ${firstError.detail}`,
        );
        this.logger.debug(JSON.stringify(data));

        // Re-throw specific errors so they can be handled upstream
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (firstError.code === 'same_day_partial_refund_not_allowed') {
          throw new BadGatewayException('same_day_partial_refund_not_allowed');
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (firstError.code === 'available_balance_insufficient') {
          throw new BadGatewayException(
            `available_balance_insufficient: ${eligibility.reason || 'Funds not available for refund yet.'}`,
          );
        }
      } else {
        this.logger.error(`Unexpected refund error: ${e}`);
      }
    }

    return null;
  }

  async fetchRefund(
    userId: number,
    serviceRequestId: number,
  ): Promise<PaymongoRefund | null> {
    const serviceRequest =
      await this.serviceRequestService.findByIdIncludesPaymentTransaction(
        serviceRequestId,
      );

    if (!serviceRequest) {
      throw new NotFoundException('Service Request not found!');
    }

    if (serviceRequest.userId != userId) {
      throw new BadGatewayException('User is not permitted!');
    }

    const refundId = serviceRequest.paymentTransactions[0].refundIdOnGateway;

    try {
      const response = await axios.get<PaymongoRefund>(
        `${this.baseUrl}/refunds/${refundId}`,
        {
          headers: this.headers,
        },
      );

      return response.data;
    } catch (e) {
      this.logger.error(`Error fetching refund ${e}`);
    }

    return null;
  }
}
