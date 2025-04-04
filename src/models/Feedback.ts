import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Feedback {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    userName: string;

    @Column('text')
    feedback: string;

    @CreateDateColumn()
    createdAt: Date;
}

export interface FeedbackInput {
    userId: number;
    userName: string;
    feedback: string;
} 