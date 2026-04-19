const express = require('express');
const { body } = require('express-validator');
const {
    getTransactions,
    addTransaction,
    deleteTransaction,
    getSummary
} = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/summary', getSummary);

router
    .route('/')
    .get(getTransactions)
    .post(
        [
            body('amount', 'Please include a valid amount').isNumeric(),
            body('type', 'Type must be income or expense').isIn(['income', 'expense']),
            body('category', 'Category is required').not().isEmpty()
        ],
        validate,
        addTransaction
    );

router.route('/:id').delete(deleteTransaction);

module.exports = router;
