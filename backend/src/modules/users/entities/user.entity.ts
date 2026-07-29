import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne } from 'typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';

@Entity('users')
@Index('idx_users_telegram_id', ['telegramId'], { unique: true })
@Index('idx_users_username', ['username'], { unique: true })
@Index('idx_users_status', ['status'])
@Index('idx_users_created_at', ['createdAt'])
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: 'uz' })
  language: string;

  @Column({ nullable: true })
  region: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ default: false })
  premiumStatus: boolean;

  @Column({ default: 0 })
  vipLevel: number;

  @Column({ type: 'uuid' })
  referralCode: string;

  @Column({ type: 'bigint', nullable: true })
  invitedBy: number;

  @Column({ default: 'active' }) // active, suspended, banned
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ type: 'jsonb', default: {} })
  flags: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'bigint', nullable: true })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true })
  updatedBy: number;

  @Column({ default: 1 })
  version: number;

  // Relations
  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;
}
