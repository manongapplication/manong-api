import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserPaymentMethodService } from './user-payment-method.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CreateUserPaymentMethodDto } from './dto/create-user-payment-method.dto';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller('api/user-payment-methods')
export class UserPaymentMethodController {
  constructor(
    private readonly userPaymentMethodService: UserPaymentMethodService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async save(
    @CurrentUserId() userId: number,
    @Body() dto: CreateUserPaymentMethodDto,
  ) {
    const result = await this.userPaymentMethodService.createUserPaymentMethod(
      userId,
      dto,
    );

    return {
      success: true,
      data: result.record,
      message: result.isNew
        ? 'Payment method saved and set as default!'
        : 'Payment method already exists, set as default.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/card')
  async saveCard(
    @CurrentUserId() userId: number,
    @Body('paymentMethodIdOnGateway') paymentMethodIdOnGateway: string,
  ) {
    const result =
      await this.userPaymentMethodService.setDefaultCardPaymentMethod(
        userId,
        paymentMethodIdOnGateway,
      );

    return {
      success: true,
      data: result,
      message: result
        ? 'Card set as default!'
        : 'Failed to set the card as default. Please try again later.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@CurrentUserId() userId: number) {
    const data =
      await this.userPaymentMethodService.getUserPaymentMethods(userId);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('default')
  async getDefaultPaymentMethod(@CurrentUserId() userId: number) {
    const data =
      await this.userPaymentMethodService.getUserDefaultPaymentMethod(userId);

    return { success: true, data };
  }
}
