import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, LoginResponse, PlatformAdmin, PlatformUser } from '../models';
import { adminStorage, userStorage } from './dbStorage';
import crypto from 'crypto';
import { RoleType } from '../types';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateRandomPassword(): string {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    return password;
  }


  static generateToken(id: string, role: RoleType, name: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
      { id, role, name },
      secret,
      { expiresIn: '24h' }
    );
  }

  static async login(credentials: LoginInput): Promise<LoginResponse> {
    let user: PlatformAdmin | PlatformUser | null = null;
    if (credentials.role === RoleType.ADMIN) {
      user = await adminStorage.getById(credentials.id);
    } else {
      user = await userStorage.getById(credentials.id);
    }

    if(!user){
      throw new Error('User not found');
    }

    const hashedPassword = user?.password || '';

    if (!hashedPassword) {
      throw new Error('Can not find the user password in the database');
    }

    const isValidPassword = await this.comparePasswords(
      credentials.password,
      hashedPassword
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id.toString(), credentials.role, user.name);
    const { id } = user;

    return {
      token,
      id,
      role: credentials.role
    };
  }
} 