const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for faster queries per user
    },
    text: {
        type: String,
        trim: true,
        required: [true, 'Please add some text description']
    },
    amount: {
        type: Number,
        required: [true, 'Please add a positive or negative number']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Please specify if transaction is income or expense']
    },
    category: {
        type: String,
        required: [true, 'Please assign a category']
    },
    date: {
        type: Date,
        default: Date.now,
        index: true // Index for time-based aggregations
    }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Transaction', TransactionSchema);
