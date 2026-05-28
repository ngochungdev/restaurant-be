import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  // CREATE
  create(user: Partial<User>) {
    return this.repo.save(user).then((saved) => this.omitPassword(saved));
  }

  // FIND ALL
  findAll() {
    return this.repo
      .find()
      .then((users) => users.map((user) => this.omitPassword(user)));
  }

  // FIND ONE BY ID
  findOne(id: number) {
    return this.repo
      .findOne({
        where: { id },
      })
      .then((user) => this.omitPassword(user));
  }

  // FIND BY USERNAME
  findByUsername(username: string) {
    return this.repo.findOne({
      where: { username },
    });
  }

  private omitPassword(user: Partial<User> | null) {
    if (!user) return user;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // UPDATE
  async update(id: number, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  // DELETE
  delete(id: number) {
    return this.repo.delete(id);
  }
}
