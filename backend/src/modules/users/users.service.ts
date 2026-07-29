import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByTelegramId(telegramId: number): Promise<User> {
    return this.userRepository.findOne({
      where: { telegramId, deletedAt: null },
      relations: ['wallet'],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username, deletedAt: null },
      relations: ['wallet'],
    });
  }

  async getProfile(userId: number) {
    const user = await this.findById(userId);
    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      displayName: user.displayName,
      language: user.language,
      region: user.region,
      avatarUrl: user.avatarUrl,
      premiumStatus: user.premiumStatus,
      vipLevel: user.vipLevel,
      referralCode: user.referralCode,
      balance: user.wallet?.balance || 0,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: number, updateData: any) {
    await this.userRepository.update(userId, updateData);
    return this.getProfile(userId);
  }

  async getReferralCode(userId: number): Promise<string> {
    const user = await this.findById(userId);
    return user.referralCode;
  }

  async getPublicProfile(username: string) {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      vipLevel: user.vipLevel,
      premiumStatus: user.premiumStatus,
      createdAt: user.createdAt,
    };
  }
}
