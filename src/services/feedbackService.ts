import { AppDataSource } from '../config/database';
import { Feedback, FeedbackInput } from '../models/Feedback';

export class FeedbackService {
    private static feedbackRepository = AppDataSource.getRepository(Feedback);

    static async createFeedback(input: FeedbackInput): Promise<Feedback> {
        const feedback = this.feedbackRepository.create(input);
        return await this.feedbackRepository.save(feedback);
    }

    static async getFeedbackByUserId(userId: number): Promise<Feedback[]> {
        return await this.feedbackRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    static async getAllFeedback(): Promise<Feedback[]> {
        return await this.feedbackRepository.find({
            order: { createdAt: 'DESC' }
        });
    }
} 