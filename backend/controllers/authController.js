const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google login
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            name,
            email,
            role: 'other' // default role for google sign-on
        });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'other'
    });

    sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    // req.user is populated in authMiddleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ success: false, error: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url (frontend URL)
    const rawHost = req.get('host');
    const host = (rawHost && rawHost.includes('localhost')) ? 'http://localhost:3000' : `${req.protocol}://${rawHost || 'localhost:3000'}`;
    const resetUrl = `${host}/auth?mode=reset&token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following link to reset your password: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email.`;

    try {
        // Only try to send email if SMTP is configured
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'YOUR_SMTP_HOST') {
            console.log('\n--- DEVELOPMENT MODE: Reset URL ---');
            console.log(resetUrl);
            console.log('------------------------------------\n');
            
            return res.status(200).json({ 
                success: true, 
                data: 'Development Mode: Reset link logged to server console.' 
            });
        }

        await sendEmail({
            email: user.email,
            subject: 'FinTrack Password Reset',
            message
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.error('Email Error:', err.message);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return res.status(500).json({ success: false, error: 'Email could not be sent. Check server logs.' });
    }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({ 
        resetPasswordToken, 
        resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};
