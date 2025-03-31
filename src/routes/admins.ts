import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { AdminService } from '../services/adminService';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply authentication and admin middleware to all routes
// router.use(authenticateToken, requireAdmin);

// Create admin
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const { admin, password } = await AdminService.createAdmin(req.body);
      res.status(201).json({
        ...admin,
        password // Include the password in the response
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating admin' });
    }
  }
);

// Update admin
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validateRequest
  ],
  async (req: Request, res: Response) => {
    try {
      const admin = await AdminService.updateAdmin(Number(req.params.id), req.body);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      res.json(admin);
    } catch (error) {
      res.status(500).json({ message: 'Error updating admin' });
    }
  }
);

// Delete admin
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await AdminService.deleteAdmin(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin' });
  }
});

// Get admin by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const admin = await AdminService.getAdminById(Number(req.params.id));
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin' });
  }
});

// Get all admins
router.get('/', async (req: Request, res: Response) => {
  try {
    const admins = await AdminService.getAllAdmins();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins' });
  }
});

export default router; 