import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    // Vérifie aussi que la base répond.
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'syndic-alpha-api', db: 'up' };
  }
}
