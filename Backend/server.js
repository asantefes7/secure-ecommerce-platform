const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(helmet());  // Adds security headers
app.use(cors());    // Allows frontend requests
app.use(express.json());  // Parses JSON bodies

// MongoDB connection 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  // Routes
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter); 

const userRouter = require('./routes/userRoutes');
app.use('/api/users', userRouter);

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));