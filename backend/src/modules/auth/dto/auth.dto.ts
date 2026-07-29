import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class TelegramInitDataDto {
  @IsString()
  @IsNotEmpty()
  initData: string;
}

export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    telegramId: number;
    username: string;
    displayName: string;
    premiumStatus: boolean;
    vipLevel: number;
  };
}

export class RegisterDto {
  @IsNumber()
  telegramId: number;

  @IsString()
  username: string;

  @IsString()
  displayName: string;

  language?: string;
  region?: string;
  avatarUrl?: string;
}

export class JwtPayloadDto {
  id: number;
  telegramId: number;
  username: string;
  iat: number;
  exp: number;
}
