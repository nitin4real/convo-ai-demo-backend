import { Repository, ObjectLiteral } from 'typeorm';
import { PlatformAdmin } from '../models/Admin';
import { PlatformUser } from '../models/User';
import { AppDataSource } from '../config/database';

class DbStorage<T extends ObjectLiteral> {
  private repository: Repository<T>;

  constructor(entity: new () => T) {
    this.repository = AppDataSource.getRepository(entity);
  }

  async getAll(): Promise<T[]> {
    return this.repository.find();
  }

  async getById(id: number): Promise<T | null> {
    return this.repository.findOneBy({ id } as any);
  }

  async create(item: T): Promise<T> {
    const newItem = this.repository.create(item);
    return this.repository.save(newItem);
  }

  async update(id: number, updates: Partial<T>): Promise<T | null> {
    await this.repository.update(id, updates as any);
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}

export const adminStorage = new DbStorage<PlatformAdmin>(PlatformAdmin);
export const userStorage = new DbStorage<PlatformUser>(PlatformUser); 