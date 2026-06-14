import React, { useEffect, useState, useCallback } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Normalize base URL and ensure '/api' is present regardless of env var content
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API = (path) => `${BASE_URL}${path.startsWith('/api') ? '' : '/api'}${path}`;

export default function SubscriptionsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(API('/user/subscription/status'), { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = isJson ? (data?.msg || 'Failed to load subscription status') : 'Endpoint not found';
        throw new Error(msg);
      }
      setSubscription(isJson ? data.subscription : null);
      setError(null);
    } catch (err) {
      console.error('Load subscription status error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <main className="min-h-screen bg-transparent text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-teal-600 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent mb-4">Your Subscriptions</h1>

        {loading && (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl text-gray-705 dark:text-gray-200 shadow-sm dark:shadow-none">Loading...</div>
        )}

        {!loading && error && (
          <div className="bg-rose-50 dark:bg-red-900/20 border border-rose-200 dark:border-red-500/40 p-4 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-red-400" />
            <span className="text-rose-700 dark:text-red-200">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur p-6 rounded-2xl shadow-sm dark:shadow-none">
            {subscription && subscription.status === 'active' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-green-300 font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5" /> Active Subscription
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Plan: <span className="font-medium">{subscription.plan}</span></p>
                  {subscription.billingPeriod && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Billing: <span className="font-medium">{subscription.billingPeriod}</span></p>
                  )}
                  {subscription.startDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Started: <span className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</span></p>
                  )}
                  {subscription.endDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Renews: <span className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</span></p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-750 dark:text-gray-200">No active subscriptions found.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visit Home to view and subscribe to plans.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
