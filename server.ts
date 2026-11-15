import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_CONFIG } from './server/config.ts';
import { createApiApp } from './server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApiApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(SERVER_CONFIG.port, '0.0.0.0', () => {
    console.log(`\n🎉 BoloBuddy AI server is running!`);
    console.log(`👉 Open http://localhost:${SERVER_CONFIG.port} in your browser\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${SERVER_CONFIG.port} is already in use!`);
      console.error(`This usually means BoloBuddy is already running in another terminal window.`);
      console.error(`To fix this:`);
      console.error(`1. Check your open terminal windows and stop the existing process with Ctrl+C, OR`);
      console.error(`2. Set PORT=${SERVER_CONFIG.port + 1} in your .env file.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start BoloBuddy AI server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
