// src/components/SubscriptionManagement.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, PlusCircle, Edit, Trash2, Info, CreditCard, Key, UserMinus } from 'lucide-react';
import './SubscriptionManagement.css';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const MessageBox = ({ type, text }) => {
    if (!text) return null;
    let Icon;
    let classes = 'message-box ';
    switch (type) {
        case 'info': Icon = Info; classes += 'message-info'; break;
        case 'success': Icon = CheckCircle; classes += 'message-success'; break;
        case 'error': Icon = AlertCircle; classes += 'message-error'; break;
        default: Icon = Info; classes += 'message-info';
    }
    return (
        <div className={classes}>
            {Icon && <Icon size={20} />}
            {text}
        </div>
    );
};

const ConfirmationModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'button-danger' }) => {
    if (!show) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button onClick={onCancel} className="modal-close-button">
                        <X size={24} />
                    </button>
                </div>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button onClick={onCancel} className="button-base button-cancel">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className={`button-base ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SubscriptionManagement = () => {
    const { currentUser, logout } = useAuth();
    const handleLogout = logout;

    const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'payments'
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [selectedSliderIdx, setSelectedSliderIdx] = useState(0);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);
    const [paymentDashboardView, setPaymentDashboardView] = useState('paid'); // 'paid' or 'free'
    const [grantToRevoke, setGrantToRevoke] = useState(null); // { userId, planId, username }

    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({
        name: '',
        planType: 'starter',
        description: '',
        monthlyPrice: '',
        yearlyPrice: '',
        featuresRaw: '',
        isPopular: false,
        isForumPremium: false,
        active: true
    });
    const [editingPlan, setEditingPlan] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGrantsModalOpen, setIsGrantsModalOpen] = useState(false);
    const [selectedPlanForGrants, setSelectedPlanForGrants] = useState(null);
    const [freeUserInput, setFreeUserInput] = useState('');

    useEffect(() => {
        fetchPlans();
        if (activeTab === 'payments') {
            fetchPayments();
        }
    }, [currentUser, activeTab]);

    const fetchPlans = async () => {
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPlans(data);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch subscription plans.' });
            }
        } catch (error) {
            console.error('Error fetching subscription plans:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch subscription plans.' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPayments = async () => {
        setPaymentsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payments`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPayments(data);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to fetch payments.' });
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to fetch payments.' });
        } finally {
            setPaymentsLoading(false);
        }
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        const features = newPlan.featuresRaw
            .split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const payload = {
            name: newPlan.name,
            planType: newPlan.planType,
            description: newPlan.description,
            monthlyPrice: parseFloat(newPlan.monthlyPrice),
            yearlyPrice: parseFloat(newPlan.yearlyPrice),
            features,
            isPopular: newPlan.isPopular,
            isForumPremium: newPlan.isForumPremium,
            active: newPlan.active
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPlans([...plans, data]);
                setNewPlan({
                    name: '',
                    planType: 'starter',
                    description: '',
                    monthlyPrice: '',
                    yearlyPrice: '',
                    featuresRaw: '',
                    isPopular: false,
                    isForumPremium: false,
                    active: true
                });
                setFormMessage({ type: 'success', text: 'Subscription plan added successfully!' });
                setIsAddModalOpen(false);
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to add subscription plan.' });
            }
        } catch (error) {
            console.error('Error adding plan:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to add plan.' });
        } finally {
            setIsLoading(false);
        }
    };

    const startEditingPlan = (plan) => {
        setEditingPlan({
            ...plan,
            featuresRaw: plan.features ? plan.features.join('\n') : ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setEditingPlan(prev => ({ ...prev, [name]: val }));
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!editingPlan?._id) {
            setFormMessage({ type: 'error', text: 'Plan ID missing.' });
            setIsLoading(false);
            return;
        }

        const features = editingPlan.featuresRaw
            .split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        const payload = {
            name: editingPlan.name,
            planType: editingPlan.planType,
            description: editingPlan.description,
            monthlyPrice: parseFloat(editingPlan.monthlyPrice),
            yearlyPrice: parseFloat(editingPlan.yearlyPrice),
            features,
            isPopular: editingPlan.isPopular,
            isForumPremium: editingPlan.isForumPremium,
            active: editingPlan.active
        };

        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${editingPlan._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPlans(plans.map(p => (p._id === data._id ? data : p)));
                setIsEditModalOpen(false);
                setEditingPlan(null);
                setFormMessage({ type: 'success', text: 'Subscription plan updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update subscription plan.' });
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to update plan.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeletePlan = (planId) => {
        setPlanToDelete(planId);
        setIsDeleting(true);
    };

    const handleDeletePlan = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!planToDelete) {
            setFormMessage({ type: 'error', text: 'Plan ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/${planToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPlans(plans.filter(p => p._id !== planToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Plan deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete plan.' });
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            setFormMessage({ type: 'error', text: 'Network error or server unavailable. Failed to delete plan.' });
        } finally {
            setIsDeleting(false);
            setPlanToDelete(null);
            setIsLoading(false);
        }
    };

    const startManagingGrants = (plan) => {
        setSelectedPlanForGrants(plan);
        setFreeUserInput('');
        setIsGrantsModalOpen(true);
    };

    const handleGrantFree = async (e) => {
        e.preventDefault();
        if (!selectedPlanForGrants) return;
        const userIdOrEmail = freeUserInput.trim();
        if (!userIdOrEmail) {
            setFormMessage({ type: 'error', text: 'Please enter a user ID or email.' });
            return;
        }
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/grant-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ planId: selectedPlanForGrants._id, userIdOrEmail })
            });
            const data = await response.json();
            if (response.ok) {
                setPlans(plans.map(p => p._id === data.plan._id ? data.plan : p));
                setSelectedPlanForGrants(data.plan);
                setFreeUserInput('');
                setFormMessage({ type: 'success', text: 'Free access granted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to grant free access.' });
            }
        } catch (error) {
            console.error('Error granting access:', error);
            setFormMessage({ type: 'error', text: 'Server error. Failed to grant access.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeFree = async (userId, planId = null) => {
        const targetPlanId = planId || selectedPlanForGrants?._id;
        if (!targetPlanId) return;
        setIsLoading(true);
        setFormMessage({ type: '', text: '' });
        try {
            const response = await fetch(`${API_BASE_URL}/admin/subscription-plans/revoke-free`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ planId: targetPlanId, userId })
            });
            const data = await response.json();
            if (response.ok) {
                setPlans(plans.map(p => p._id === data.plan._id ? data.plan : p));
                if (selectedPlanForGrants && selectedPlanForGrants._id === data.plan._id) {
                    setSelectedPlanForGrants(data.plan);
                }
                setFormMessage({ type: 'success', text: 'Free access revoked successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to revoke free access.' });
            }
        } catch (error) {
            console.error('Error revoking access:', error);
            setFormMessage({ type: 'error', text: 'Server error. Failed to revoke access.' });
        } finally {
            setIsLoading(false);
        }
    };

    const getFreeUsersForCategory = (categoryName) => {
        const matchingPlans = plans.filter(p => {
            if (categoryName === 'forum') {
                return p.isForumPremium;
            }
            const name = (p.name || '').toLowerCase();
            const type = (p.planType || '').toLowerCase();
            if (name.includes('forum')) return false;
            if (categoryName === 'starter') return name === 'starter' || type === 'starter';
            if (categoryName === 'professional') return name === 'professional' || type === 'professional';
            if (categoryName === 'enterprise') return name === 'enterprise' || type === 'enterprise';
            return false;
        });

        const usersList = [];
        matchingPlans.forEach(plan => {
            if (plan.freeFor?.users) {
                plan.freeFor.users.forEach(user => {
                    // Check if user is an object and has username/email populated
                    usersList.push({
                        user,
                        planId: plan._id,
                        planName: plan.name
                    });
                });
            }
        });
        return usersList;
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);

        if (!editingPayment?._id) {
            setFormMessage({ type: 'error', text: 'Payment ID missing.' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/payments/${editingPayment._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    amount: parseFloat(editingPayment.amount),
                    status: editingPayment.status,
                    billingPeriod: editingPayment.billingPeriod,
                    endDate: editingPayment.endDate ? new Date(editingPayment.endDate).toISOString() : null
                }),
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPayments(payments.map(p => (p._id === data._id ? data : p)));
                setIsEditPaymentModalOpen(false);
                setEditingPayment(null);
                setFormMessage({ type: 'success', text: 'Payment details updated successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to update payment.' });
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            setFormMessage({ type: 'error', text: 'Network error. Failed to update payment.' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeletePayment = (paymentId) => {
        setPaymentToDelete(paymentId);
        setIsDeletingPayment(true);
    };

    const handleDeletePayment = async () => {
        setFormMessage({ type: '', text: '' });
        setIsLoading(true);
        if (!paymentToDelete) {
            setFormMessage({ type: 'error', text: 'Payment ID missing for deletion.' });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setFormMessage({ type: 'error', text: 'Authentication failed. Please log in again.' });
                handleLogout();
                return;
            }

            if (response.ok) {
                setPayments(payments.filter(p => p._id !== paymentToDelete));
                setFormMessage({ type: 'success', text: data.msg || 'Payment log deleted successfully!' });
            } else {
                setFormMessage({ type: 'error', text: data.msg || 'Failed to delete payment log.' });
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
            setFormMessage({ type: 'error', text: 'Network error. Failed to delete payment log.' });
        } finally {
            setIsDeletingPayment(false);
            setPaymentToDelete(null);
            setIsLoading(false);
        }
    };

    const getEndDateText = (p) => {
        if (p.status !== 'paid') return 'N/A';
        if (p.endDate) {
            return new Date(p.endDate).toLocaleString();
        }
        const date = new Date(p.createdAt);
        if (p.billingPeriod === 'yearly') {
            date.setFullYear(date.getFullYear() + 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        return date.toLocaleString();
    };

    const formatForDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    // Calculate metrics for dashboard
    const paidPayments = payments.filter(p => p.status === 'paid');
    const totalEarnings = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSalesCount = paidPayments.length;

    const forumEarnings = paidPayments
        .filter(p => p.planId?.isForumPremium)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const courseEarnings = paidPayments
        .filter(p => !p.planId?.isForumPremium)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Group sales by plan ID
    const planStats = {};
    paidPayments.forEach(p => {
        const planIdStr = p.planId?._id || 'unknown';
        const planName = p.planId?.name || 'Deleted Plan';
        const planType = p.planId?.planType || 'N/A';
        const isForum = p.planId?.isForumPremium || false;
        if (!planStats[planIdStr]) {
            planStats[planIdStr] = {
                name: planName,
                type: planType,
                isForum,
                count: 0,
                revenue: 0
            };
        }
        planStats[planIdStr].count += 1;
        planStats[planIdStr].revenue += p.amount || 0;
    });
    const planStatsList = Object.values(planStats).sort((a, b) => b.revenue - a.revenue);

    // Filter payments by category
    const getPlanCategory = (p) => {
        if (p.planId?.isForumPremium) return 'forum';
        const name = (p.planId?.name || '').toLowerCase();
        const type = (p.planId?.planType || '').toLowerCase();
        if (name.includes('forum')) return 'forum';
        if (name === 'starter' || type === 'starter') return 'starter';
        if (name === 'professional' || type === 'professional') return 'professional';
        if (name === 'enterprise' || type === 'enterprise') return 'enterprise';
        
        // Fallback based on amount if planId is missing
        if (p.amount === 29 || p.amount === 290) return 'starter';
        if (p.amount === 59 || p.amount === 590) return 'professional';
        if (p.amount === 99 || p.amount === 990) return 'enterprise';
        if (p.amount === 999) return 'forum';
        
        return 'starter'; // Default fallback
    };

    const starterPayments = payments.filter(p => p.status === 'paid' && getPlanCategory(p) === 'starter');
    const proPayments = payments.filter(p => p.status === 'paid' && getPlanCategory(p) === 'professional');
    const enterprisePayments = payments.filter(p => p.status === 'paid' && getPlanCategory(p) === 'enterprise');
    const forumPayments = payments.filter(p => p.status === 'paid' && getPlanCategory(p) === 'forum');

    const starterFree = getFreeUsersForCategory('starter');
    const proFree = getFreeUsersForCategory('professional');
    const enterpriseFree = getFreeUsersForCategory('enterprise');
    const forumFree = getFreeUsersForCategory('forum');

    const renderPaymentsTable = (filteredPayments, planLabel) => {
        if (filteredPayments.length === 0) {
            return (
                <div className="text-center py-10 px-4 border border-dashed border-gray-255 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/10">
                    <p className="text-sm text-gray-550 dark:text-gray-400 italic">
                        No transactions recorded for the <span className="font-semibold text-teal-600 dark:text-teal-400">{planLabel}</span> plan.
                    </p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left border-collapse text-xs min-w-[850px] sm:min-w-0">
                    <thead>
                        <tr className="border-b border-gray-150 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-medium">Purchased By (User)</th>
                            <th className="pb-2 font-medium">Plan</th>
                            <th className="pb-2 font-medium">Period</th>
                            <th className="pb-2 font-medium">Razorpay Details</th>
                            <th className="pb-2 font-medium">Amount</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium">Purchase Date</th>
                            <th className="pb-2 font-medium">End Date & Time</th>
                            <th className="pb-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map((p) => (
                            <tr key={p._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/20">
                                <td className="py-3 pr-2">
                                    <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                                        {p.userId?.username || 'Unknown User'}
                                    </div>
                                    <div className="text-gray-400 truncate max-w-[150px]">
                                        {p.userId?.email || 'N/A'}
                                    </div>
                                </td>
                                <td className="py-3 font-semibold pr-2">
                                    {p.planId?.name || (p.amount === 999 ? 'Forum Premium' : 'Premium Plan')}
                                    {p.planId?.isForumPremium && <span className="ml-1 text-[10px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1 py-0.5 rounded">Forum</span>}
                                </td>
                                <td className="py-3 capitalize pr-2">{p.billingPeriod}</td>
                                <td className="py-3 font-mono text-[10px] text-gray-500 dark:text-gray-400 pr-2">
                                    <div>O: {p.razorpayOrderId}</div>
                                    <div>P: {p.razorpayPaymentId || 'N/A'}</div>
                                </td>
                                <td className="py-3 font-bold text-gray-900 dark:text-white pr-2">₹{p.amount}</td>
                                <td className="py-3 pr-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        p.status === 'paid' 
                                            ? 'bg-green-105 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : p.status === 'pending'
                                            ? 'bg-yellow-105 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-red-105 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="py-3 text-gray-500 dark:text-gray-400">
                                    {new Date(p.createdAt).toLocaleString()}
                                </td>
                                <td className="py-3 text-gray-500 dark:text-gray-400">
                                    {getEndDateText(p)}
                                </td>
                                <td className="py-3 admin-table-actions">
                                    <button 
                                        onClick={() => {
                                            setEditingPayment({
                                                ...p,
                                                endDate: p.endDate || (p.status === 'paid' ? (p.billingPeriod === 'yearly' ? new Date(new Date(p.createdAt).setFullYear(new Date(p.createdAt).getFullYear() + 1)).toISOString() : new Date(new Date(p.createdAt).setMonth(new Date(p.createdAt).getMonth() + 1)).toISOString()) : null)
                                            });
                                            setIsEditPaymentModalOpen(true);
                                        }} 
                                        title="Edit Payment" 
                                        className="admin-action-button edit-button"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => confirmDeletePayment(p._id)} 
                                        title="Delete Payment" 
                                        className="admin-action-button delete-button"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderFreeGrantsTable = (filteredFreeGrants, planLabel) => {
        if (filteredFreeGrants.length === 0) {
            return (
                <div className="text-center py-10 px-4 border border-dashed border-gray-255 dark:border-slate-700 rounded-lg bg-gray-50/50 dark:bg-slate-900/10">
                    <p className="text-sm text-gray-550 dark:text-gray-400 italic">
                        No active free grants recorded for the <span className="font-semibold text-teal-600 dark:text-teal-400">{planLabel}</span> plan.
                    </p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto w-full min-w-0">
                <table className="w-full text-left border-collapse text-xs min-w-[700px] sm:min-w-0">
                    <thead>
                        <tr className="border-b border-gray-150 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-medium">Granted User</th>
                            <th className="pb-2 font-medium">Plan Name</th>
                            <th className="pb-2 font-medium">Access Type</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFreeGrants.map(({ user, planId, planName }) => (
                            <tr key={`${planId}-${user._id || user}`} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/20">
                                <td className="py-3 pr-2">
                                    <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                                        {user.username || 'User'}
                                    </div>
                                    <div className="text-gray-400 truncate max-w-[200px]">
                                        {user.email || (typeof user === 'string' ? user : user._id)}
                                    </div>
                                </td>
                                <td className="py-3 font-semibold pr-2">
                                    {planName}
                                </td>
                                <td className="py-3 pr-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        Free Grant
                                    </span>
                                </td>
                                <td className="py-3 pr-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        Active
                                    </span>
                                </td>
                                <td className="py-3 admin-table-actions">
                                    <button 
                                        type="button"
                                        onClick={() => setGrantToRevoke({ 
                                            userId: user._id || user, 
                                            planId, 
                                            username: user.username || 'this user' 
                                        })} 
                                        title="Revoke Grant" 
                                        className="button-base button-danger flex items-center gap-1 text-[10px] py-1 px-2.5 rounded"
                                    >
                                        <UserMinus size={14} /> Revoke Access
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="subscription-management-container w-full max-w-full overflow-hidden min-w-0">
            <MessageBox type={formMessage.type} text={formMessage.text} />
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-250 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'plans'
                            ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-semibold'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    Plans Management
                </button>
                <button
                    onClick={() => {
                        setActiveTab('payments');
                        fetchPayments();
                    }}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'payments'
                            ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-semibold'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    Payment & Revenue Dashboard
                </button>
            </div>

            {activeTab === 'plans' ? (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <h3 className="admin-section-title mb-0 border-b-0 pb-0 flex items-center gap-2">
                            <CreditCard size={20} /> Existing Subscription Plans
                        </h3>
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="admin-button-primary flex items-center gap-2 self-start sm:self-auto"
                        >
                            <PlusCircle size={18} /> Add New Plan
                        </button>
                    </div>

                    {isLoading && plans.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400">Loading subscription plans...</p>
                    ) : plans.length === 0 ? (
                        <p className="message-info">No plans found. Add a new plan above!</p>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead className="admin-table-thead">
                                    <tr>
                                        <th className="admin-table-th rounded-tl-lg">Plan Name</th>
                                        <th className="admin-table-th">Type</th>
                                        <th className="admin-table-th">Monthly</th>
                                        <th className="admin-table-th">Yearly</th>
                                        <th className="admin-table-th">Popular / Forum</th>
                                        <th className="admin-table-th">Status</th>
                                        <th className="admin-table-th rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map((plan) => (
                                        <tr key={plan._id} className="admin-table-tr">
                                            <td className="admin-table-td font-semibold" data-label="Plan Name">{plan.name}</td>
                                            <td className="admin-table-td capitalize" data-label="Type">{plan.planType}</td>
                                            <td className="admin-table-td" data-label="Monthly">₹{plan.monthlyPrice}</td>
                                            <td className="admin-table-td" data-label="Yearly">₹{plan.yearlyPrice}</td>
                                            <td className="admin-table-td" data-label="Popular / Forum">
                                                <div className="badges-list">
                                                    {plan.isPopular && <span className="badge badge-popular">Popular</span>}
                                                    {plan.isForumPremium && <span className="badge badge-forum">Forum</span>}
                                                    {!plan.isPopular && !plan.isForumPremium && <span className="text-gray-400">-</span>}
                                                </div>
                                            </td>
                                            <td className="admin-table-td" data-label="Status">
                                                <span className={`status-dot ${plan.active ? 'status-active' : 'status-inactive'}`}>
                                                    {plan.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="admin-table-td admin-table-actions">
                                                <button onClick={() => startManagingGrants(plan)} title="Grants" className="button-action button-grants">
                                                    <Key size={18} />
                                                </button>
                                                <button onClick={() => startEditingPlan(plan)} title="Edit" className="button-action button-edit">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => confirmDeletePlan(plan._id)} title="Delete" className="button-action button-delete">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {isAddModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-large">
                                <div className="modal-header">
                                    <h3 className="modal-title flex items-center gap-2">
                                        <PlusCircle size={22} className="text-teal-500" /> Add New Subscription Plan
                                    </h3>
                                    <button onClick={() => setIsAddModalOpen(false)} className="modal-close-button">
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <form onSubmit={handleAddPlan} className="form-container mt-4">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="newPlanName" className="form-label font-medium">Plan Name</label>
                                            <input type="text" id="newPlanName" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} required className="form-input" placeholder="e.g. Starter, Premium" />
                                        </div>
                                        
                                        <div className="form-group">
                                            <label htmlFor="newPlanType" className="form-label font-medium">Plan Type (System Role)</label>
                                            <select id="newPlanType" value={newPlan.planType} onChange={(e) => setNewPlan({ ...newPlan, planType: e.target.value })} required className="form-select">
                                                <option value="starter">Starter</option>
                                                <option value="professional">Professional</option>
                                                <option value="enterprise">Enterprise</option>
                                            </select>
                                        </div>
                    
                                        <div className="form-group">
                                            <label htmlFor="newPlanMonthlyPrice" className="form-label font-medium">Monthly Price (₹)</label>
                                            <input type="number" id="newPlanMonthlyPrice" value={newPlan.monthlyPrice} onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: e.target.value })} required className="form-input" placeholder="29" />
                                        </div>
                    
                                        <div className="form-group">
                                            <label htmlFor="newPlanYearlyPrice" className="form-label font-medium">Yearly Price (₹)</label>
                                            <input type="number" id="newPlanYearlyPrice" value={newPlan.yearlyPrice} onChange={(e) => setNewPlan({ ...newPlan, yearlyPrice: e.target.value })} required className="form-input" placeholder="290" />
                                        </div>
                                    </div>
                    
                                    <div className="form-group">
                                        <label htmlFor="newPlanDesc" className="form-label font-medium">Description</label>
                                        <input type="text" id="newPlanDesc" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} required className="form-input" placeholder="Plan brief description" />
                                    </div>
                    
                                    <div className="form-group">
                                        <label htmlFor="newPlanFeatures" className="form-label font-medium">Features (one per line. Supports dynamic variables: {"{freeCourses}"}, {"{paidCourses}"})</label>
                                        <textarea id="newPlanFeatures" value={newPlan.featuresRaw} onChange={(e) => setNewPlan({ ...newPlan, featuresRaw: e.target.value })} required className="form-textarea" rows={4} placeholder="Access to {freeCourses}+ courses&#10;Email support&#10;Community Access"></textarea>
                                    </div>
                    
                                    <div className="form-row-checkboxes">
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={newPlan.isPopular} onChange={(e) => setNewPlan({ ...newPlan, isPopular: e.target.checked })} />
                                            <span>Mark as Popular</span>
                                        </label>
                    
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={newPlan.isForumPremium} onChange={(e) => setNewPlan({ ...newPlan, isForumPremium: e.target.checked })} />
                                            <span>Is Forum Premium plan</span>
                                        </label>
                    
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={newPlan.active} onChange={(e) => setNewPlan({ ...newPlan, active: e.target.checked })} />
                                            <span>Active (Visible to users)</span>
                                        </label>
                                    </div>
                    
                                    <div className="modal-actions">
                                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="button-base button-cancel">Cancel</button>
                                        <button type="submit" disabled={isLoading} className="button-base button-primary">
                                            {isLoading ? 'Adding...' : 'Add Plan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Payment & Revenue Dashboard Tab */
                <div className="w-full max-w-full overflow-hidden min-w-0 space-y-6">
                    {/* Financial Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-150 dark:border-gray-700 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">Total Revenue</div>
                            <div className="text-2xl font-bold mt-1 text-teal-600 dark:text-teal-400 truncate">₹{totalEarnings.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">Life-time premium earnings</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-150 dark:border-gray-700 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">Total Sales</div>
                            <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400 truncate">{totalSalesCount}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">Paid subscription purchases</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-150 dark:border-gray-700 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">Forum Premium Revenue</div>
                            <div className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400 truncate">₹{forumEarnings.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">Earned via Forum access</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-150 dark:border-gray-700 min-w-0">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider truncate">Course Premium Revenue</div>
                            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 truncate">₹{courseEarnings.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-gray-400 mt-1 truncate">Earned via Course access</div>
                        </div>
                    </div>

                    {/* Revenue Breakdown by Plan */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-150 dark:border-gray-700 p-4 w-full max-w-full overflow-hidden min-w-0">
                        <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-white uppercase tracking-wider">Revenue Breakdown by Plan</h4>
                        {planStatsList.length === 0 ? (
                            <p className="text-sm text-gray-500 italic text-center py-4">No plan revenue statistics available.</p>
                        ) : (
                            <div className="overflow-x-auto w-full min-w-0">
                                <table className="w-full text-left border-collapse text-sm min-w-[600px] sm:min-w-0">
                                    <thead>
                                        <tr className="border-b border-gray-150 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                            <th className="pb-2 font-medium">Plan Name</th>
                                            <th className="pb-2 font-medium">Type</th>
                                            <th className="pb-2 font-medium">Forum Premium?</th>
                                            <th className="pb-2 font-medium">Sales Count</th>
                                            <th className="pb-2 font-medium text-right">Revenue Generated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {planStatsList.map((ps, idx) => (
                                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/20">
                                                <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{ps.name}</td>
                                                <td className="py-2.5 capitalize">{ps.type}</td>
                                                <td className="py-2.5">
                                                    {ps.isForum ? (
                                                        <span className="badge badge-forum">Forum</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 font-semibold text-blue-600 dark:text-blue-400">{ps.count}</td>
                                                <td className="py-2.5 font-bold text-right text-emerald-600 dark:text-emerald-400">₹{ps.revenue.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Purchase History & Transaction Log / Free Grants Log */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-150 dark:border-gray-700 p-4 w-full max-w-full overflow-hidden min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                            <div className="flex flex-col gap-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-white uppercase tracking-wider truncate">
                                    {paymentDashboardView === 'paid' ? 'Purchase History & Transaction Log' : 'Free Grants Log'}
                                </h4>
                                <p className="text-xs text-gray-400 truncate">
                                    {paymentDashboardView === 'paid' 
                                        ? 'View paid transactions premium-wise using the sliding selector below' 
                                        : 'View active free subscription grants premium-wise using the sliding selector below'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                                <select
                                    id="dashboardViewSelect"
                                    value={paymentDashboardView}
                                    onChange={(e) => {
                                        setPaymentDashboardView(e.target.value);
                                        setSelectedSliderIdx(0); // Reset slider index when view changes
                                    }}
                                    className="text-xs px-2.5 py-1.5 rounded border border-gray-250 bg-white dark:bg-slate-800 dark:border-gray-700 dark:text-white font-medium"
                                >
                                    <option value="paid">Paid Purchases</option>
                                    <option value="free">Free Grants</option>
                                </select>
                                {paymentDashboardView === 'paid' && (
                                    <button 
                                        onClick={() => fetchPayments()} 
                                        className="text-xs px-2.5 py-1.5 rounded border border-gray-250 hover:bg-gray-50 text-gray-700 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-slate-700"
                                    >
                                        Refresh Data
                                    </button>
                                )}
                            </div>
                        </div>

                        {paymentDashboardView === 'paid' && paymentsLoading ? (
                            <p className="text-center text-gray-500 py-8">Loading transactions...</p>
                        ) : paymentDashboardView === 'paid' && payments.length === 0 ? (
                            <p className="text-center text-gray-500 py-8 italic border border-dashed border-gray-200 dark:border-gray-700 rounded">
                                No transaction logs found in the database.
                            </p>
                        ) : (
                            <div className="space-y-4 w-full min-w-0">
                                {/* Horizontal Slider Selector Buttons */}
                                <div className="w-full flex overflow-x-auto p-1 bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-gray-700 rounded-lg gap-1 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSliderIdx(0)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 whitespace-nowrap border-none cursor-pointer ${
                                            selectedSliderIdx === 0 
                                                ? 'bg-teal-600 text-white shadow-sm' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 bg-transparent'
                                        }`}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? `Starter (${starterPayments.length})` 
                                            : `Starter (${starterFree.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSliderIdx(1)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 whitespace-nowrap border-none cursor-pointer ${
                                            selectedSliderIdx === 1 
                                                ? 'bg-teal-600 text-white shadow-sm' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 bg-transparent'
                                        }`}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? `Professional (${proPayments.length})` 
                                            : `Professional (${proFree.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSliderIdx(2)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 whitespace-nowrap border-none cursor-pointer ${
                                            selectedSliderIdx === 2 
                                                ? 'bg-teal-600 text-white shadow-sm' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 bg-transparent'
                                        }`}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? `Enterprise (${enterprisePayments.length})` 
                                            : `Enterprise (${enterpriseFree.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSliderIdx(3)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-300 whitespace-nowrap border-none cursor-pointer ${
                                            selectedSliderIdx === 3 
                                                ? 'bg-teal-600 text-white shadow-sm' 
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 bg-transparent'
                                        }`}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? `Forum Premium (${forumPayments.length})` 
                                            : `Forum Premium (${forumFree.length})`}
                                    </button>
                                </div>

                                {/* Sliding Container Wrapper - Absolute/Relative slider to prevent stretch */}
                                <div className="w-full max-w-full overflow-hidden relative rounded-lg min-w-0 min-h-[150px]">
                                    {/* Slide 1: Starter */}
                                    <div 
                                        className="top-0 left-0 w-full transition-all duration-500 ease-in-out min-w-0" 
                                        style={{ 
                                            transform: `translateX(${(0 - selectedSliderIdx) * 100}%)`,
                                            opacity: selectedSliderIdx === 0 ? 1 : 0,
                                            visibility: selectedSliderIdx === 0 ? 'visible' : 'hidden',
                                            position: selectedSliderIdx === 0 ? 'relative' : 'absolute'
                                        }}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? renderPaymentsTable(starterPayments, 'Starter') 
                                            : renderFreeGrantsTable(starterFree, 'Starter')}
                                    </div>
                                    {/* Slide 2: Professional */}
                                    <div 
                                        className="top-0 left-0 w-full transition-all duration-500 ease-in-out min-w-0" 
                                        style={{ 
                                            transform: `translateX(${(1 - selectedSliderIdx) * 100}%)`,
                                            opacity: selectedSliderIdx === 1 ? 1 : 0,
                                            visibility: selectedSliderIdx === 1 ? 'visible' : 'hidden',
                                            position: selectedSliderIdx === 1 ? 'relative' : 'absolute'
                                        }}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? renderPaymentsTable(proPayments, 'Professional') 
                                            : renderFreeGrantsTable(proFree, 'Professional')}
                                    </div>
                                    {/* Slide 3: Enterprise */}
                                    <div 
                                        className="top-0 left-0 w-full transition-all duration-500 ease-in-out min-w-0" 
                                        style={{ 
                                            transform: `translateX(${(2 - selectedSliderIdx) * 100}%)`,
                                            opacity: selectedSliderIdx === 2 ? 1 : 0,
                                            visibility: selectedSliderIdx === 2 ? 'visible' : 'hidden',
                                            position: selectedSliderIdx === 2 ? 'relative' : 'absolute'
                                        }}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? renderPaymentsTable(enterprisePayments, 'Enterprise') 
                                            : renderFreeGrantsTable(enterpriseFree, 'Enterprise')}
                                    </div>
                                    {/* Slide 4: Forum Premium */}
                                    <div 
                                        className="top-0 left-0 w-full transition-all duration-500 ease-in-out min-w-0" 
                                        style={{ 
                                            transform: `translateX(${(3 - selectedSliderIdx) * 100}%)`,
                                            opacity: selectedSliderIdx === 3 ? 1 : 0,
                                            visibility: selectedSliderIdx === 3 ? 'visible' : 'hidden',
                                            position: selectedSliderIdx === 3 ? 'relative' : 'absolute'
                                        }}
                                    >
                                        {paymentDashboardView === 'paid' 
                                            ? renderPaymentsTable(forumPayments, 'Forum Premium') 
                                            : renderFreeGrantsTable(forumFree, 'Forum Premium')}
                                    </div>
                                </div>

                                {/* Slide Dot Indicators */}
                                <div className="flex justify-center gap-2 mt-4">
                                    <span 
                                        onClick={() => setSelectedSliderIdx(0)} 
                                        className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${selectedSliderIdx === 0 ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                                        title="Starter Plan"
                                    />
                                    <span 
                                        onClick={() => setSelectedSliderIdx(1)} 
                                        className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${selectedSliderIdx === 1 ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                                        title="Professional Plan"
                                    />
                                    <span 
                                        onClick={() => setSelectedSliderIdx(2)} 
                                        className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${selectedSliderIdx === 2 ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                                        title="Enterprise Plan"
                                    />
                                    <span 
                                        onClick={() => setSelectedSliderIdx(3)} 
                                        className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${selectedSliderIdx === 3 ? 'w-6 bg-teal-600' : 'w-2 bg-gray-300 dark:bg-gray-600'}`}
                                        title="Forum Premium Plan"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isEditModalOpen && editingPlan && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Subscription Plan</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdatePlan}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="editPlanName" className="form-label">Plan Name</label>
                                    <input type="text" id="editPlanName" name="name" value={editingPlan.name} onChange={handleEditChange} required className="form-input" />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="editPlanType" className="form-label">Plan Type</label>
                                    <select id="editPlanType" name="planType" value={editingPlan.planType} onChange={handleEditChange} required className="form-select">
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="editPlanMonthlyPrice" className="form-label">Monthly Price (₹)</label>
                                    <input type="number" id="editPlanMonthlyPrice" name="monthlyPrice" value={editingPlan.monthlyPrice} onChange={handleEditChange} required className="form-input" />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="editPlanYearlyPrice" className="form-label">Yearly Price (₹)</label>
                                    <input type="number" id="editPlanYearlyPrice" name="yearlyPrice" value={editingPlan.yearlyPrice} onChange={handleEditChange} required className="form-input" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="editPlanDesc" className="form-label">Description</label>
                                <input type="text" id="editPlanDesc" name="description" value={editingPlan.description} onChange={handleEditChange} required className="form-input" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="editPlanFeatures" className="form-label">Features (one per line)</label>
                                <textarea id="editPlanFeatures" name="featuresRaw" value={editingPlan.featuresRaw} onChange={handleEditChange} required className="form-textarea" rows={4}></textarea>
                            </div>

                            <div className="form-row-checkboxes">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="isPopular" checked={editingPlan.isPopular} onChange={handleEditChange} />
                                    <span>Popular Plan</span>
                                </label>

                                <label className="checkbox-label">
                                    <input type="checkbox" name="isForumPremium" checked={editingPlan.isForumPremium} onChange={handleEditChange} />
                                    <span>Forum Premium Plan</span>
                                </label>

                                <label className="checkbox-label">
                                    <input type="checkbox" name="active" checked={editingPlan.active} onChange={handleEditChange} />
                                    <span>Active (Visible)</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="button-base button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="button-base button-primary">
                                    {isLoading ? 'Updating...' : 'Update Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isGrantsModalOpen && selectedPlanForGrants && (
                <div className="modal-overlay">
                    <div className="modal-content modal-medium">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <Key className="text-teal-500" size={22} /> Manage Grants: {selectedPlanForGrants.name}
                            </h3>
                            <button onClick={() => { setIsGrantsModalOpen(false); setSelectedPlanForGrants(null); }} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleGrantFree} className="grants-form mt-4">
                            <div className="form-group">
                                <label htmlFor="grantUser" className="form-label font-medium">Grant Free Access to User</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        id="grantUser" 
                                        value={freeUserInput} 
                                        onChange={(e) => setFreeUserInput(e.target.value)} 
                                        placeholder="Enter Username/Email or User ID" 
                                        required 
                                        className="form-input flex-1" 
                                    />
                                    <button type="submit" disabled={isLoading} className="button-base button-primary px-5 py-2">
                                        {isLoading ? 'Granting...' : 'Grant'}
                                    </button>
                                </div>
                            </div>
                        </form>
                        
                        <div className="grants-list-section mt-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Currently Granted Users</h4>
                            {selectedPlanForGrants.freeFor && selectedPlanForGrants.freeFor.users && selectedPlanForGrants.freeFor.users.length > 0 ? (
                                <div className="grants-users-list max-h-[40vh] overflow-y-auto border border-gray-150 dark:border-slate-800 rounded-lg divide-y divide-gray-150 dark:divide-slate-800">
                                    {selectedPlanForGrants.freeFor.users.map((u) => (
                                        <div key={typeof u === 'string' ? u : u._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50">
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                    {u.username || 'User'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {u.email || (typeof u === 'string' ? u : u._id)}
                                                </span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRevokeFree(typeof u === 'string' ? u : u._id)} 
                                                className="button-base button-danger flex items-center gap-1 text-xs py-1 px-3"
                                            >
                                                <UserMinus size={14} /> Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4 bg-gray-50 dark:bg-slate-900/50 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                                    No users have free access grants for this plan yet.
                                </p>
                            )}
                        </div>
                        
                        <div className="modal-actions mt-6">
                            <button type="button" onClick={() => { setIsGrantsModalOpen(false); setSelectedPlanForGrants(null); }} className="button-base button-cancel w-full">
                                Close
                             </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal show={isDeleting} title="Confirm Deletion" message="Are you sure you want to delete this subscription plan? This will remove it from the platform database." onConfirm={handleDeletePlan} onCancel={() => setIsDeleting(false)} />

            {isEditPaymentModalOpen && editingPayment && (
                <div className="modal-overlay">
                    <div className="modal-content modal-medium">
                        <div className="modal-header">
                            <h3 className="modal-title flex items-center gap-2">
                                <CreditCard className="text-teal-500" size={22} /> Edit Payment Record
                            </h3>
                            <button onClick={() => { setIsEditPaymentModalOpen(false); setEditingPayment(null); }} className="modal-close-button">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdatePayment} className="form-container mt-4">
                            <div className="form-group">
                                <label className="form-label font-medium">User</label>
                                <input 
                                    type="text" 
                                    disabled 
                                    value={`${editingPayment.userId?.username || 'Unknown'} (${editingPayment.userId?.email || 'N/A'})`}
                                    className="form-input bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed" 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label font-medium">Plan</label>
                                <input 
                                    type="text" 
                                    disabled 
                                    value={editingPayment.planId?.name || (editingPayment.amount === 999 ? 'Forum Premium' : 'Premium Plan')}
                                    className="form-input bg-gray-100 dark:bg-slate-700/50 cursor-not-allowed" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label htmlFor="editPaymentAmount" className="form-label font-medium">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        id="editPaymentAmount" 
                                        value={editingPayment.amount} 
                                        onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })} 
                                        required 
                                        className="form-input" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editPaymentPeriod" className="form-label font-medium">Period</label>
                                    <select 
                                        id="editPaymentPeriod" 
                                        value={editingPayment.billingPeriod} 
                                        onChange={(e) => setEditingPayment({ ...editingPayment, billingPeriod: e.target.value })} 
                                        required 
                                        className="form-select"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label htmlFor="editPaymentStatus" className="form-label font-medium">Status</label>
                                    <select 
                                        id="editPaymentStatus" 
                                        value={editingPayment.status} 
                                        onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value })} 
                                        required 
                                        className="form-select"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="editPaymentEndDate" className="form-label font-medium">End Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        id="editPaymentEndDate" 
                                        value={formatForDateTimeLocal(editingPayment.endDate)} 
                                        onChange={(e) => setEditingPayment({ ...editingPayment, endDate: e.target.value })} 
                                        className="form-input"
                                        disabled={editingPayment.status !== 'paid'}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions mt-6">
                                <button type="button" onClick={() => { setIsEditPaymentModalOpen(false); setEditingPayment(null); }} className="button-base button-cancel">Cancel</button>
                                <button type="submit" disabled={isLoading} className="button-base button-primary">
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                show={isDeletingPayment} 
                title="Delete Payment Record" 
                message="Are you sure you want to delete this payment record? This action is permanent and cannot be undone." 
                onConfirm={handleDeletePayment} 
                onCancel={() => setIsDeletingPayment(false)} 
            />

            <ConfirmationModal 
                show={!!grantToRevoke} 
                title="Revoke Free Access" 
                message={`Are you sure you want to revoke free premium access for ${grantToRevoke?.username}?`} 
                onConfirm={() => {
                    handleRevokeFree(grantToRevoke.userId, grantToRevoke.planId);
                    setGrantToRevoke(null);
                }} 
                onCancel={() => setGrantToRevoke(null)} 
            />
        </div>
    );
};

export default SubscriptionManagement;
