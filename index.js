import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';
import { nanoid } from 'nanoid';
import { appendFile } from 'fs/promises';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// JWT Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('[Server Auth] No token provided. Connection rejected.');
    return next(new Error('AUTH_TOKEN_MISSING'));
  }

  try {
    const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
    if (!SUPABASE_JWT_SECRET) {
      console.error('[Server Auth] JWT secret not configured');
      return next(new Error('SERVER_CONFIGURATION_ERROR'));
    }

    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    socket.user = { 
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    console.log(`[Server Auth] Token verified for user ID: ${socket.user.id}`);
    next();
  } catch (err) {
    console.error("[Server Auth] Token verification failed:", err.message);
    return next(new Error('AUTH_TOKEN_INVALID'));
  }
});

const gameSessions = new Map();

const normalizeSingleMove = (move) => {
  if (typeof move !== 'string') return '';
  return move.trim();
};

const normalizeMainLineString = (movesString) => {
  if (typeof movesString !== 'string') return [];
  return movesString
    .replace(/[0-9]+\.\s*/g, '')
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map(move => move.trim())
    .filter(move => move.length > 0);
};

const logActivity = async (eventType, data) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      event: eventType,
      ...data
    }) + '\n';
    await appendFile(join(__dirname, 'session_activity_log.txt'), logEntry);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

io.on('connection', (socket) => {
  console.log('[Server] Authenticated user connected:', socket.user.id, 'Socket ID:', socket.id);

  // Rest of the socket event handlers remain the same...
  // Only copying the first event handler as example, the rest stay unchanged
  socket.on('create_session', async ({ numPuzzles }) => {
    const sessionId = nanoid(6);
    const initialPuzzles = Array(numPuzzles).fill(null).map(() => ({
        position: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        mainLine: [],
        timer: 60,
        points: 3
    }));

    gameSessions.set(sessionId, {
      id: sessionId,
      admin: socket.id,
      adminUserId: socket.user.id, // Add user ID from JWT
      numPuzzles,
      currentPuzzleIndex: 0,
      puzzles: initialPuzzles,
      players: new Map(),
      currentPuzzleDataForClient: null,
      puzzleActive: false,
      leaderboard: [],
      currentPuzzleLaunchedAt: null,
    });
    socket.join(sessionId);
    socket.emit('session_created', { sessionId });
    await logActivity('SESSION_CREATED', { 
      sessionId, 
      adminId: socket.id,
      adminUserId: socket.user.id, // Log the actual user ID
      numPuzzles 
    });
    console.log(`[Server] Session created: ${sessionId} by user ${socket.user.id} (socket ${socket.id})`);
  });

  socket.on('launch_puzzle', async ({ sessionId, puzzleIndex, puzzle }) => {
    console.log('[Server] Recibido evento launch_puzzle:', { sessionId, puzzleIndex, puzzle });

    const session = gameSessions.get(sessionId);
    if (!session || session.admin !== socket.id) {
      console.error('[Server] Error de autorización:', { sessionId, adminId: socket.id, actualAdmin: session?.admin });
      socket.emit('error', { message: 'No autorizado o sesión no encontrada.' });
      return;
    }
  });

  // ... rest of the event handlers remain unchanged
});

const PORT = process.env.PORT || 10000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Server running on port ${PORT}`);
});