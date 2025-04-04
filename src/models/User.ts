import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class PlatformUser {
    @PrimaryColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    name: string;

    @Column()
    password: string;

    @Column()
    totalMinutes: number;

    @Column()
    remainingMinutes: number;

    @Column()
    notes: string;

    @Column()
    status: 'active' | 'inactive';

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: string;

    @Column()
    adminId: number;

    @Column({ nullable: true })
    convoAgentId: string;

    @Column({ nullable: true })
    metaData: string;
}

export interface UserCreateRequest {
  name: string;
  minutes: number;
  email?: string;
  notes?: string;
  password?: string;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  totalMinutes?: number;
  notes?: string;
  password?: string;
  convoAgentId?: string;
  remainingMinutes?: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
} 