import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../services/authService';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post(
  '/login',
  [
    body('id').isLength({ min: 1 }).withMessage('Please provide a valid id'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  }
);

export default router;