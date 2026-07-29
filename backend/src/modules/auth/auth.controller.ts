import { Controller, Post, Body, UseGuards, Get, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TelegramInitDataDto, AuthResponseDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate with Telegram Mini App' })
  async authenticateWithTelegram(@Body() dto: TelegramInitDataDto): Promise<AuthResponseDto> {
    return this.authService.authenticateWithTelegram(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() body: { refreshToken: string }): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Get('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify if token is valid' })
  async verifyToken(@Headers('authorization') authHeader: string): Promise<{ valid: boolean }> {
    if (!authHeader) {
      return { valid: false };
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      this.authService.verifyToken(token);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  }
}
