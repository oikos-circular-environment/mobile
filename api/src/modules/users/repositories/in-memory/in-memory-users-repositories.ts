import { randomUUID } from "node:crypto";
import type { CreateUser, User } from "@/modules/users/entities/user";
import type { UsersRepository } from "../users-repository";

export class InMemoryUsersRepository implements UsersRepository {
  public items: User[] = [];

  async findById(id: string) {
    const user = this.items.find((item) => item.id === id);

    if (!user) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = this.items.find((item) => item.email === email);

    if (!user) {
      return null;
    }

    return user;
  }

  async create(data: CreateUser) {
    const user = {
      id: randomUUID(),
      name: data.name,
      email: data.email,
      created_at: new Date(),
    };

    this.items.push(user);

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.items;
  }
}
