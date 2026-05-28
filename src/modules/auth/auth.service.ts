import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return null;

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      role: user.role,
    };

    const { password, ...safeUser } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: safeUser,
    };
  }

  async register(username: string, password: string) {
    const hash = await bcrypt.hash(password, 10);

    return this.usersService.create({
      username,
      password: hash,
      role: 'USER',
    });
  }
}
