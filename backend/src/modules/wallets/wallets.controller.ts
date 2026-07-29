import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  async getBalance(@Request() req: any) {
    return this.walletsService.getBalance(req.user.id);
  }

  @Post('add-funds')
  @ApiOperation({ summary: 'Add funds to wallet (Admin only)' })
  async addFunds(
    @Request() req: any,
    @Body() body: { amount: number; source: string; reason: string },
  ) {
    return this.walletsService.addFunds(req.user.id, body.amount, body.source, body.reason);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  async withdrawFunds(
    @Request() req: any,
    @Body() body: { amount: number; destination: string; reason: string },
  ) {
    return this.walletsService.withdrawFunds(req.user.id, body.amount, body.destination, body.reason);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactionHistory(@Request() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    const offset = (page - 1) * limit;
    return this.walletsService.getTransactionHistory(req.user.id, limit, offset);
  }
}
