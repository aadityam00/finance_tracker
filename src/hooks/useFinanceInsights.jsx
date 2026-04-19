import { useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import { Bell, Sparkles, Wallet, LayoutDashboard, Target } from 'lucide-react';

export const useFinanceInsights = () => {
    const { transactions } = useTransactions();
    const { user } = useAuth();

    const insights = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        const totalTx = transactions.length;
        
        const catMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        });
        const topCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0];

        const list = [];

        // 1. Critical: Overspending
        if (expenses > income) {
            list.push({
                id: 'overspending',
                type: 'loss',
                title: 'Spending Check-In',
                message: income > 0 
                  ? `Hey ${user?.name || 'there'}, your spending (₹${expenses.toLocaleString()}) has exceeded your income.` 
                  : `You've recorded ₹${expenses.toLocaleString()} in expenses but haven't added any income yet.`,
                extra: topCat ? `You spent the most on "${topCat[0]}". Managing this category could help bring you back to a positive balance.` : 'Try adding your income or reducing small expenses to balance your accounts.',
                icon: <Sparkles size={18} />,
                color: 'rose'
            });
        }

        // 2. Liquidity Warning
        if (balance > 0 && balance < 2000) {
            list.push({
                id: 'low-balance',
                type: 'warning',
                title: 'Low Liquidity Alert',
                message: 'Your remaining balance is under ₹2,000. Keep a buffer for emergencies.',
                extra: 'Consider holding off on non-essential purchases for a few days.',
                icon: <Bell size={18} />,
                color: 'amber'
            });
        }

        // 3. Category Focus
        if (topCat && topCat[1] > (income * 0.4) && income > 0) {
            list.push({
                id: 'category-alert',
                type: 'warning',
                title: 'Top Category Alert',
                message: `"${topCat[0]}" accounts for a large portion of your budget.`,
                extra: `₹${topCat[1].toLocaleString()} was spent on "${topCat[0]}". Is there a way to find a cheaper alternative for this specific area?`,
                icon: <Target size={18} />,
                color: 'amber'
            });
        }

        // 4. Milestone: First Income
        if (income > 0 && totalTx < 5) {
            list.push({
                id: 'milestone-1',
                type: 'success',
                title: 'First Earnings!',
                message: 'Great job recording your first income. Tracking every rupee is the key to wealth.',
                extra: 'Building a consistent recording habit is more important than the amount.',
                icon: <Wallet size={18} />,
                color: 'emerald'
            });
        }

        // 5. Big Spending Detection
        const bigTx = transactions.find(t => t.type === 'expense' && t.amount > (expenses * 0.4) && expenses > 500);
        if (bigTx) {
            list.push({
                id: 'big-spend',
                type: 'warning',
                title: 'Big Expense Detected',
                message: `An unusual purchase of ₹${bigTx.amount.toLocaleString()} was noted in ${bigTx.category}.`,
                extra: 'Sometimes one large purchase can throw off your entire monthly plan. Check if it was worth it!',
                icon: <Sparkles size={18} />,
                color: 'amber'
            });
        }

        // 6. Resilience: Savings Success
        const savingsRatio = income > 0 ? (balance / income) : 0;
        if (savingsRatio >= 0.25) {
            list.push({
                id: 'resilience-1',
                type: 'success',
                title: 'Savings Milestone',
                message: `You've manages to save ${(savingsRatio * 100).toFixed(1)}% of your income.`,
                extra: 'That is significantly above average! This surplus could be used for long-term investments or a splurge later.',
                icon: <Target size={18} />,
                color: 'emerald'
            });
        }

        return list;
    }, [transactions, user]);

    return insights;
};
