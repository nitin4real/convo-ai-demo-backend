import { PlatformAdmin, AdminCreateInput } from '../models/Admin';
import { adminStorage } from './dbStorage';
import { AuthService } from './authService';
import { PaginatedResponse } from '../models/User';

export class AdminService {
  private static async generateUniqueId(): Promise<number> {
    const admins = await adminStorage.getAll();
    const existingIds = new Set(admins.map(admin => admin.id));
    
    let newId: number;
    do {
      // Generate a random number between 1000 and 9999
      newId = Math.floor(Math.random() * 9000) + 1000;
    } while (existingIds.has(newId));
    
    return newId;
  }

  static async createAdmin(input: AdminCreateInput): Promise<{ admin: Omit<PlatformAdmin, 'password'>; password: string }> {
    const password = input.password || AuthService.generateRandomPassword();
    const hashedPassword = await AuthService.hashPassword(password);
    const uniqueId = await this.generateUniqueId();

    const admin: PlatformAdmin = {
      id: uniqueId,
      name: input.name,
      password: hashedPassword
    };

    const createdAdmin = await adminStorage.create(admin);
    const { password: _, ...adminWithoutPassword } = createdAdmin;
    return { admin: adminWithoutPassword, password };
  }

  static async updateAdmin(id: number, updates: Partial<AdminCreateInput>): Promise<Omit<PlatformAdmin, 'password'> | null> {
    if (updates.password) {
      updates.password = await AuthService.hashPassword(updates.password);
    }
    const updatedAdmin = await adminStorage.update(id, updates);
    if (!updatedAdmin) return null;
    const { password: _, ...adminWithoutPassword } = updatedAdmin;
    return adminWithoutPassword;
  }

  static async deleteAdmin(id: number): Promise<boolean> {
    return adminStorage.delete(id);
  }

  static async getAdminById(id: number): Promise<Omit<PlatformAdmin, 'password'> | null> {
    const admin = await adminStorage.getById(id);
    if (!admin) return null;
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  static async getAllAdmins(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Omit<PlatformAdmin, 'password'>>> {
    const admins = await adminStorage.getAll();
    
    // Calculate pagination
    const total = admins.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated data and remove passwords
    const paginatedAdmins = admins
      .slice(startIndex, endIndex)
      .map(admin => {
        const { password: _, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });

    return {
      data: paginatedAdmins,
      pagination: {
        total,
        pages,
        currentPage: page,
        limit
      }
    };
  }
} 