import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
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
import attendanceRoutes from './server/routes/attendanceRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware to ensure DB connection
const dbMiddleware = async (req: any, res: any, next: any) => {
    try {
        const conn = await connectDB();
        if (!conn) {
            return res.status(503).json({
                error: 'Database connection failed. Please check your MONGO_URI.'
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
app.use('/api/attendance', dbMiddleware, attendanceRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- VITE / STATIC SERVING ---
if (process.env.NODE_ENV !== "production") {
    // Development mode
    // Note: In development, setupApp will be called to initialize Vite
    const setupDev = async () => {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);

        await connectDB();
        await seedDB();

        console.log("Vite development server integration ready.");
    };
    setupDev().catch(err => console.error("Failed to setup Vite dev server:", err));
} else {
    // Production mode (Vercel)
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Catch-all route for SPA
    app.get("*", (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(distPath, "index.html"));
    });
}

// --- Socket.io setup (Local only) ---
if (process.env.VERCEL !== "1") {
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });
    app.set('io', io);

    io.on('connection', (socket) => {
        console.log('A user connected via Socket.io');
    });

    server.listen(PORT as number, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
