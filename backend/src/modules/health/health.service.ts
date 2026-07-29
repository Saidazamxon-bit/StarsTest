import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }
}
