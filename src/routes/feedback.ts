import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { FeedbackService } from '../services/feedbackService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Submit feedback
router.post(
    '/',
    authenticateToken,
    [
        body('feedback').notEmpty().withMessage('Feedback is required'),
        validateRequest
    ],
    async (req: Request, res: Response) => {
        try {
            const feedback = await FeedbackService.createFeedback({
                userId: Number(req.user?.id),
                userName: req.user?.name || 'Anonymous',
                feedback: req.body.feedback
            });
            res.status(201).json(feedback);
        } catch (error) {
            console.error('Error submitting feedback');
            res.status(500).json({ error: 'Failed to submit feedback' });
        }
    }
);

// Get user's feedback
router.get(
    '/my',
    authenticateToken,
    async (req: Request, res: Response) => {
        try {
            const feedback = await FeedbackService.getFeedbackByUserId(Number(req.user?.id));
            res.json(feedback);
        } catch (error) {
            console.error('Error getting feedback:', error);
            res.status(500).json({ error: 'Failed to get feedback' });
        }
    }
);

// Get all feedback (admin only)
router.get(
    '/all',
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const feedback = await FeedbackService.getAllFeedback();
            res.json(feedback);
        } catch (error) {
            console.error('Error getting all feedback:', error);
            res.status(500).json({ error: 'Failed to get feedback' });
        }
    }
);

export default router; 