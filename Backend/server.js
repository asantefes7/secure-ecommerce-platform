const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (helps cookie sending)

// Security & parsing middleware
app.use(helmet());           // Security headers
app.use(cors());             // Allow frontend requests
app.use(express.json());     // Parse JSON bodies

// Session middleware (memory store for local dev)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true, 
  cookie: {
    maxAge: 5 * 60 * 1000,    
    secure: false,            
    httpOnly: true,
    sameSite: 'none',        
    path: '/'
  }
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const userRouter = require('./routes/userRoutes');
app.use('/api/users', userRouter);

const productRouter = require('./routes/productRoutes');
app.use('/api/products', productRouter);

const checkoutRouter = require('./routes/checkoutRoutes');
app.use('/api/checkout', checkoutRouter);

const ordersRouter = require('./routes/ordersRoutes');
app.use('/api/orders', ordersRouter);

const fraudRouter = require('./routes/fraudRoutes');
app.use('/api/fraud', fraudRouter);

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));