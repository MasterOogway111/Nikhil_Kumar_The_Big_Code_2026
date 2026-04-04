import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import healthRouter from './routes/health';
import routeRouter from './routes/route';
import segmentRouter from './routes/segmentScore';
import explainRouter from './routes/explain';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Logging Middleware
app.use(morgan('dev'));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.use('/health', healthRouter);
app.use('/route', routeRouter);
app.use('/segment-score', segmentRouter);
app.use('/explain', explainRouter);

// Fallback route
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║   Fear-Free Night Navigator Backend                        ║
║   Server running on http://localhost:${PORT}                  ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/fearfree'}  ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

export default app;
