import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { TelegramInitDataDto, AuthResponseDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  /**
   * Validate Telegram Mini App Init Data
   * This is the PRIMARY authentication mechanism for Telegram Mini Apps
   */
  validateTelegramInitData(initData: string): any {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN not configured');
      }

      // Parse query string
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      const paramList = Array.from(params.keys())
        .filter((key) => key !== 'hash')
        .sort();

      // Recreate data check string
      let dataCheckString = '';
      for (const key of paramList) {
        dataCheckString += `${key}=${params.get(key)}\n`;
      }
      dataCheckString = dataCheckString.slice(0, -1);

      // Calculate hash
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      // Verify hash
      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid Telegram signature');
      }

      // Verify timestamp (must be within 1 day)
      const authDate = parseInt(params.get('auth_date'));
      const now = Math.floor(Date.now() / 1000);
      if (now - authDate > 86400) {
        throw new UnauthorizedException('Telegram auth date expired');
      }

      // Parse user object
      const user = JSON.parse(params.get('user'));
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid Telegram init data: ' + error.message);
    }
  }

  /**
   * Authenticate user with Telegram Mini App Init Data
   */
  async authenticateWithTelegram(dto: TelegramInitDataDto): Promise<AuthResponseDto> {
    // Validate Telegram init data
    const telegramUser = this.validateTelegramInitData(dto.initData);

    if (!telegramUser.id) {
      throw new BadRequestException('Invalid Telegram user data');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { telegramId: telegramUser.id },
    });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        telegramId: telegramUser.id,
        username: telegramUser.username || `user_${telegramUser.id}`,
        displayName: telegramUser.first_name || 'User',
        avatarUrl: this.getTelegramAvatarUrl(telegramUser.id),
        premiumStatus: telegramUser.is_premium || false,
        language: telegramUser.language_code || 'uz',
        status: 'active',
      });

      user = await this.userRepository.save(user);

      // Create wallet for new user
      const wallet = this.walletRepository.create({
        userId: user.id,
        balance: 0,
        currency: 'UZS',
      });
      await this.walletRepository.save(wallet);
    } else if (user.status === 'banned' || user.status === 'suspended') {
      throw new UnauthorizedException('User account is ' + user.status);
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private generateTokens(user: User): AuthResponseDto {
    const payload = {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET + '_refresh',
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        premiumStatus: user.premiumStatus,
        vipLevel: user.vipLevel,
      },
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token: ' + error.message);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET + '_refresh',
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = this.jwtService.sign(
        {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token: ' + error.message);
    }
  }

  private getTelegramAvatarUrl(telegramId: number): string {
    return `https://api.telegram.org/file/botXXX/photos/${telegramId}.jpg`;
  }
}
