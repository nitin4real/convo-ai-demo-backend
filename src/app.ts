import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import https from 'https';
import "reflect-metadata";
import { AppDataSource } from './config/database';
import adminRoutes from './routes/admins';
import agentRoutes from './routes/agent';
import agoraRoutes from './routes/agora';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import userRoutes from './routes/users';
import feedbackRoutes from './routes/feedback';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.PROD === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH
const SSL_CERT_PATH = process.env.SSL_CERT_PATH

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
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Did not find route", req.originalUrl);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize the application
const startServer = async () => {
  try {
    // Initialize TypeORM
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    if (isProd) {
      const httpsOptions = {
        key: fs.readFileSync(SSL_KEY_PATH || ''),
        cert: fs.readFileSync(SSL_CERT_PATH || ''),
      };

      https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`HTTPS Server is running on port ${port}`);
      });
    } else {
      app.listen(port, () => {
        console.log(`HTTP Server is running on port ${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 