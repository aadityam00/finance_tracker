import React, { useState, useMemo, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Wallet, Plus, CreditCard, ArrowUpRight, ArrowDownRight, Sparkles, Loader2, Target, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePieChart, Pie, LineChart, Line } from 'recharts';

const StatCard = ({ title, value, bgClass, icon: Icon, iconColor }) => (
    <div className={`p-6 rounded-[2rem] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex items-center justify-between ${bgClass}`}>
        <div className="z-10 text-left">
            <motion.p initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-[2rem] font-black text-white leading-tight mt-0.5 dark:neo-glow">{value}</motion.p>
            <p className="text-sm font-bold tracking-wide text-white/90 mt-1">{title}</p>
        </div>
        <div className="relative z-10 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shrink-0">
            <div className="w-10 h-10 bg-white dark:bg-[#030712] rounded-full flex items-center justify-center shadow-inner">
                <Icon size={20} strokeWidth={2.5} className={iconColor} />
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const { transactions, addTransaction, loading } = useTransactions();
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Indian currency formatter with compact notation (K, L, Cr)
    const formatCurr = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(val);
    };

    const categoryDict = useMemo(() => ({
        student: {
            expense: ['Tuition/Education', 'Books/Supplies', 'Hostel/Rent', 'Food & Dining', 'Transport', 'Tech/Gadgets', 'Entertainment', 'Health/Med', 'Savings', 'Gifting', 'Other'],
            income: ['Scholarship', 'Allowance/Pocket Money', 'Part-time Work', 'Cash Gifting', 'Tax Refund', 'Other']
        },
        salaried: {
            expense: ['Rent/Home Loan EMI', 'Household/Groceries', 'Utilities (Bills)', 'Personal Care/Health', 'Insurance', 'Transport/Fuel', 'Entertainment/Travel', 'Investment', 'Tax/PF', 'Emergency Fund', 'Other'],
            income: ['Monthly Salary', 'Bonus/Incentive', 'Dividend/Interest', 'Side Hustle', 'Rent Income', 'Other']
        },
        freelancer: {
            expense: ['Software/Subscriptions', 'Hardware/Tech', 'Coworking/Office', 'Marketing/Ads', 'Client Meeting/Consult', 'Tax/GST', 'Self-Insurance', 'Investment', 'Other'],
            income: ['Project Payment', 'Retainer Fee', 'Licensing/Royalty', 'Consulting Fee', 'Other']
        },
        business: {
            expense: ['Inventory/Supplies', 'Staff Salaries', 'Office Rent', 'Utilities (Business)', 'Logistics/Courier', 'Marketing/Promotion', 'Interest/Tax', 'Raw Products', 'Capital Expenditure', 'Other'],
            income: ['Sales Revenue', 'Service Revenue', 'Capital Influx', 'Asset Disposal', 'Interest/Dividend', 'Other']
        },
        retired: {
            expense: ['Healthcare/Medicine', 'Home Maintenance', 'Utilities', 'Hobbies/Social', 'Travel', 'Donations/Gifting', 'Daily Household', 'Other'],
            income: ['Pension', 'FD/Interest Pay-out', 'Rent Income', 'Dividend Pay-out', 'Other']
        },
        other: {
            expense: ['Food', 'Transport', 'Shopping', 'Utilities', 'Salaries', 'Health', 'Travel', 'Communication', 'Other'],
            income: ['Main Income', 'Second Income', 'Gift', 'Interests', 'Rental', 'Other']
        }
    }), []);

    const [form, setForm] = useState({
        amount: '',
        category: 'Food',
        customCategory: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        dynamicFields: [] // Array of { key: '', value: '' }
    });

    const categories = useMemo(() => {
        const role = user?.role || 'other';
        const type = form?.type || 'expense';
        return (categoryDict[role] || categoryDict.other)[type];
    }, [user, form.type, categoryDict]);

    useEffect(() => {
        if (categories && categories.length > 0) {
            setForm(prev => {
                 // Only update if current category is not in new categories
                 if (!categories.includes(prev.category)) {
                     return { ...prev, category: categories[0] };
                 }
                 return prev;
            });
        }
    }, [categories]);

    const totals = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = income - expenses;
        const savingsRatio = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
        return { income, expenses, balance, savingsRatio: Math.max(0, savingsRatio) };
    }, [transactions]);

    const chartData = useMemo(() => {
        const monthlyMap = {};
        [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = {
                    name: date.toLocaleDateString('default', { month: 'short' }),
                    income: 0,
                    expense: 0,
                    year: date.getFullYear(),
                    month: date.getMonth()
                };
            }
            monthlyMap[key][t.type] += t.amount;
        });
        // Sort keys and take last 6 months
        const sorted = Object.values(monthlyMap).sort((a, b) => (a.year - b.year) || (a.month - b.month)).slice(-6);
        return sorted.map(d => ({ ...d, savings: d.income - d.expense }));
    }, [transactions]);

    const categoryData = useMemo(() => {
        const catMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (!catMap[t.category]) catMap[t.category] = 0;
            catMap[t.category] += t.amount;
        });
        const mapped = Object.entries(catMap).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value).slice(0, 6); // Top 6 for detailed distribution
        return mapped.length ? mapped : [{ name: 'No Data', value: 1 }];
    }, [transactions]);

    // Top Expense Categories Data
    const handleQuickAdd = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Prepare data
        const finalCategory = form.category === 'Other' ? form.customCategory : form.category;
        const transactionData = {
            amount: parseFloat(form.amount),
            category: finalCategory,
            type: form.type,
            date: form.date
        };

        // Add dynamic fields to the payload
        form.dynamicFields.forEach(field => {
            if (field.key && field.value) {
                transactionData[field.key] = field.value;
            }
        });

        const success = await addTransaction(transactionData);
        if (success) {
            setForm({ 
                amount: '', 
                category: categories[0], 
                customCategory: '',
                type: 'expense', 
                date: new Date().toISOString().split('T')[0],
                dynamicFields: []
            });
            setShowAddForm(false);
        }
        setIsSaving(false);
    };

    const addDynamicField = () => {
        setForm(prev => ({
            ...prev,
            dynamicFields: [...prev.dynamicFields, { key: '', value: '' }]
        }));
    };

    const updateDynamicField = (index, part, value) => {
        const newFields = [...form.dynamicFields];
        newFields[index][part] = value;
        setForm(prev => ({ ...prev, dynamicFields: newFields }));
    };

    const removeDynamicField = (index) => {
        setForm(prev => ({
            ...prev,
            dynamicFields: prev.dynamicFields.filter((_, i) => i !== index)
        }));
    };

    if (loading && transactions.length === 0) return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
            <Loader2 size={40} className="animate-spin text-fin-600" />
            <p className="text-slate-500 font-bold animate-pulse">Synchronizing financial data...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-32">
            {/* Header / Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 border border-slate-200 dark:border-slate-700/50">
                        Profile Type: {user?.role || 'Personal'}
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                        Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-fin-400 to-fin-600 dark:from-fin-300 dark:to-fin-500">{user?.name || 'User'}</span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 text-lg">
                        This dashboard is tailored for your <span className="text-slate-900 dark:text-slate-200 font-black capitalize">{user?.role || 'personal'}</span> needs.
                    </p>
                </div>
                
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-all rounded-2xl font-black shadow-xl shrink-0"
                >
                    <Plus size={20} strokeWidth={3} />
                    New Record
                </button>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} className="overflow-hidden">
                        <form onSubmit={handleQuickAdd} className="glass-card p-6 md:p-8 rounded-3xl border-2 border-fin-100 dark:border-fin-900/50 flex flex-wrap gap-4 items-end shadow-2xl relative z-20">
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label htmlFor="dashboard-amount" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Amount</label>
                                <input id="dashboard-amount" name="amount" type="number" step="0.01" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl focus:ring-2 focus:ring-fin-500 outline-none transition-all font-bold" placeholder="0.00" autoFocus required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                            </div>
                            <div className="flex-1 min-w-[150px] space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Type</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button type="button" id="form-type-income" name="type" onClick={() => setForm({ ...form, type: 'income' })} className={`py-3 rounded-lg text-xs font-black uppercase transition-all ${form.type === 'income' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>Income</button>
                                    <button type="button" id="form-type-expense" name="type" onClick={() => setForm({ ...form, type: 'expense' })} className={`py-3 rounded-lg text-xs font-black uppercase transition-all ${form.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>Expense</button>
                                </div>
                            </div>
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label htmlFor="dashboard-category" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                                <select id="dashboard-category" name="category" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl focus:ring-2 focus:ring-fin-500 outline-none transition-all font-bold" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {form.category === 'Other' && (
                                    <motion.input 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }}
                                        type="text" 
                                        className="w-full mt-2 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-fin-500 outline-none font-bold" 
                                        placeholder="Enter Category Name" 
                                        required 
                                        value={form.customCategory} 
                                        onChange={e => setForm({ ...form, customCategory: e.target.value })} 
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-[200px] space-y-2">
                                <label htmlFor="dashboard-date" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                                <input id="dashboard-date" name="date" type="date" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl focus:ring-2 focus:ring-fin-500 outline-none transition-all font-bold" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div className="w-full flex flex-col gap-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Additional Fields (Dynamic Schema)</h4>
                                    <button type="button" onClick={addDynamicField} className="text-xs font-bold text-fin-600 hover:text-fin-700 flex items-center gap-1">
                                        <Plus size={14} /> Add Field
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {form.dynamicFields.map((field, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                                            <input 
                                                type="text" 
                                                placeholder="Label (e.g. Tax)" 
                                                className="flex-1 bg-transparent p-2 text-sm font-bold focus:outline-none" 
                                                value={field.key} 
                                                onChange={e => updateDynamicField(idx, 'key', e.target.value)} 
                                            />
                                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                            <input 
                                                type="text" 
                                                placeholder="Value" 
                                                className="flex-1 bg-transparent p-2 text-sm font-bold focus:outline-none" 
                                                value={field.value} 
                                                onChange={e => updateDynamicField(idx, 'value', e.target.value)} 
                                            />
                                            <button type="button" onClick={() => removeDynamicField(idx)} className="text-rose-400 hover:text-rose-600 p-1">
                                                <Plus size={16} className="rotate-45" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full md:w-auto ml-auto px-8 h-[56px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" /> : 'Confirm'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Balance" value={formatCurr(totals.balance)} icon={Wallet} bgClass="bg-gradient-to-tr from-[rgba(255,154,122,0.8)] to-[rgba(255,122,85,1)] shadow-[0_10px_20px_rgba(255,122,85,0.3)] dark:bg-[#ff7a5515] dark:glass-panel dark:shadow-[0_0_30px_rgba(255,122,85,0.15)]" iconColor="text-[#ff7a55]" />
                <StatCard title="Income" value={formatCurr(totals.income)} icon={ArrowUpRight} bgClass="bg-gradient-to-tr from-[rgba(163,148,255,0.8)] to-[rgba(113,93,242,1)] shadow-[0_10px_20_px_rgba(113,93,242,0.3)] dark:bg-[#715df215] dark:glass-panel dark:shadow-[0_0_30px_rgba(113,93,242,0.15)]" iconColor="text-[#715df2]" />
                <StatCard title="Expenses" value={formatCurr(totals.expenses)} icon={ArrowDownRight} bgClass="bg-gradient-to-tr from-[rgba(109,229,240,0.8)] to-[rgba(18,179,194,1)] shadow-[0_10px_20px_rgba(18,179,194,0.3)] dark:bg-[#12b3c215] dark:glass-panel dark:shadow-[0_0_30px_rgba(18,179,194,0.15)]" iconColor="text-[#12b3c2]" />
                <StatCard title="Savings Power" value={totals.savingsRatio + "%"} icon={Target} bgClass="bg-gradient-to-tr from-[#38bdf8] to-[#0284c7] shadow-[0_10px_20px_rgba(2,132,199,0.3)] dark:bg-[#0284c715] dark:glass-panel dark:shadow-[0_0_30px_rgba(2,132,199,0.15)]" iconColor="text-[#0284c7]" />
            </div>

            {/* Charts Grid - Vertical Stack */}
            <div className="flex flex-col gap-8">
                {/* 1. Income vs Expense Comparison */}
                <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent relative">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow">Income vs Expense</h3>
                            <p className="text-sm text-slate-400 font-medium">Monthly cashflow summary</p>
                        </div>
                        <div className="flex gap-6 text-[11px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 rounded-full px-6 py-2.5">
                            <span className="flex items-center gap-2.5 text-slate-500"><div className="w-3 h-3 rounded-full bg-[#ff7a55]"></div> Income</span>
                            <span className="flex items-center gap-2.5 text-slate-500"><div className="w-3 h-3 rounded-full bg-[#12b3c2]"></div> Expense</span>
                        </div>
                    </div>
                    <div className="h-[400px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} width={45} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0f172a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', color: '#fff' }}
                                    itemStyle={{ fontWeight: 900, padding: '4px 0' }}
                                />
                                <Bar dataKey="income" fill="#ff7a55" radius={[8, 8, 0, 0]} barSize={24} />
                                <Bar dataKey="expense" fill="#12b3c2" radius={[8, 8, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Monthly Savings Growth (Line Chart) */}
                <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                        <TrendingUp size={100} className="text-emerald-500" />
                    </div>
                    <div className="mb-10 text-left relative z-10">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow">Savings Over Time</h3>
                        <p className="text-sm text-slate-400 font-medium">Your financial growth curve</p>
                    </div>
                    <div className="h-[300px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} width={45} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0f172a', color: '#fff' }}
                                    itemStyle={{ fontWeight: 900 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="savings"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Expense Distribution (Expanded Pie) */}
                <div className="bg-white dark:bg-transparent dark:glass-panel p-10 rounded-[2.5rem] shadow-sm dark:shadow-[0_0_40px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-transparent flex flex-col items-center relative">
                    <div className="w-full mb-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white dark:neo-glow">Spending Analysis</h3>
                        <p className="text-sm text-slate-400 font-medium">Category breakdown</p>
                    </div>
                    <div className="h-[320px] w-full min-w-0 relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RePieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => {
                                        const colors = ['#ff7a55', '#715df2', '#12b3c2', '#38bdf8', '#818cf8', '#c084fc'];
                                        return <Cell key={`pie-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', background: '#0f172a', color: '#fff' }}
                                />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-x-0 bottom-[140px] flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Total Items</span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{categoryData.length}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full mt-8">
                        {categoryData.map((c, i) => {
                            const colors = ['bg-[#ff7a55]', 'bg-[#715df2]', 'bg-[#12b3c2]', 'bg-[#38bdf8]', 'bg-[#818cf8]', 'bg-[#c084fc]'];
                            return (
                                <div key={c.name} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]} shadow-sm`}></div>
                                    <span className="truncate">{c.name}</span>
                                    <span className="ml-auto text-[10px] text-slate-400">₹{c.value.toLocaleString()}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
