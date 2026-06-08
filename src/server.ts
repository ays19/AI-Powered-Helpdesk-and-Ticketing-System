import express from 'express';
import cors from 'cors';
import path from 'path';
import { ticketRouter } from './routes/tickets';

const app = express();
const PORT = process.env.PORT || 4000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// --------------- API Routes ---------------
app.use('/api/tickets', ticketRouter);

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
