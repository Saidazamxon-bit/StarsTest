import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CasesModule } from './modules/cases/cases.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { MissionsModule } from './modules/missions/missions.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    AuthModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    CasesModule,
    InventoryModule,
    ReferralsModule,
    MissionsModule,
    EventsModule,
    NotificationsModule,
    AuditModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
