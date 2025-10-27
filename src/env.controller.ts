import { Controller, ForbiddenException, Get, Req } from '@nestjs/common';

@Controller('env')
export class EnvController {
  @Get()
  getEnv(@Req() req) {
    if (process.env.NODE_ENV === 'development') {
      return { API_URL: process.env.API_URL };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (!req.headers.referer?.includes('manongapp.com')) {
      throw new ForbiddenException();
    }

    return {
      API_URL: process.env.API_URL,
    };
  }
}
