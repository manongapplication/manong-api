import { Controller, Get } from '@nestjs/common';

@Controller('env')
export class EnvController {
  @Get()
  getEnv() {
    return {
      API_URL: process.env.API_URL,
    };
  }
}
