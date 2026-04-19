import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, FileBarChart, LogOut, Menu, X, Sun, Moon, Wallet, Bell, Sparkles } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useFinanceInsights } from '../hooks/useFinanceInsights.jsx';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`flex items-center gap-4 px-8 py-4 font-bold transition-all duration-300 relative ${active ? 'bg-fin-50/50 text-fin-500 dark:bg-slate-800 dark:text-fin-400 border-l-[3px] border-fin-500' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white border-l-[3px] border-transparent'}`}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-fin-500' : ''} />
        {label}
    </Link>
);

const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { transactions } = useTransactions();
    const [notifOpen, setNotifOpen] = useState(false);
    const [toasts, setToasts] = useState([]); // Real-time popups
    const lastNotifCount = useRef(0);
    const notifRef = useRef(null);
    
    // Centralized Insights
    const insights = useFinanceInsights();

    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Close notifications on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notifRef]);

    const links = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/transactions', label: 'Transactions', icon: Receipt },
        { to: '/reports', label: 'Reports', icon: FileBarChart },
    ];

    const hour = new Date().getHours();
    const greetingMsg = hour < 12 ? 'Morning' : (hour < 17 ? 'Afternoon' : 'Evening');

    // Live Toast Notification logic
    useEffect(() => {
        if (insights.length > lastNotifCount.current) {
            const newNotif = insights[insights.length - 1];
            const id = Date.now();
            setToasts(prev => [...prev, { ...newNotif, tempId: id }]);
            
            // Remove toast after 5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.tempId !== id));
            }, 5000);
        }
        lastNotifCount.current = insights.length;
    }, [insights]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#030712] transition-colors duration-500 font-sans antialiased text-slate-800 dark:text-slate-200 relative">
            
            {/* Background glowing orbs exclusively for Dark Mode */}
            <div className="hidden dark:block absolute top-0 left-[20%] w-[500px] h-[500px] bg-cyan-600/30 rounded-full blur-[150px] pointer-events-none mix-blend-screen scale-150 -translate-y-1/2"></div>
            <div className="hidden dark:block absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen translate-y-1/4"></div>

            {/* Sidebar Desktop */}
            <aside className="hidden sm:flex flex-col w-64 bg-white dark:bg-[#060c1c]/40 dark:backdrop-blur-3xl border-r border-slate-100 dark:border-white/5 h-full shrink-0 transition-colors pt-8 z-30">
                <div className="flex flex-col items-center justify-center mb-10 px-4 relative">
                    <div className="hidden dark:block absolute inset-0 bg-cyan-500/10 blur-xl rounded-full scale-150 z-0 pointer-events-none"></div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fin-400 to-fin-500 p-1 mb-3 z-10 shadow-[0_4px_15px_rgba(255,122,85,0.4)]">
                        <img src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=ffffff&color=ff7a55`} className="w-full h-full rounded-full border-2 border-white dark:border-[#030712]" alt="Avatar"/>
                    </div>
                    <span className="text-slate-800 dark:text-white font-bold z-10">{user?.name || 'User'}</span>
                    <div className="flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold capitalize">Type: {user?.role || 'Personal'}</span>
                        <span className="text-[10px] text-slate-300 dark:text-slate-500 font-medium tracking-widest">{user?.email}</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-1">
                    {links.map(link => (
                        <SidebarLink key={link.to} {...link} active={location.pathname === link.to} />
                    ))}
                </nav>
                <div className="mt-auto space-y-2 border-t border-slate-100 dark:border-white/5 p-4">
                    <button onClick={toggleDarkMode} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <span className="font-bold">Dark Mode</span>
                        {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold transition-all group">
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/50 z-40 sm:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Content */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.aside 
                        initial={{ x: '-100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-slate-800 z-50 p-4 shadow-2xl sm:hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8 px-2 pt-2">
                            <div className="flex items-center gap-2">
                                <Wallet className="text-fin-600 dark:text-fin-500" size={28} />
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fin-600 to-fin-accent">FinTrack</span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize">{user?.role || 'Personal'}</span>
                                </div>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><X /></button>
                        </div>
                        <nav className="flex-1 space-y-1">
                            {links.map(link => (
                                <SidebarLink key={link.to} {...link} active={location.pathname === link.to} onClick={() => setSidebarOpen(false)} />
                            ))}
                        </nav>
                        <div className="mt-auto space-y-2 border-t pt-4 border-slate-200 dark:border-slate-700">
                             <button onClick={toggleDarkMode} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
                                <span className="font-medium">Theme</span>
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 font-medium">
                                <LogOut size={20} /> Logout
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative z-20">
                <header className="h-20 bg-transparent flex items-center justify-between px-4 sm:px-8 pt-6 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="sm:hidden text-slate-800 dark:text-slate-200 transition"><Menu /></button>
                        <div className="flex flex-col justify-center">
                            <span className="text-slate-800 dark:text-white font-black text-2xl tracking-tight leading-none">Dashboard</span>
                            <span className="text-slate-400 text-xs font-medium mt-1">Financial Management</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="relative" ref={notifRef}>
                            <button 
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/10 shadow-lg flex items-center justify-center text-slate-500 hover:text-fin-500 hover:border-fin-200 transition-all group relative"
                            >
                                <Bell size={24} className="group-hover:rotate-[15deg] transition-transform" />
                                {insights.length > 0 && (
                                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
                                        {insights.length}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-100 dark:border-white/5 shadow-2xl p-4 overflow-hidden z-50 shadow-fin-500/10"
                                    >
                                         <div className="flex items-center justify-between mb-4 px-2">
                                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">A.I. Insights</span>
                                            {insights.length > 0 && (
                                                <span className="px-2 py-0.5 rounded-lg bg-fin-50 text-fin-500 text-[10px] font-black">{insights.length} NEW</span>
                                            )}
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {insights.length > 0 ? (
                                                insights.map((insight) => (
                                                    <div key={insight.id} className={`p-3 rounded-2xl group ${insight.color === 'rose' ? 'bg-rose-50/50 dark:bg-rose-500/5' : insight.color === 'emerald' ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : 'bg-amber-50/50 dark:bg-amber-500/5'}`}>
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${insight.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : insight.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {insight.icon}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs font-black ${insight.color === 'rose' ? 'text-rose-600 dark:text-rose-400' : insight.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                                    {insight.title}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-500 leading-tight mt-0.5">{insight.message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center">
                                                    <p className="text-xs font-bold text-slate-400">All clear! No financial alerts.</p>
                                                </div>
                                            )}
                                        </div>
                                        <Link 
                                            to="/notifications" 
                                            onClick={() => setNotifOpen(false)}
                                            className="block w-full text-center py-3 mt-4 text-[11px] font-black text-white bg-fin-500 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-fin-500/20"
                                        >
                                            View Full Analysis
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile removed for search button space */}
                        <div className="hidden sm:block p-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fin-600 to-fin-accent flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0) || 'U'}
                             </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative custom-scrollbar">
                    <motion.div 
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-7xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* Live Pop-up Toasts */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div 
                            key={toast.tempId}
                            initial={{ opacity: 0, scale: 0.8, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                            className={`p-4 rounded-[1.5rem] border-2 flex gap-4 items-center bg-white dark:bg-slate-900 shadow-2xl pointer-events-auto ${
                                toast.color === 'rose' ? 'border-rose-100 dark:border-rose-500/20 shadow-rose-500/10' : 
                                toast.color === 'emerald' ? 'border-emerald-100 dark:border-emerald-500/20 shadow-emerald-500/10' :
                                'border-amber-100 dark:border-amber-500/20 shadow-amber-500/10'
                            }`}
                        >
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                                toast.color === 'rose' ? 'bg-rose-500 text-white' : toast.color === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                                {toast.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-black uppercase tracking-widest ${
                                    toast.color === 'rose' ? 'text-rose-600' : toast.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>{toast.title}</h4>
                                <p className="text-[11px] font-bold text-slate-500 truncate dark:text-slate-400">{toast.message}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DashboardLayout;
