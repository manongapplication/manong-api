import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class OtpQueueService {
  constructor(@InjectQueue('otp') private otpQueue: Queue) {}

  async sendOTP(phone: string, userId?: number): Promise<{ jobId: string }> {
    const job = await this.otpQueue.add(
      'send',
      { phone, userId },
      {
        jobId: `otp_${phone}_${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        priority: 1,
      },
    );

    return { jobId: job.id.toString() };
  }

  async getJobStatus(jobId: string) {
    const job = await this.otpQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const progress = job.progress();

    return {
      id: job.id,
      status: state,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      progress,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: job.data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result: job.returnvalue,
      error: job.failedReason,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.otpQueue.getWaitingCount(),
      this.otpQueue.getActiveCount(),
      this.otpQueue.getCompletedCount(),
      this.otpQueue.getFailedCount(),
      this.otpQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}
