import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class ApiResponseDto<T> {
  @IsEnum(['success', 'error'])
  status: 'success' | 'error';

  @IsString()
  message: string;

  @IsOptional()
  data?: T;

  @IsOptional()
  @IsNumber()
  code?: number;

  @IsString()
  requestId: string;

  @IsString()
  timestamp: string;
}

export class PaginationDto {
  @IsNumber()
  page: number = 1;

  @IsNumber()
  limit: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export enum ErrorCode {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  TELEGRAM_ERROR = 'TELEGRAM_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_IDEMPOTENCY = 'INVALID_IDEMPOTENCY',
}
