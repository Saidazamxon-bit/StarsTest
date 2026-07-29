import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('transactions')
@Index('idx_transactions_wallet_id', ['walletId'])
@Index('idx_transactions_type', ['type'])
@Index('idx_transactions_status', ['status'])
@Index('idx_transactions_request_id', ['requestId'])
@Index('idx_transactions_idempotency_key', ['idempotencyKey'])
export class Transaction {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'bigint' })
  walletId: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ default: 'UZS' })
  currency: string;

  @Column()
  type: string; // deposit, withdraw, purchase, refund, reward, referral_bonus, case_opening, item_sell, admin_adjustment, chargeback

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  destination: string;

  @Column({ default: 'completed' })
  status: string; // pending, completed, failed, reversed

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column({ type: 'uuid', nullable: true })
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'bigint', nullable: true })
  createdBy: number;

  @Column({ type: 'uuid', nullable: true })
  auditReference: string;
}
