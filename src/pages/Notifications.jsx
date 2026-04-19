import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, Info, Check, Shield } from 'lucide-react';
import { useFinanceInsights } from '../hooks/useFinanceInsights.jsx';

const NotificationCard = ({ insight }) => {
    const isLoss = insight.type === 'loss';
    const isSuccess = insight.type === 'success';
    const isWarning = insight.type === 'warning';
    
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 rounded-[2rem] border-2 flex gap-6 items-start overflow-hidden relative ${
                isLoss 
                ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20' 
                : isSuccess 
                ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20'
                : 'bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20'
            }`}
        >
            <div className={`p-4 rounded-2xl shrink-0 ${
                isLoss ? 'bg-rose-500 text-white' : isSuccess ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
                {insight.icon || (isLoss ? <AlertCircle size={28} /> : isSuccess ? <Check size={28} /> : <Info size={28} />)}
            </div>
            
            <div className="flex-1 z-10">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className={`text-xl font-black ${
                        isLoss ? 'text-rose-600 dark:text-rose-400' : isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                        {insight.title}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Just Now</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-4">
                    {insight.message}
                </p>
                
                {insight.extra && (
                    <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">A.I. Observation</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{insight.extra}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const Notifications = () => {
    const { user } = useAuth();
    const insights = useFinanceInsights();

    if (insights.length === 0) {
        return (
            <div className="space-y-8 pb-32">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                        Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-fin-400 to-fin-600">Notifications</span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 text-lg">All clear! No alerts at this time.</p>
                </div>
                <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Shield size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Your finances are steady</h3>
                    <p className="text-slate-500 font-bold mt-2">Add more records to help the A.I. provide deep insights into your spending patterns.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            <div>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 border border-slate-200 dark:border-slate-700/50">
                    <Bell size={14} className="mr-2" /> Recent Updates
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                    Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-fin-400 to-fin-600">Notifications</span>
                </h1>
                <p className="text-slate-400 font-bold mt-2 text-lg">
                    Simple insights tailored to your {user?.role || 'daily'} finances.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {insights.map((insight, idx) => (
                    <NotificationCard key={idx} insight={insight} />
                ))}
            </div>
        </div>
    );
};

export default Notifications;
