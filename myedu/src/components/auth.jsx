// src/components/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './AuthPage.css';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useModal } from '../contexts/ModalContext'; // Import useModal

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const MessageBox = ({ type, text }) => {
    if (!text) return null;
    let Icon;
    let classes = 'message-box ';
    switch (type) {
        case 'info': Icon = Info; classes += 'info'; break;
        case 'success': Icon = CheckCircle; classes += 'success'; break;
        case 'error': Icon = AlertCircle; classes += 'error'; break;
        default: Icon = Info; classes += 'info';
    }
    return (
        <div className={classes}>
            {Icon && <Icon size={20} />}
            {text}
        </div>
    );
};

const AuthPage = () => {
    const { login } = useAuth();
    const { openModal } = useModal();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginAs, setLoginAs] = useState('user');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: `Login successful! Redirecting as ${loginAs}...` });
                login(data.token, data.user);
            } else {
                setMessage({ type: 'error', text: data.msg || 'Login failed. Please check your credentials.' });
            }
        } catch (error) {
            console.error('Login API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable. Please try again later.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Signup successful! Please log in.' });
                setIsLoginMode(true);
                setUsername('');
                setEmail('');
                setPassword('');
                openModal('Signup Success', 'Your account has been created. Please log in.');
            } else {
                setMessage({ type: 'error', text: data.msg || 'Signup failed. User might already exist or invalid data.' });
            }
        } catch (error) {
            console.error('Signup API error:', error);
            setMessage({ type: 'error', text: 'Network error or server unavailable. Please try again later.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <h2 className="auth-title">
                    {isLoginMode ? <LogIn size={28} /> : <UserPlus size={28} />}
                    {isLoginMode ? 'Login' : 'Sign Up'}
                </h2>
                <MessageBox type={message.type} text={message.text} />

                {isLoginMode ? (
                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group">
                            <label htmlFor="loginEmail">Email</label>
                            <input
                                type="email"
                                id="loginEmail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loginPassword">Password</label>
                            <input
                                type="password"
                                id="loginPassword"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="loginAs">Login As</label>
                            <select
                                id="loginAs"
                                value={loginAs}
                                onChange={(e) => setLoginAs(e.target.value)}
                                className="form-select"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="auth-button primary" disabled={isLoading}>
                            {isLoading ? 'Logging In...' : <><LogIn size={20} /> Login</>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSignupSubmit}>
                        <div className="form-group">
                            <label htmlFor="signupUsername">Username</label>
                            <input
                                type="text"
                                id="signupUsername"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="signupEmail">Email</label>
                            <input
                                type="email"
                                id="signupEmail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="signupPassword">Password</label>
                            <input
                                type="password"
                                id="signupPassword"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <button type="submit" className="auth-button primary" disabled={isLoading}>
                            {isLoading ? 'Signing Up...' : <><UserPlus size={20} /> Sign Up</>}
                        </button>
                    </form>
                )}
                <p className="auth-switch-link" onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setMessage({ type: '', text: '' });
                }}>
                    {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
