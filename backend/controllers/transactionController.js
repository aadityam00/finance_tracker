const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all transactions with pagination
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const userId = req.user._id;
    const query = { user: userId };
    console.log(`[GET /api/transactions] Fetching for user: ${req.user.email} (ID: ${userId})`);

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
        .sort({ date: -1 })
        .skip(startIndex)
        .limit(limit);

    console.log(`[GET /api/transactions] Found ${transactions.length} transactions for this user out of ${total} total.`);

    // Calculate dynamic total balance
    const allTransactions = await Transaction.find(query);
    const balance = allTransactions.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);

    res.status(200).json({
        success: true,
        count: transactions.length,
        total,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        },
        balance,
        data: transactions
    });
});

// @desc    Add a transaction (income/expense)
// @route   POST /api/transactions
// @access  Private
exports.addTransaction = asyncHandler(async (req, res, next) => {
    console.log("--- New Transaction Request ---");
    console.log("User ID from Token:", req.user.id);
    console.log("Request Body:", req.body);

    req.body.user = req.user.id;

    // Use text from category if text is not provided, since the UI only sends category
    if (!req.body.text && req.body.category) {
        req.body.text = req.body.category;
    }

    const transaction = await Transaction.create(req.body);

    console.log("Saved Transaction:", transaction);

    res.status(201).json({
        success: true,
        data: transaction
    });
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        return res.status(404).json({ success: false, error: 'No transaction found' });
    }

    // Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
        return res.status(401).json({ success: false, error: 'Not authorized to delete this transaction' });
    }

    await transaction.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get monthly summary using aggregation
// @route   GET /api/transactions/summary
// @access  Private
exports.getSummary = asyncHandler(async (req, res, next) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log(`[GET /api/summary] Aggregating for user: ${req.user.email} (ID: ${userId})`);

    const summary = await Transaction.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    type: "$type"
                },
                totalAmount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: summary
    });
});
