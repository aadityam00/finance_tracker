import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, PieChart, ShieldCheck, Github, Twitter, Linkedin, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-fin-500/30 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
            <Icon size={24} className="text-fin-600 dark:text-fin-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

const Landing = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-[#fafaf9] dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
            {/* Nav Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 lg:px-12">
                <div className="flex items-center gap-2">
                    <Wallet className="text-fin-600 dark:text-fin-500" size={24} />
                    <span className="text-xl font-bold tracking-tight">FinTrack</span>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="px-5 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity">Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/auth" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors">Login</Link>
                            <Link to="/auth?mode=signup" className="px-5 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            <main>
                {/* Hero section */}
                <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="max-w-2xl">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold mb-6 border border-slate-200 dark:border-slate-700"
                            >
                                <Sparkles size={12} />
                                <span>Simpler personal finance</span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-8"
                            >
                                Track your money, <br />
                                <span className="text-fin-600">without the stress.</span>
                            </motion.h1>
                            
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-lg"
                            >
                                We built FinTrack to be the most human-friendly way to manage your expenses and savings. No complex charts, just clean insights.
                            </motion.p>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex items-center gap-4"
                            >
                                <Link to={isAuthenticated ? "/dashboard" : "/auth?mode=signup"} className="px-8 py-4 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]">
                                    {isAuthenticated ? 'Go to Dashboard' : 'Start tracking for free'}
                                    <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                        </div>

                        <div className="relative">
                            <img 
                                src="/hero.png" 
                                alt="Financial Peace" 
                                className="rounded-3xl shadow-xl w-full h-[500px] object-cover"
                            />
                        </div>
                    </div>
                </section>

                {/* Dashboard showcase */}
                <section className="bg-slate-100 dark:bg-slate-900 py-24 px-6 mb-20">
                    <div className="max-w-7xl mx-auto text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">The dashboard you've been waiting for.</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Clean, intuitive, and designed for humans. We removed the clutter so you can focus on what matters.
                        </p>
                    </div>
                    <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                        <img src="/dashboard.png" alt="FinTrack Dashboard" className="w-full h-auto" />
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-7xl mx-auto px-6 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <FeatureCard icon={TrendingUp} title="Real-time Tracking" desc="Instantly see where your money goes with automatic categorization and live updates." />
                         <FeatureCard icon={PieChart} title="Deep Insights" desc="Understand your spending patterns with beautiful, easy-to-read visualizations." />
                         <FeatureCard icon={ShieldCheck} title="Privacy First" desc="Your data is your business. We use top-tier encryption to keep your records safe." />
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-20 px-6 border-t border-slate-200 dark:border-slate-800 mt-20">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col gap-4 items-center md:items-start">
                            <div className="flex items-center gap-2">
                                <Wallet className="text-fin-600 dark:text-fin-500" size={24} />
                                <span className="text-xl font-bold">FinTrack</span>
                            </div>
                            <p className="text-slate-500 text-sm max-w-xs text-center md:text-left">
                                Making personal finance simple, one transaction at a time.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-end gap-6">
                            <div className="flex gap-6">
                                <Github size={20} className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer" />
                                <Twitter size={20} className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer" />
                                <Linkedin size={20} className="text-slate-400 hover:text-slate-900 transition-colors cursor-pointer" />
                            </div>
                            <p className="text-slate-400 text-xs">© 2026 FinTrack. Built with care.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Landing;
