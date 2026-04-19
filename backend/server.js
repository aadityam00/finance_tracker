const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Load env vars (Do this before anything else)
dotenv.config();

// Connect to database first
const startServer = async () => {
    // Attempt DB connect
    await connectDB();

    const app = express();

    // Body parser
    app.use(express.json());

    // Enable CORS
    app.use(cors());

    // Security Headers
    app.use(helmet());

    // Sanitize Data (prevent NoSQL injection)
    app.use(mongoSanitize());

    // Rate Limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 mins
        max: 100 // limit each IP to 100 requests per window
    });
    app.use('/api/', limiter);

    // Enforce DB connection before handling requests
    const checkDBConnection = require('./middleware/dbMiddleware');
    app.use('/api/', checkDBConnection);

    // Mount routers
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/transactions', require('./routes/transactionRoutes'));

    // 404 handler
    app.use((req, res, next) => {
        res.status(404).json({ success: false, error: 'Endpoint not found' });
    });

    // Centralized Error handler (Must be after routes)
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
};

startServer();
