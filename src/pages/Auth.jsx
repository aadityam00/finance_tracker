import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, Sparkles, Wallet, Mail, Lock, User, Briefcase } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [mode, setMode] = useState(() => {
        const queryMode = searchParams.get('mode');
        if (queryMode === 'signup') return 'signup';
        if (queryMode === 'forgot') return 'forgot';
        if (queryMode === 'reset') return 'reset';
        return 'login';
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'other',
        customRole: ''
    });

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard');
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            if (mode === 'login' || mode === 'signup') {
                const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
                const finalRole = formData.role === 'other' ? formData.customRole : formData.role;
                const body = mode === 'login' 
                    ? { email: formData.email, password: formData.password }
                    : { ...formData, role: finalRole };
                
                const response = await axios.post(`/api${endpoint}`, body);
                
                if (response.data.token) {
                    login(response.data.user || { name: formData.name || formData.email, role: formData.role }, response.data.token);
                    navigate('/dashboard');
                }
            } else if (mode === 'forgot') {
                await axios.post('/api/auth/forgotpassword', { email: formData.email });
                setSuccess("Success! If that account exists, a reset link has been sent to your email.");
            } else if (mode === 'reset') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match.");
                }
                const token = searchParams.get('token');
                const response = await axios.put(`/api/auth/resetpassword/${token}`, { password: formData.password });
                
                if (response.data.token) {
                    setSuccess("Password reset successfully! Redirecting...");
                    setTimeout(() => {
                        login(response.data.user, response.data.token);
                        navigate('/dashboard');
                    }, 2000);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.response?.data?.message || err.message || "Authentication failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = (newMode) => {
        setMode(newMode);
        setError(null);
        setSuccess(null);
    };

    const renderHeader = () => {
        switch (mode) {
            case 'signup': return { title: 'Create Account', sub: 'Start tracking your finances like a pro today.' };
            case 'forgot': return { title: 'Reset Password', sub: 'Enter your email to receive a password reset link.' };
            case 'reset': return { title: 'New Password', sub: 'Secure your account with a fresh password.' };
            default: return { title: 'Welcome Back', sub: 'Continue your journey to financial freedom.' };
        }
    };

    const header = renderHeader();

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-fin-100 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-fin-600 rounded-full mix-blend-multiply blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fin-accent rounded-full mix-blend-multiply blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card rounded-3xl p-8 lg:p-12 shadow-2xl overflow-hidden">
                    <div className="text-center mb-10">
                        <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} className="flex items-center justify-center gap-2 mb-4 text-fin-600 dark:text-fin-500 text-4xl">
                            <Wallet size={48} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                            {header.title}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            {header.sub}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="relative group">
                                        <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-fin-600 transition-colors"><User size={18} /></div>
                                        <input 
                                            id="auth-name"
                                            name="name"
                                            type="text" 
                                            className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none focus:border-fin-500 transition-colors" 
                                            placeholder="Full Name" 
                                            required={mode === 'signup'}
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>

                                    <div className="relative group">
                                         <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-fin-600 transition-colors"><Briefcase size={18} /></div>
                                         <select 
                                            id="auth-role"
                                            name="role"
                                            className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none focus:border-fin-500 transition-colors appearance-none"
                                            value={formData.role}
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                         >
                                            <option value="student" className="bg-white dark:bg-slate-800">Student</option>
                                            <option value="salaried" className="bg-white dark:bg-slate-800">Professional (Salaried)</option>
                                            <option value="freelancer" className="bg-white dark:bg-slate-800">Freelancer / Creative</option>
                                            <option value="business" className="bg-white dark:bg-slate-800">Business Owner</option>
                                            <option value="retired" className="bg-white dark:bg-slate-800">Retired</option>
                                            <option value="other" className="bg-white dark:bg-slate-800">Other</option>
                                         </select>
                                    </div>

                                    {formData.role === 'other' && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            className="relative group"
                                        >
                                            <div className="absolute left-0 top-3 text-fin-600 transition-colors"><Sparkles size={18} /></div>
                                            <input 
                                                id="auth-custom-role"
                                                name="customRole"
                                                type="text" 
                                                className="w-full bg-transparent border-b-2 border-fin-500 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none transition-colors" 
                                                placeholder="Specify your role (e.g. Freelancer, Doctor)" 
                                                required={mode === 'signup' && formData.role === 'other'}
                                                value={formData.customRole}
                                                onChange={e => setFormData({...formData, customRole: e.target.value})}
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode !== 'reset' && (
                            <div className="relative group">
                                <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-fin-600 transition-colors"><Mail size={18} /></div>
                                <input 
                                    id="auth-email"
                                    name="email"
                                    type="email" 
                                    className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none focus:border-fin-500 transition-colors" 
                                    placeholder="Email Address" 
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        )}

                        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                            <div className="relative group">
                                <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-fin-600 transition-colors"><Lock size={18} /></div>
                                <input 
                                    id="auth-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'} 
                                    className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none focus:border-fin-500 transition-colors" 
                                    placeholder={mode === 'reset' ? "New Password" : "Password"}
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        )}

                        {mode === 'reset' && (
                            <div className="relative group">
                                <div className="absolute left-0 top-3 text-slate-400 group-focus-within:text-fin-600 transition-colors"><Lock size={18} /></div>
                                <input 
                                    id="auth-confirm-password"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'} 
                                    className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-8 py-2 focus:outline-none focus:border-fin-500 transition-colors" 
                                    placeholder="Confirm New Password" 
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                />
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="flex justify-end mt-[-1rem]">
                                <button 
                                    type="button" 
                                    onClick={() => toggleMode('forgot')}
                                    className="text-xs font-bold text-slate-400 hover:text-fin-600 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/30 rounded-xl text-xs text-rose-500 font-bold flex items-center gap-2">
                                <Sparkles size={14} /> {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-600 font-bold flex items-center gap-2">
                                <Sparkles size={14} /> {success}
                            </motion.div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-fin-600 to-fin-accent text-white font-bold py-4 rounded-2xl shadow-xl shadow-fin-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                mode === 'login' ? 'Sign In' : 
                                mode === 'signup' ? 'Create Account' : 
                                mode === 'forgot' ? 'Send Reset Link' : 'Reset Password'
                            )}
                        </button>

                        <div className="text-center">
                            <button 
                                type="button" 
                                onClick={() => toggleMode(mode === 'signup' ? 'login' : 'signup')}
                                className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-fin-600 transition-colors"
                            >
                                {mode === 'signup' ? "Already have an account? Log in" : "Don't have an account? Sign up"}
                            </button>
                            {mode === 'forgot' && (
                                <button 
                                    type="button" 
                                    onClick={() => toggleMode('login')}
                                    className="block mx-auto mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Back to Login
                                </button>
                            )}
                        </div>

                        {(mode === 'login' || mode === 'signup') && (
                            <>
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
                                </div>

                                <div className="flex justify-center">
                                    <GoogleLogin 
                                        onSuccess={async (credentialResponse) => {
                                            setLoading(true);
                                            try {
                                                const res = await axios.post('/api/auth/google', { idToken: credentialResponse.credential });
                                                if (res.data.token) {
                                                    login(res.data.user, res.data.token);
                                                    navigate('/dashboard');
                                                }
                                            } catch (err) {
                                                setError(err.response?.data?.error || "Google authentication failed.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        onError={() => setError("Google Login Failed")}
                                        theme="filled_blue"
                                        shape="pill"
                                        text="continue_with"
                                        width="300"
                                    />
                                </div>
                            </>
                        )}
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link to="/landing" className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline decoration-dotted">Back to Marketing Page</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
