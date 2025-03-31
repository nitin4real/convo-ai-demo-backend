import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { UserService } from '../services/userService';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken, requireAdmin);

// Create user
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('minutes').isNumeric().withMessage('Minutes must be a numeric value'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const adminId = Number(req.user?.id) || 0;
      const { user, password } = await UserService.createUser(req.body, adminId);
      res.status(201).json({
        ...user,
        password // Include the password in the response
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    }
  }
);

// Update user
router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().notEmpty().withMessage('Role cannot be empty'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const user = await UserService.updateUser(Number(req.params.id), req.body);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user' });
    }
  }
);

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await UserService.deleteUser(Number(req.params.id));
    if (!deleted) {
      res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get users with pagination and filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Status must be either active or inactive'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const status = req.query.status as 'active' | 'inactive' | undefined;

      const result = await UserService.getUsers({ page, limit, status });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  }
);

export default router; 