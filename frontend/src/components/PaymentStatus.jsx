import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PaymentStatus() {
    const location = useLocation();
    const navigate = useNavigate();
    const showToast = useToast();
    const { login } = useAuth(); // If needed to refresh session
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const status = query.get('status');
        const paymentId = query.get('payment_id');

        if (status === 'success') {
            showToast('Payment successful! Your premium subscription is now active.', 'success');
            // Redirect to subscriptions dashboard
            navigate('/user/account/subscriptions');
        } else {
            showToast('Payment was not completed or failed. Please try again.', 'error');
            navigate('/user/dashboard');
        }
        setLoading(false);
    }, [location, navigate, showToast]);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-teal-400" size={32} />
                <p>Verifying payment status, syncing your account...</p>
            </div>
        </div>
    );
}
