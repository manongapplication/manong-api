import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createFeedbackByServiceRequestId(
    @CurrentUserId() userId: number,
    @Body() dto: CreateFeedbackDto,
  ) {
    const result = await this.feedbackService.createFeedbackByServiceRequestId(
      userId,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Thank you for your feedback!',
    };
  }
}
