import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { UserService } from '../services/userService';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { UserUpdateInput } from 'src/models/User';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken, requireAdmin);

// Create user
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('totalMinutes').isInt().withMessage('Minutes must be a integer value'),
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
        totalMinutes: user.totalMinutes / 60,
        remainingMinutes: user.remainingMinutes / 60,
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
    body('totalMinutes').optional().isInt().withMessage('Total minutes must be a Integer value'),
    body('resetPassword').optional().isBoolean().withMessage('Reset password must be a boolean value'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const updatedUser: UserUpdateInput = {}
      let password = null;
      if(req.body.resetPassword){
        password = AuthService.generateRandomPassword();
        updatedUser.password = await AuthService.hashPassword(password);
      }
      if(req.body.name){
        updatedUser.name = req.body.name;
      }
      if(req.body.totalMinutes){
        // get user from db
        const user = await UserService.getUserById(Number(req.params.id));
        updatedUser.totalMinutes = req.body.totalMinutes * 60;
        updatedUser.remainingMinutes = req.body.totalMinutes * 60;
        if(user){
          if(user.totalMinutes > updatedUser.totalMinutes){
            updatedUser.remainingMinutes = user.remainingMinutes - (user.totalMinutes - updatedUser.totalMinutes);
          } else {
            updatedUser.remainingMinutes = user.remainingMinutes + (updatedUser.totalMinutes - user.totalMinutes);
          }
        }
      }
      if(req.body.notes){
        updatedUser.notes = req.body.notes;
      }

      const user = await UserService.updateUser(Number(req.params.id), updatedUser);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        ...user,
        totalMinutes: user.totalMinutes / 60,
        remainingMinutes: user.remainingMinutes / 60,
        password
      });
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
      result.data.forEach(user => {
        user.totalMinutes = user.totalMinutes / 60;
        user.remainingMinutes = user.remainingMinutes / 60;
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  }
);

export default router; 