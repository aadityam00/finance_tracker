const { validationResult } = require('express-validator');

// Middleware to format and return validation errors if any
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: errors.array().map(err => err.msg).join(', ')
        });
    }
    next();
};
