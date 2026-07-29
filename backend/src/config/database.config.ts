import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ultra_marketplace',
  entities: [path.join(__dirname, '../modules/**/entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.NODE_ENV === 'production',
  extra: {
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

export const appConfig = {
  port: parseInt(process.env.APP_PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'ultra-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebAppUrl: process.env.TELEGRAM_WEB_APP_URL || '',
};
