import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('register')
  getRegister(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'become-a-manong.html'));
  }
}
