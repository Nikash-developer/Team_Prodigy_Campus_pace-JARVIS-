import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// MongoDB setup
import { connectDB } from './server/config/db';
import { seedDB } from './server/seed';

// Route imports
import authRoutes from './server/routes/authRoutes';
import assignmentRoutes from './server/routes/assignmentRoutes';
import submissionRoutes from './server/routes/submissionRoutes';
import uploadRoutes from './server/routes/uploadRoutes';
import noticeRoutes from './server/routes/noticeRoutes';
import chatbotRoutes from './server/routes/chatbotRoutes';
import questionPaperRoutes from './server/routes/questionPaperRoutes';
import quizRoutes from './server/routes/quizRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dbMiddleware = async (req: any, res: any, next: any) => {
  try {
    const conn = await connectDB();
    if (!conn) {
      return res.status(503).json({
        error: 'Database connection failed. Please check your MONGO_URI and IP whitelist settings in MongoDB Atlas.'
      });
    }
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database service unavailable' });
  }
};

// --- API ROUTES ---
app.use('/api/auth', dbMiddleware, authRoutes);
app.use('/api/assignments', dbMiddleware, assignmentRoutes);
app.use('/api/submissions', dbMiddleware, submissionRoutes);
app.use('/api/upload', dbMiddleware, uploadRoutes);
app.use('/api/notices', dbMiddleware, noticeRoutes);
app.use('/api/chatbot', dbMiddleware, chatbotRoutes);
app.use('/api/quiz', dbMiddleware, quizRoutes);
app.use('/api', dbMiddleware, questionPaperRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Production serving of static files
if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));

  // Custom API 404 handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // SPA fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Standalone Server Setup (Local only)
if (process.env.VERCEL !== "1") {
  const startServer = async () => {
    if (process.env.NODE_ENV !== "production") {
      // Dynamically import vite only in development
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);

        await connectDB();
        await seedDB();
      } catch (err) {
        console.warn("Vite failed to load:", err);
      }
    }

    // Standard HTTP + Socket.io
    try {
      const { createServer } = await import('http');
      const { Server } = await import('socket.io');
      const server = createServer(app);
      const io = new Server(server, { cors: { origin: '*' } });
      app.set('io', io);

      io.on('connection', (socket) => {
        console.log('A user connected via Socket.io');
      });

      server.listen(PORT as number, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("Failed to start standalone server:", err);
    }
  };

  startServer();
}

export default app;
