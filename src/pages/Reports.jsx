import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { FileBarChart, ArrowDownCircle, ArrowUpCircle, Wallet, Download, Filter, PieChart, Info, Sparkles, Crosshair, Target, BarChart2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as ReRadar, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import jsPDF from 'jspdf';

const categoriesByRole = {
    student: ['Tuition/Education', 'Books/Supplies', 'Hostel/Rent', 'Food & Dining', 'Transport', 'Tech/Gadgets', 'Entertainment', 'Health/Med', 'Savings', 'Gifting', 'Other'],
    salaried: ['Rent/Home Loan EMI', 'Household/Groceries', 'Utilities (Bills)', 'Personal Care/Health', 'Insurance', 'Transport/Fuel', 'Entertainment/Travel', 'Investment', 'Tax/PF', 'Emergency Fund', 'Other'],
    freelancer: ['Software/Subscriptions', 'Hardware/Tech', 'Coworking/Office', 'Marketing/Ads', 'Client Meeting/Consult', 'Tax/GST', 'Self-Insurance', 'Investment', 'Other'],
    business: ['Inventory/Supplies', 'Staff Salaries', 'Office Rent', 'Utilities (Business)', 'Logistics/Courier', 'Marketing/Promotion', 'Interest/Tax', 'Raw Products', 'Capital Expenditure', 'Other'],
    retired: ['Healthcare/Medicine', 'Home Maintenance', 'Utilities', 'Hobbies/Social', 'Travel', 'Donations/Gifting', 'Daily Household', 'Other'],
    other: ['Food', 'Transport', 'Shopping', 'Utilities', 'Salaries', 'Other']
};

const Reports = () => {
    const { user } = useAuth();
    const { transactions, loading } = useTransactions();
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

    const [budgets, setBudgets] = useState({});

    // Indian currency formatter with compact notation (K, L, Cr)
    const formatCurr = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    // 1. LOAD: Load month-specific budgets from localStorage or set defaults
    useEffect(() => {
        const userId = user?._id || user?.id;
        if (userId && monthFilter) {
            const storageKey = `budgets_${userId}_${monthFilter}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setBudgets(JSON.parse(saved));
            } else {
                // Default to 0 for a new month
                const role = user?.role || 'other';
                const cats = categoriesByRole[role] || categoriesByRole.other;
                const base = {};
                cats.forEach(c => base[c] = 0);
                setBudgets(base);
            }
        }
    }, [user?.id, user?._id, user?.role, monthFilter]);

    // 2. SAVE: Persist month-specific budgets
    useEffect(() => {
        const userId = user?._id || user?.id;
        if (userId && monthFilter && Object.keys(budgets).length > 0) {
            const storageKey = `budgets_${userId}_${monthFilter}`;
            localStorage.setItem(storageKey, JSON.stringify(budgets));
        }
    }, [budgets, user?.id, user?._id, monthFilter]);

    const handleBudgetChange = (category, value) => {
        setBudgets(prev => ({ ...prev, [category]: parseFloat(value) || 0 }));
    };

    const filteredTransactions = useMemo(() => {
        if (!monthFilter) return transactions;
        const [year, month] = monthFilter.split('-');
        return transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() == year && (d.getMonth() + 1) == month;
        });
    }, [transactions, monthFilter]);

    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        const savingsRatio = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

        const byCategory = {};
        filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        });

        const sortedCategories = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value, fullMark: Math.max(...Object.values(byCategory)) }));

        // NEW: Scatter data for transactions
        const scatterData = filteredTransactions.map((t, idx) => ({
            id: idx,
            x: new Date(t.date).getDate(),
            y: t.amount,
            category: t.category,
            type: t.type
        }));

        // NEW: Monthly Stacked Data (Last 6 Months)
        const monthlyDataMap = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyDataMap[key]) monthlyDataMap[key] = { month: date.toLocaleDateString('default', { month: 'short' }), income: 0, expense: 0 };
            monthlyDataMap[key][t.type] += t.amount;
        });
        const monthlyData = Object.values(monthlyDataMap).slice(-6);

        const heatmap = [];
        const today = new Date();
        for (let i = 0; i < 35; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - (34 - i));
            const dayKey = d.toISOString().split('T')[0];
            const amount = transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(dayKey))
                .reduce((sum, t) => sum + t.amount, 0);
            heatmap.push({ date: d, amount, dayLabel: d.toLocaleDateString('default', { weekday: 'short' }), dateLabel: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }) });
        }

        const currentCats = categoriesByRole[user?.role] || categoriesByRole.other;

        // Comprehensive category list: Role defaults + Historical categories + Manual budget categories
        const allRelevantCats = Array.from(new Set([
            ...currentCats,
            ...transactions.filter(t => t.type === 'expense').map(t => t.category),
            ...Object.keys(budgets).filter(cat => budgets[cat] > 0)
        ]));

        const budgetData = allRelevantCats.map(cat => {
            const actual = filteredTransactions
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((s, t) => s + t.amount, 0);
            return { name: cat, actual, budget: budgets[cat] || 0 };
        }).sort((a, b) => b.actual - a.actual).slice(0, 15); // Show top 15

        return { income, expenses, balance, savingsRatio, sortedCategories, scatterData, monthlyData, heatmap, budgetData };
    }, [filteredTransactions, transactions, user, budgets]);

    const COLORS = ['#0ea5e9', '#06b6d4', '#2dd4bf', '#818cf8', '#c084fc', '#f472b6', '#34d399'];

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Extended Financial Intelligence Report", 20, 20);
        doc.setFontSize(14);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Total Cashflow: ₹${stats.income.toLocaleString()}`, 20, 45);
        doc.text(`Total Burn: ₹${stats.expenses.toLocaleString()}`, 20, 55);
        doc.text(`Net Worth Change: ₹${stats.balance.toLocaleString()}`, 20, 65);
        doc.text(`Savings Ratio: ${stats.savingsRatio}%`, 20, 75);

        doc.text("Top Expenses By Category:", 20, 95);
        stats.sortedCategories.forEach((cat, index) => {
            if (index < 10) doc.text(`${cat.name}: ₹${cat.value.toLocaleString()}`, 30, 105 + (index * 10));
        });

        doc.save(`fintrack-intel-${monthFilter || 'full'}.pdf`);
    };

    return (
        <div className="space-y-10 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <FileBarChart className="text-fin-500 dark:text-cyan-400" size={32} />
                        <span className="dark:neo-glow">Financial Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-serif italic text-lg opacity-70 transition-colors dark:text-slate-400">Deep dive into your financial habits and trends.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    <div className="relative group w-full sm:w-auto">
                        <Filter className="absolute left-4 top-3 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10" size={18} />
                        <input id="report-month" name="month" type="month" className="w-full bg-white dark:bg-slate-900/50 p-3 pl-12 rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-cyan-500 font-bold dark:text-white" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
                    </div>
                    <button onClick={downloadPDF} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto dark:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                        <Download size={20} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-[2rem] shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent flex items-center justify-between relative">
                    <div className="space-y-1 relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Total Income</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white dark:neo-glow">{formatCurr(stats.income)}</h3>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-500/20 rounded-2xl relative z-10">
                        <ArrowUpCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-[2rem] shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent flex items-center justify-between relative">
                    <div className="space-y-1 relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Total Expenses</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white dark:neo-glow">{formatCurr(stats.expenses)}</h3>
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/20 rounded-2xl relative z-10">
                        <ArrowDownCircle className="text-rose-600 dark:text-rose-400" size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-[2rem] shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent flex items-center justify-between relative">
                    <div className="space-y-1 relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Net Cashflow</p>
                        <h3 className={`text-3xl font-black dark:neo-glow ${stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500 dark:text-rose-400'}`}>{formatCurr(stats.balance)}</h3>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-500/20 rounded-2xl relative z-10">
                        <Wallet className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-[2rem] shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent flex items-center justify-between relative">
                    <div className="space-y-1 relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Savings Rate</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white dark:neo-glow">{stats.savingsRatio}%</h3>
                    </div>
                    <div className="p-4 bg-cyan-50 dark:bg-cyan-500/20 rounded-2xl relative z-10">
                        <Sparkles className="text-cyan-600 dark:text-cyan-400" size={24} />
                    </div>
                </div>
            </div>

            {/* Spending Heatmap (GitHub Style) */}
            <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow flex items-center gap-2">
                            <Calendar size={24} className="text-emerald-500" />
                            Expense Rhythm
                        </h3>
                        <p className="text-sm text-slate-400 font-medium">Daily spending intensity over the last 5 weeks</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        <span>Low / No-Spend</span>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-sm"></div>
                            <div className="w-2.5 h-2.5 bg-indigo-500/40 rounded-sm"></div>
                            <div className="w-2.5 h-2.5 bg-sky-500/60 rounded-sm"></div>
                            <div className="w-2.5 h-2.5 bg-emerald-500/80 rounded-sm"></div>
                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div>
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></div>
                        </div>
                        <span>Critical Level</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-3 sm:gap-4">
                    {stats.heatmap.map((day, ix) => {
                        let intensity = 0;
                        if (day.amount > 7000) intensity = 5;
                        else if (day.amount > 3500) intensity = 4;
                        else if (day.amount > 1500) intensity = 3;
                        else if (day.amount > 500) intensity = 2;
                        else if (day.amount > 0) intensity = 1;

                        const colors = [
                            'bg-slate-100 dark:bg-slate-800 border-transparent',
                            'bg-indigo-500/20 border-indigo-500/10',
                            'bg-sky-500/40 border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]',
                            'bg-emerald-500/70 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-white',
                            'bg-amber-500 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-slate-900',
                            'bg-rose-500 border-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-white'
                        ];

                        return (
                            <motion.div
                                key={ix}
                                whileHover={{ scale: 1.1, zIndex: 20 }}
                                className={`group relative h-12 sm:h-16 rounded-xl border transition-all ${colors[intensity]}`}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                                    {day.dateLabel}: ₹{day.amount.toLocaleString()}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-40 transition-opacity">
                                    <span className={`text-[10px] font-black ${intensity >= 3 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{day.date.getDate()}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-7 gap-3 sm:gap-4 mt-4 px-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest">{d}</div>
                    ))}
                </div>
            </div>

            {/* NEW: Budget Configuration Card */}
            <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow flex items-center gap-2">
                            <Target size={24} className="text-fin-500" />
                            Define Your Goals
                        </h3>
                        <p className="text-sm text-slate-400 font-medium font-serif italic text-lg">Planning for <span className="text-fin-500 font-black underline">{new Date(monthFilter + '-02').toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 px-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
                            <Calendar size={18} className="text-fin-500" />
                            <input
                                type="month"
                                className="bg-transparent outline-none font-black text-sm dark:text-white cursor-pointer"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                            />
                        </div>
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-[10px] font-black uppercase text-emerald-600 tracking-widest hidden lg:block">
                            Auto-Saving
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from(new Set([
                        ...(categoriesByRole[user?.role] || categoriesByRole.other),
                        ...transactions.filter(t => t.type === 'expense').map(t => t.category)
                    ])).map(cat => (
                        <div key={`input-${cat}`} className="space-y-2 group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-fin-500 transition-colors">{cat}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 pl-8 rounded-xl border border-slate-100 dark:border-white/5 outline-none focus:ring-2 focus:ring-fin-500 transition-all font-bold dark:text-white"
                                    placeholder="0"
                                    value={budgets[cat] || ""}
                                    onChange={(e) => handleBudgetChange(cat, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* NEW: Budget vs Actual Analysis */}
            <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow">Execution vs Planning</h3>
                        <p className="text-sm text-slate-400 font-medium font-serif italic text-lg tracking-tight">Performance Summary for <span className="text-fin-500 font-black">{new Date(monthFilter + '-02').toLocaleDateString('default', { month: 'long' })}</span></p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {stats.budgetData
                        .filter(item => item.budget > 0 || item.actual > 0) // Filter out inactive categories
                        .map((item, i) => {
                            const percent = item.budget > 0 ? Math.min(150, (item.actual / item.budget) * 100) : (item.actual > 0 ? 100 : 0);
                            const isOver = item.actual > item.budget && item.budget > 0;
                            const displayPercent = Math.min(100, percent); // Graphical limit

                            return (
                                <div key={item.name} className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className="text-sm font-black text-slate-900 dark:text-white block">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Budget Limit: {formatCurr(item.budget)}</span>
                                                {isOver && (
                                                    <motion.span
                                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                        className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter"
                                                    >
                                                        Over Budget
                                                    </motion.span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xl font-black ${isOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{formatCurr(item.actual)}</span>
                                            <span className="text-[10px] block font-bold text-slate-400">{percent.toFixed(1)}% burned</span>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${displayPercent}%` }}
                                            transition={{ duration: 1.2, ease: "circOut", delay: i * 0.05 }}
                                            className={`h-full rounded-full transition-colors ${isOver ? 'bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    {stats.budgetData.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">
                            No active categories to track. Start by defining your goals above!
                        </div>
                    )}
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* 1. Categorical Focus Radar Chart */}
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-3xl relative overflow-hidden group shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Crosshair size={24} className="text-fin-500 dark:text-cyan-400" />
                        Spending Focus
                    </h3>
                    <div className="h-[350px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.sortedCategories}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                                <ReRadar name="Spending" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} style={{ filter: 'drop-shadow(0 0 10px rgba(14,165,233,0.5))' }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(3,7,18,0.8)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    {stats.sortedCategories.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <p className="text-slate-500 font-black">Add categories to see focus.</p>
                        </div>
                    )}
                </div>

                {/* 2. Monthly Comparison Stacked Bar */}
                <div className="bg-white dark:bg-transparent dark:glass-panel p-8 rounded-3xl shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.05)] border border-slate-100 dark:border-transparent">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Target size={24} className="text-blue-500" />
                        Monthly Performance
                    </h3>
                    <div className="h-[350px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ReBarChart data={stats.monthlyData}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} hide />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(3,7,18,0.8)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} />
                                <Bar dataKey="income" fill="#2dd4bf" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 8px rgba(45,212,191,0.5))' }} />
                                <Bar dataKey="expense" fill="#0ea5e9" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0 0 8px rgba(14,165,233,0.5))' }} />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};


export default Reports;
