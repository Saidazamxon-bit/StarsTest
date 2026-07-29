import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
@Index('idx_wallets_user_id', ['userId'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', unique: true })
  userId: number;

  @Column({ default: 'UZS' })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  frozenBalance: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalSpent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Relations
  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
