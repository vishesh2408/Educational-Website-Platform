import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Lock,
    Info,
    AlertCircle,
    ArrowLeft,
    Check,
    Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const getBaseUrl = () => {
    let url = process.env.REACT_APP_API_BASE_URL;
    if (!url) {
        url = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.REACT_APP_API_BASE_URL;
    }
    // Fallback if URL is relative or points back to front-end port
    if (!url || url === '/' || url.includes('localhost:5173')) {
        return 'http://localhost:3001';
    }
    return url;
};

const BASE_URL = getBaseUrl();
const API_BASE_URL = `${BASE_URL}/api`;

export default function PaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const showToast = useToast();

    // State parameters with fallback definitions
    const paymentState = location.state || {
        planName: 'Starter Plan',
        planType: 'starter',
        billingPeriod: 'monthly',
        amount: 29,
        isForumPremium: false
    };

    const { planName, planType, billingPeriod, amount, isForumPremium } = paymentState;
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [configError, setConfigError] = useState(null);



    // Dynamically load the official Razorpay Checkout Script
    useEffect(() => {
        const scriptId = 'razorpay-checkout-script';
        const existingScript = document.getElementById(scriptId);

        if (existingScript) {
            setIsScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            setIsScriptLoaded(true);
            console.log('Razorpay Checkout SDK loaded successfully.');
        };
        script.onerror = () => {
            setIsScriptLoaded(false);
            showToast('Failed to load Razorpay payment widget. Please check your connection.', 'error');
        };
        document.body.appendChild(script);

        return () => {
            // Leave script loaded globally for future visits
        };
    }, [showToast]);

    // Handle payment checkout trigger using actual Razorpay SDK
    const handlePaymentCheckout = async () => {
        if (!isScriptLoaded) {
            showToast('Razorpay script is still loading. Please wait.', 'info');
            return;
        }

        setIsProcessing(true);
        setConfigError(null);

        try {
            // Generate a deterministic idempotency key for this specific order intent.
            // This ensures that if the user double-clicks or the request retries,
            // the backend returns the same pending order instead of creating duplicates.
            const idempotencyKey = `${currentUser?._id || currentUser?.id}_${planType}_${billingPeriod}_${isForumPremium || false}`;

            // 1. Create a Razorpay Order in the backend
            const orderRes = await fetch(`${API_BASE_URL}/user/payment/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    planType,
                    billingPeriod,
                    isForumPremium: isForumPremium || false,
                    idempotencyKey
                })
            });

            if (!orderRes.ok) {
                const errorText = await orderRes.text();
                let errMsg = 'Could not initiate payment session.';
                try {
                    const errJson = JSON.parse(errorText);
                    errMsg = errJson.error ? `${errJson.msg} (${errJson.error})` : (errJson.msg || errMsg);
                } catch (_) {
                    errMsg = `Server error (${orderRes.status}): ${errorText.substring(0, 100)}`;
                }
                throw new Error(errMsg);
            }

            const orderData = await orderRes.json();

            // 2. Configure Razorpay checkout options
            const options = {
                key: process.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId || 'rzp_test_SzymsJUoBmAKDO',
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'LearnBent Educational Platform',
                description: `Subscription plan: ${planName} (${billingPeriod})`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    setIsProcessing(true);
                    try {
                        // 3. Verify Payment Signature on backend
                        const verifyRes = await fetch(`${API_BASE_URL}/user/payment/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planType: orderData.planType,
                                billingPeriod: orderData.billingPeriod
                            })
                        });

                        if (!verifyRes.ok) {
                            const verifyErrText = await verifyRes.text();
                            let verifyErrMsg = 'Verification failed.';
                            try {
                                const verifyErrJson = JSON.parse(verifyErrText);
                                verifyErrMsg = verifyErrJson.msg || verifyErrMsg;
                            } catch (_) {
                                verifyErrMsg = `Verification server error (${verifyRes.status}): ${verifyErrText.substring(0, 100)}`;
                            }
                            showToast(verifyErrMsg, 'error');
                            return;
                        }

                        const verifyData = await verifyRes.json();

                        showToast(`Subscription to ${planName} activated successfully!`, 'success');
                        navigate('/user/account/subscriptions');
                    } catch (verifyErr) {
                        console.error('Verification request failed:', verifyErr);
                        showToast('Verification failed due to connection error.', 'error');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: currentUser?.username || '',
                    email: currentUser?.email || '',
                    contact: ''
                },
                theme: {
                    color: '#167468'
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        showToast('Payment checkout cancelled. The window was closed.', 'warning');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error('Razorpay payment failed:', response.error);
                showToast(`Payment failed: ${response.error.description}`, 'error');
                setIsProcessing(false);
            });
            rzp.open();

        } catch (err) {
            console.error('Checkout error:', err);
            setConfigError(err.message);
            showToast(err.message || 'An error occurred during checkout initialization.', 'error');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-900 dark:text-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 shadow-sm dark:shadow-none">
                <div>
                    <button 
                        onClick={() => navigate('/user/dashboard')}
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors focus:outline-none mb-4"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </button>
                    <span className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold block mb-1">Confirm Subscription Order</span>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Razorpay Secure Checkout</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{billingPeriod} Billing cycle</p>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-650 dark:text-gray-300 font-medium">Selected Plan:</span>
                        <span className="text-gray-900 dark:text-white font-bold">{planName}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-650 dark:text-gray-300 font-medium">Billing Term:</span>
                        <span className="text-gray-900 dark:text-white font-bold capitalize">{billingPeriod}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-baseline">
                        <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">Amount Due:</span>
                        <div className="text-right">
                            <span className="text-3xl font-extrabold text-teal-650 dark:text-teal-400">₹{amount}</span>
                            <span className="text-[10px] text-gray-550 dark:text-gray-400 block mt-0.5">Incl. all taxes</span>
                        </div>
                    </div>
                </div>

                {/* Error handling */}
                {configError && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/25 rounded-xl flex gap-3 items-start">
                        <AlertCircle className="text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <span className="text-sm font-bold text-rose-700 dark:text-rose-300 block">Payment Error</span>
                            <p className="text-xs text-rose-600 dark:text-rose-200 mt-0.5 leading-relaxed">{configError}</p>
                            <span className="text-[10px] text-rose-505 dark:text-rose-400/80 block mt-2 font-semibold">
                                Tip: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured in the backend .env file.
                            </span>
                        </div>
                    </div>
                )}

                {/* Secure info card */}
                <div className="bg-teal-50/50 dark:bg-[#121c30] rounded-xl p-4 border border-teal-200 dark:border-teal-500/20 text-xs text-gray-750 dark:text-gray-300 flex gap-2">
                    <Info size={16} className="text-teal-650 dark:text-teal-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-teal-900 dark:text-white block mb-0.5">Razorpay Gateway Integration</span>
                        Pressing pay will open the official Razorpay widget where you can complete the Indian payment (INR) securely via Cards, UPI, Netbanking, or Wallet.
                    </div>
                </div>

                {/* Checkout Trigger Button */}
                <button
                    onClick={handlePaymentCheckout}
                    disabled={isProcessing || !isScriptLoaded}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-[#167468] text-white font-bold text-sm tracking-wide border border-white/10 hover:shadow-lg hover:shadow-[#167468]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Initiating Session...</span>
                        </>
                    ) : !isScriptLoaded ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Loading Razorpay Widget...</span>
                        </>
                    ) : (
                        <>
                            <Lock size={16} />
                            <span>Proceed to Pay ₹{amount}</span>
                        </>
                    )}
                </button>

                {/* Security seals */}
                <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-200 dark:border-white/10 text-[10px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-teal-650 dark:text-teal-400" />
                        <span>256-bit Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center font-bold text-[8px] text-white">R</div>
                        <span>Razorpay Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
