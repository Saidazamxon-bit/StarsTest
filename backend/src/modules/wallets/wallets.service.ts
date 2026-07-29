import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  /**
   * Get wallet balance for a user
   */
  async getBalance(userId: number) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: wallet.balance,
      frozenBalance: wallet.frozenBalance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      availableBalance: Number(wallet.balance) - Number(wallet.frozenBalance),
    };
  }

  /**
   * Add funds to wallet (Deposit)
   * This creates an immutable transaction record
   */
  async addFunds(
    userId: number,
    amount: number,
    source: string,
    reason: string,
    metadata: any = {},
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet with lock
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + amount;
      wallet.totalEarned = Number(wallet.totalEarned) + amount;
      wallet.version++;
      await queryRunner.manager.save(wallet);

      // Create immutable transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        transactionId: uuidv4(),
        walletId: wallet.id,
        amount,
        currency: wallet.currency,
        type: 'deposit',
        source,
        status: 'completed',
        reason,
        metadata,
        requestId: uuidv4(),
        createdBy: userId,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        balance: wallet.balance,
        transaction: transaction.transactionId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Withdraw funds from wallet
   * Checks balance first, then creates transaction
   */
  async withdrawFunds(
    userId: number,
    amount: number,
    destination: string,
    reason: string,
    idempotencyKey?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Check for duplicate transaction (idempotency)
    if (idempotencyKey) {
      const existing = await this.transactionRepository.findOne({
        where: { idempotencyKey },
      });

      if (existing) {
        if (existing.status === 'completed') {
          return { balance: existing.metadata.newBalance, transaction: existing.transactionId };
        }
        if (existing.status === 'failed') {
          throw new BadRequestException('This transaction has already failed');
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet with lock
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const availableBalance = Number(wallet.balance) - Number(wallet.frozenBalance);
      if (availableBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Update wallet
      wallet.balance = Number(wallet.balance) - amount;
      wallet.totalSpent = Number(wallet.totalSpent) + amount;
      wallet.version++;
      await queryRunner.manager.save(wallet);

      // Create transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        transactionId: uuidv4(),
        walletId: wallet.id,
        amount,
        currency: wallet.currency,
        type: 'withdraw',
        destination,
        status: 'completed',
        reason,
        metadata: { newBalance: wallet.balance },
        requestId: uuidv4(),
        idempotencyKey,
        createdBy: userId,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        balance: wallet.balance,
        transaction: transaction.transactionId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Freeze balance (for pending operations like case opening)
   */
  async freezeBalance(userId: number, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const availableBalance = Number(wallet.balance) - Number(wallet.frozenBalance);
      if (availableBalance < amount) {
        throw new BadRequestException('Insufficient available balance');
      }

      wallet.frozenBalance = Number(wallet.frozenBalance) + amount;
      wallet.version++;
      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();
      return { frozenBalance: wallet.frozenBalance };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unfreeze balance
   */
  async unfreezeBalance(userId: number, amount: number) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (Number(wallet.frozenBalance) < amount) {
      throw new BadRequestException('Cannot unfreeze more than frozen balance');
    }

    wallet.frozenBalance = Number(wallet.frozenBalance) - amount;
    wallet.version++;
    await this.walletRepository.save(wallet);

    return { frozenBalance: wallet.frozenBalance };
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: number, limit: number = 20, offset: number = 0) {
    // Get wallet first
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get transactions
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions: transactions.map((t) => ({
        id: t.transactionId,
        type: t.type,
        amount: t.amount,
        source: t.source,
        destination: t.destination,
        status: t.status,
        createdAt: t.createdAt,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
