import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import "reflect-metadata";
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import adminRoutes from './routes/admins';
import healthRoutes from './routes/health';
import agoraRoutes from './routes/agora';
import agentRoutes from './routes/agent';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/agent', agentRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(err.stack, req?.body);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize the application
const startServer = async () => {
  try {
    // Initialize TypeORM
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 