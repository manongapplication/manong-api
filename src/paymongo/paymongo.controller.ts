import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Headers,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
  Get,
  Res,
} from '@nestjs/common';
import { PaymongoService } from './paymongo.service';
import { CreateCardDto } from './dto/create-card.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateAttachIntentDto } from './dto/create-attach-intent.dto';
import type { Response } from 'express';
import { join } from 'path';
import { FetchRefundPaymentDto } from './dto/fetch-refund-payment.dto';
import { readFileSync } from 'fs';

@Controller('api/paymongo')
export class PaymongoController {
  private readonly logger = new Logger(PaymongoController.name);

  constructor(private readonly paymongoService: PaymongoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-payment-method')
  async createCard(
    @CurrentUserId() userId: number,
    @Body() dto: CreateCardDto,
  ) {
    const result = await this.paymongoService.createPaymentMethod(userId, dto);

    return {
      success: true,
      data: result,
      message:
        result != null ? 'Card added successfully!' : 'Failed to add the card',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-intents')
  async createIntent(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const result = await this.paymongoService.createPaymentIntent(userId, dto);

    return {
      success: true,
      data: result,
      message:
        result != null
          ? 'Checkout session is ready. Continue to payment.'
          : 'Something went wrong while creating the payment intent. Please try again later.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-intents/:intentId/attach')
  async createAttach(
    @CurrentUserId() userId: number,
    @Param('intentId', ParseIntPipe) intentId: string,
    @Body() dto: CreateAttachIntentDto,
  ) {
    const result = await this.paymongoService.createAttach(
      userId,
      intentId,
      dto,
    );

    return {
      success: true,
      data: result,
      message:
        result != null
          ? 'Payment method successfully attached to the intent. Please proceed to confirmation.'
          : 'Something went wrong while attaching the payment method. Please try again later.',
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('payments')
  // async createPayment(
  //   @CurrentUserId() userId: number,
  //   @Body() dto: CreatePaymentIntentDto,
  // ) {
  //   const result = await this.paymongoService.createPayment(userId, dto);

  //   let message = 'We couldn’t process your payment. Please try again later.';

  //   if (result) {
  //     switch (result.data.attributes.payments[0].attributes.status) {
  //       case 'paid':
  //         message =
  //           'Your payment was successful! A service provider will be on the way shortly.';
  //         break;
  //       case 'awaiting_next_action':
  //         message =
  //           'Your payment requires additional action. Please complete the steps to confirm your booking.';
  //         break;
  //       case 'pending':
  //         message =
  //           'Your payment is pending. We’ll update you once it’s confirmed and assign a provider.';
  //         break;
  //       case 'failed':
  //         message =
  //           'Payment failed. Please try again or use a different payment method.';
  //         break;
  //       case 'cancelled':
  //         message = 'Payment was cancelled. No booking has been made.';
  //         break;
  //       default:
  //         message = `Payment status: ${result.data.attributes.payments[0].attributes.status}`;
  //     }
  //   }

  //   return {
  //     success: true,
  //     data: result,
  //     message,
  //   };
  // }

  @Get('payment-complete')
  async paymentcompleteOutside(
    @Query('id') id: number,
    @Query('payment_intent_id') payment_intent_id: string,
    @Res() res: Response,
  ) {
    const result = await this.paymongoService.paymentCompleteOutside(
      id,
      payment_intent_id,
    );

    if (!result) {
      return res.status(400).send('Payment verification failed.');
    }

    // Generate a short-lived JWT token for the frontend
    const token = result.token;

    // Read static HTML
    const filePath = join(process.cwd(), 'public', 'payment-successful.html');
    let html = readFileSync(filePath, 'utf-8');

    // Inject token into HTML
    html = html.replace('%%JWT_TOKEN%%', token);

    res.send(html);
  }

  @Get('wallet-payment-complete')
  async walletPaymentcompleteOutside(
    @Query('id') id: number,
    @Query('payment_intent_id') payment_intent_id: string,
    @Res() res: Response,
  ) {
    const result = await this.paymongoService.paymentCompleteOutside(
      id,
      payment_intent_id,
    );

    if (!result) {
      return res.status(400).send('Payment verification failed.');
    }

    // Generate a short-lived JWT token for the frontend
    const token = result.token;

    // Read static HTML
    const filePath = join(process.cwd(), 'public', 'payment-successful.html');
    let html = readFileSync(filePath, 'utf-8');

    // Inject token into HTML
    html = html.replace('%%JWT_TOKEN%%', token);

    res.send(html);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post('create-customer')
  // async createCustomer(@Body() dto: CreateCustomerDto) {
  //   const result = await this.paymongoService.createCustomer(dto);

  //   return {
  //     success: result.id != null,
  //     data: result,
  //     message:
  //       result.id != null
  //         ? 'Account for payment created successfully!'
  //         : 'Unable to create account for payment!',
  //   };
  // }

  // -- Webhook --
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/require-await
  async handleWebhook(
    @Body() body: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Headers('paymongo-signature') signature: string,
  ) {
    this.logger.log('Webhook received from PayMongo: ' + JSON.stringify(body));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const eventType = body?.data?.attributes?.type;

    if (!eventType) {
      return { received: true };
    }

    switch (eventType) {
      case 'payment_intent.succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const intentId = body.data.id;
        this.logger.log(`PaymentIntent succeeded! Intent ID: ${intentId}`);
        // mark order/service as paid
        break;
      }

      case 'payment.paid': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const paymentId = body.data.id;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const intentId =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          body.data.attributes.data?.attributes?.payment_intent_id;
        this.logger.log(
          `Payment succeeded! Payment ID: ${paymentId}, Intent ID: ${intentId}`,
        );
        // mark order/service as paid
        break;
      }

      case 'payment.refund.updated': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const refundId = body.data.id;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const status = body.data.attributes.status;

        // CALL SERVICE METHOD TO UPDATE REFUND STATUS
        await this.paymongoService.handleRefundUpdate(refundId, status);
        break;
      }

      case 'payment_intent.failed': {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const failedId = body.data.id;
        this.logger.warn(`PaymentIntent failed: ${failedId}`);
        // update to failed
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${eventType}`);
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  async fetchRefund(@Body() dto: FetchRefundPaymentDto) {
    const result = await this.paymongoService.fetchRefund(
      dto.userId,
      dto.serviceRequest,
    );

    return {
      success: true,
      data: result,
      message: 'Service Request refund fetched!',
    };
  }
}
