import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Trash2, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, LayoutList, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Transactions = () => {
    const { user } = useAuth();
    const { transactions, deleteTransaction, loading } = useTransactions();
    
    // Local State for filtering/paging
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    const categories = useMemo(() => {
        const roles = {
            student: ['Education', 'Books/Supplies', 'Food & Dining', 'Transport', 'Entertainment', 'Hostel/Rent', 'Other'],
            salaried: ['Rent/Mortgage', 'Groceries', 'Utilities', 'EMI/Loan', 'Insurance', 'Transport', 'Food & Dining', 'Investment', 'Other'],
            other: ['Food', 'Transport', 'Shopping', 'Utilities', 'Salaries', 'Other']
        };
        return roles[user?.role] || roles.other;
   }, [user]);

    const filteredTransactions = useMemo(() => {
        let result = [...transactions];
        
        if (search) {
            const query = search.toLowerCase();
            result = result.filter(t => 
                t.category.toLowerCase().includes(query) || 
                t.amount.toString().includes(query) ||
                Object.values(t).some(val => val && val.toString().toLowerCase().includes(query))
            );
        }
        
        if (filter !== 'all') {
            if (filter === 'income') result = result.filter(t => t.type === 'income');
            else if (filter === 'expense') result = result.filter(t => t.type === 'expense');
            else result = result.filter(t => t.category === filter);
        }
        
        return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, search, filter]);

    const totalPages = Math.ceil(filteredTransactions.length / limit) || 1;
    const paginated = filteredTransactions.slice((page - 1) * limit, page * limit);

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            deleteTransaction(id);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <LayoutList className="text-fin-500" size={32} />
                    <span className="dark:neo-glow">Transactions</span>
                </h1>
                <p className="text-slate-500 font-medium">Manage and audit your full financial history.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-center">
                 <div className="relative group flex-1 w-full lg:w-auto">
                    <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-fin-600 transition-colors" size={20} />
                    <input 
                        id="tx-search"
                        name="tx-search"
                        type="text" 
                        placeholder="Search by category or amount..."
                        className="w-full bg-white dark:bg-slate-800 p-4 pl-12 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-fin-500 outline-none transition-all font-bold"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                 </div>
                 
                 <div className="relative group w-full lg:w-72">
                    <Filter className="absolute left-4 top-4 text-slate-400 group-focus-within:text-fin-600 transition-colors" size={20} />
                    <select 
                        id="tx-filter"
                        name="tx-filter"
                        className="w-full bg-white dark:bg-slate-800 p-4 pl-12 rounded-2xl border border-slate-200 dark:border-slate-700 appearance-none focus:ring-2 focus:ring-fin-500 outline-none transition-all font-bold"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="all">All Transactions</option>
                        <option value="income">Income Only</option>
                        <option value="expense">Expense Only</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
            </div>

            <div className="bg-white dark:bg-transparent dark:glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-transparent">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Type</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            <AnimatePresence mode="popLayout">
                                {paginated.map((t, idx) => (
                                    <motion.tr 
                                        key={t._id || t.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                                <Calendar size={14} className="text-slate-300" />
                                                {new Date(t.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                    {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{t.category}</span>
                                                    {/* Display dynamic fields */}
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(t)
                                                            .filter(([key]) => !['_id', 'id', 'user', 'text', 'amount', 'type', 'category', 'date', 'createdAt', 'updatedAt', '__v'].includes(key))
                                                            .map(([key, value]) => (
                                                                <span key={key} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    {key}: {value}
                                                                </span>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full ${t.type === 'income' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10'}`}>{t.type}</span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(t._id || t.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {paginated.length === 0 && (
                     <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">No Transactions Found</h3>
                        <p className="text-slate-500">Try adjusting your filters or add a new record.</p>
                     </div>
                )}

                <div className="px-6 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <p className="text-xs font-bold text-slate-500">Showing {paginated.length} of {filteredTransactions.length} results</p>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all border border-slate-200 dark:border-white/5"><ChevronLeft size={20}/></button>
                        <span className="px-4 text-xs font-black tracking-widest text-slate-400 text-center min-w-[3rem]">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow active:scale-95 disabled:opacity-50 transition-all border border-slate-200 dark:border-white/5"><ChevronRight size={20}/></button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
