import express from 'express';
import cors from 'cors';
import path from 'path';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { ticketRouter } from './routes/tickets';
import { userRouter } from './routes/users';
import { authMiddleware } from './middleware/auth';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 4000;

// --------------- Security Middleware ---------------
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || process.env.TRUSTED_ORIGINS || 'http://localhost:5173',
  credentials: true
}));

// Rate Limiting
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const authLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit each IP to 10 requests per hour for auth
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Better Auth API Route
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// --------------- API Routes ---------------
app.use('/api/tickets', generalLimit, authMiddleware, ticketRouter);
app.use('/api/users', generalLimit, authMiddleware, userRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --------------- Static Files (production) ---------------
app.use(express.static(path.join(import.meta.dir, '..', 'client', 'dist')));

// SPA fallback — send index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(import.meta.dir, '..', 'client', 'dist', 'index.html'));
});

// --------------- Error Handler ---------------
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

export default app;

