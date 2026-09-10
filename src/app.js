const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./interfaces/middlewares/errorHandler');

const authRoutes = require('./interfaces/routes/authRoutes');
const ticketRoutes = require('./interfaces/routes/ticketRoutes');
const expenseRoutes = require('./interfaces/routes/expenseRoutes');
const adminRoutes = require('./interfaces/routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
