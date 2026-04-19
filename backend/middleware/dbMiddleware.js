const mongoose = require('mongoose');

// Middleware to check if mongoose is connected
const checkDBConnection = (req, res, next) => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            success: false,
            error: 'Service unavailable: Database connection lost or not established'
        });
    }
    next();
};

module.exports = checkDBConnection;
