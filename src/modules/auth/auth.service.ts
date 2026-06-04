import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN_DAYS } from './jwt.constants';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return null;

    return user;
  }

  async login(user: any) {
    const { password, ...safeUser } = user;
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: this.signAccessToken(user),
      refresh_token: refreshToken,
      expires_in: JWT_EXPIRES_IN,
      user: safeUser,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const currentToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (
      !currentToken ||
      currentToken.revokedAt ||
      currentToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const replacement = this.generateRefreshToken();

    await this.refreshTokenRepository.manager.transaction(async (manager) => {
      await manager.save(
        this.refreshTokenRepository.create({
          userId: currentToken.userId,
          tokenHash: replacement.hash,
          expiresAt: replacement.expiresAt,
        }),
      );

      currentToken.revokedAt = new Date();
      currentToken.replacedByTokenHash = replacement.hash;
      await manager.save(currentToken);
    });

    const { password, ...safeUser } = currentToken.user;

    return {
      access_token: this.signAccessToken(currentToken.user),
      refresh_token: replacement.token,
      expires_in: JWT_EXPIRES_IN,
      user: safeUser,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const currentToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (currentToken && !currentToken.revokedAt) {
      currentToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(currentToken);
    }

    return { loggedOut: true };
  }

  async register(username: string, password: string) {
    const hash = await bcrypt.hash(password, 10);

    return this.usersService.create({
      username,
      password: hash,
      role: 'USER',
    });
  }

  private signAccessToken(user: Pick<User, 'id' | 'role'>) {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
    });
  }

  private async createRefreshToken(userId: number) {
    const refreshToken = this.generateRefreshToken();

    await this.refreshTokenRepository.save({
      userId,
      tokenHash: refreshToken.hash,
      expiresAt: refreshToken.expiresAt,
    });

    return refreshToken.token;
  }

  private generateRefreshToken() {
    const token = randomBytes(64).toString('hex');

    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: this.createRefreshTokenExpiry(),
    };
  }

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private createRefreshTokenExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

    return expiresAt;
  }
}
