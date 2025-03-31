import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";

@Entity()
export class PlatformAdmin {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  password: string;
}

export interface AdminCreateInput {
  name: string;
  password: string;
}