import axios from 'axios';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';
import { UserPaymentMethodService } from 'src/user-payment-method/user-payment-method.service';
import { CreateCardDto } from './dto/create-card.dto';
import {
  BadGatewayException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateAttachIntentDto } from './dto/create-attach-intent.dto';
import { UpdateUserPaymentMethodDto } from 'src/user-payment-method/dto/update-user-payment-method.dto';
import {
  PaymongoAttach,
  PaymongoPaymentIntent,
  PaymongoPaymentMethod,
} from './types/paymongo.types';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { UpdateServiceRequestDto } from 'src/service-request/dto/update-service-request.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymongoService {
  private readonly logger = new Logger(PaymongoService.name);

  constructor(
    private readonly userPaymentMethod: UserPaymentMethodService,
    @Inject(forwardRef(() => ServiceRequestService))
    private readonly serviceRequestService: ServiceRequestService,
    private readonly paymentMethod: PaymentMethodService,
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

      if (userPaymentMethod.paymentMethod.code == 'gcash') {
        const cardDto: CreateCardDto = {
          type: 'gcash',
        };

        await this.createPaymentMethod(userId, cardDto);
        this.logger.debug(`Payment created for gcash`);

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

  async paymentCompleteOutside(id: number, payment_intent_id: string) {
    if (payment_intent_id == null) {
      throw new BadGatewayException('Payment intent id is required.');
    }

    const dto: UpdateServiceRequestDto = {
      status: 'awaitingAcceptance',
      paymentStatus: PaymentStatus.paid,
    };

    const result = await this.serviceRequestService.updateServiceRequest(
      id,
      dto,
    );

    this.logger.debug(`paymentcompleteOutside: ${JSON.stringify(result)}`);

    return `manong_application://payment-complete?payment_intent_id=${payment_intent_id}`;
  }
}
