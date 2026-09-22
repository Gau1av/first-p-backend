const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { protect } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();

// 1. CORS Configuration
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Base & Health check routes
app.get('/', (req, res) => {
  res.send('Backend Server is live and running!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 3. Auth Routes (Public)
app.use('/api/auth', require('./routes/authRoutes'));

// 4. Resource Routes
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/users', protect, require('./routes/userRoutes'));

// 5. 404 Fallback Handler
app.use((req, res) => {
  res.status(404).json({ message: `API route ${req.originalUrl} not found` });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Connect to DB first, then start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to start server due to DB connection error:', err);
});