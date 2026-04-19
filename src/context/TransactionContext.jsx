import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

const API_URL = '/api/transactions';

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token, isAuthenticated } = useAuth();

    const isFetching = useRef(false);

    const fetchTransactions = useCallback(async () => {
        if (!isAuthenticated || !token || isFetching.current) {
            if (!isAuthenticated || !token) setTransactions([]);
            return;
        }
        isFetching.current = true;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}?limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setTransactions(response.data.data || []);
            }
        } catch (err) {
            console.error("Fetch transactions error:", err);
            setError(err.response?.data?.error || "Error fetching transactions");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) fetchTransactions();
    }, [isAuthenticated, fetchTransactions]);

    const addTransaction = async (transaction) => {
        setError(null);
        try {
            const response = await axios.post(API_URL, transaction, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setTransactions(prev => [response.data.data, ...prev]);
                return true;
            }
        } catch (err) {
            console.error("Add transaction error:", err);
            setError(err.response?.data?.error || "Error adding transaction");
            return false;
        }
    };

    const deleteTransaction = async (id) => {
        setError(null);
        try {
            const response = await axios.delete(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setTransactions(prev => prev.filter(t => (t._id || t.id) !== id));
                return true;
            }
        } catch (err) {
            console.error("Delete transaction error:", err);
            setError(err.response?.data?.error || "Error deleting transaction");
            return false;
        }
    };

    const value = useMemo(() => ({
        transactions,
        loading,
        error,
        fetchTransactions,
        addTransaction,
        deleteTransaction
    }), [transactions, loading, error, fetchTransactions, addTransaction, deleteTransaction]);

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransactions = () => useContext(TransactionContext);
