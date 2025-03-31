import { PlatformUser, UserCreateRequest, UserUpdateInput, UserQueryParams, PaginatedResponse } from '../models/User';
import { userStorage } from './dbStorage';
import { AuthService } from './authService';

export class UserService {
  private static async generateUniqueId(): Promise<number> {
    const users = await userStorage.getAll();
    const existingIds = new Set(users.map(user => user.id));
    
    let newId: number;
    do {
      // Generate a random number between 1000 and 9999
      newId = Math.floor(Math.random() * 9000) + 1000;
    } while (existingIds.has(newId));
    
    return newId;
  }

  static async createUser(input: UserCreateRequest, adminId: number): Promise<{ user: PlatformUser; password: string }> {
    const password = input.password || AuthService.generateRandomPassword();
    const hashedPassword = await AuthService.hashPassword(password);
    const uniqueId = await this.generateUniqueId();

    const user: PlatformUser = {
      id: uniqueId,
      name: input.name,
      totalMinutes: input.minutes,
      remainingMinutes: input.minutes,
      email: input.email || '',
      notes: input.notes || '',
      status: 'active',
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminId
    };

    const createdUser = await userStorage.create(user);
    return { user: createdUser, password };
  }

  static async updateUser(id: number, updates: UserUpdateInput): Promise<PlatformUser | null> {
    return userStorage.update(id, updates);
  }

  static async deleteUser(id: number): Promise<boolean> {
    return userStorage.delete(id);
  }

  static async getUsers(params: UserQueryParams = {}): Promise<PaginatedResponse<PlatformUser>> {
    const { page = 1, limit = 10, status } = params;
    const users = await userStorage.getAll();

    // Apply filters
    let filteredUsers = users;
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated data
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      data: paginatedUsers,
      pagination: {
        total,
        pages,
        currentPage: page,
        limit
      }
    };
  }

  static async getUserById(id: number): Promise<PlatformUser | null> {
    return userStorage.getById(id);
  }
} 