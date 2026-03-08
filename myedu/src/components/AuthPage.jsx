


import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn, AlertCircle, CheckCircle, Info, Sun, Moon, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import LearnBentIcon from '../contexts/LearnBentIcon';

// --- API BASE ---
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// --- IMAGE SLIDES ---
const slides = [
  { src: 'images/auth1.png', alt: 'Learning student' },
  { src: 'images/auth2.png', alt: 'Collaborative team' },
  { src: 'images/auth3.png', alt: 'Knowledge network' },
  { src: 'images/auth4.png', alt: 'Graduation success' },
];

// --- MESSAGE BOX COMPONENT ---
const MessageBox = ({ type, text }) => {
  if (!text) return null;
  let Icon, classes = 'p-3 rounded-xl flex items-start gap-3 w-full text-sm font-medium shadow-md animate-in fade-in zoom-in duration-300 ';
  switch (type) {
    case 'info': Icon = Info; classes += 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'; break;
    case 'success': Icon = CheckCircle; classes += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'; break;
    case 'error': Icon = AlertCircle; classes += 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'; break;
    default: Icon = Info; classes += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
  return (
    <div className={classes} role="alert">
      <Icon size={20} className="mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

const AuthPage = () => {
  const { login } = useAuth();
  const { openModal } = useModal();
  const { theme, toggleTheme } = useTheme();

  const [view, setView] = useState('login'); // login | signup | forgot | otp | reset
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginAs, setLoginAs] = useState('user');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- Effects ---
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const slideTimer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(slideTimer);
  }, []);

  // --- LOGIN HANDLER ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (res.status === 429) {
        const txt = await res.text();
        setMessage({ type: 'error', text: txt || 'Too many attempts. Please wait.' });
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Login successful! Redirecting as ${loginAs}...` });
        login(data.user);
      } else {
        const msg = data.errors ? data.errors.map(e => e.msg).join('. ') : data.msg || 'Login failed.';
        setMessage({ type: 'error', text: msg });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally { setIsLoading(false); }
  };

  // --- SIGNUP HANDLER ---
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Signup successful! Please log in.' });
        setUsername(''); setEmail(''); setPassword('');
        openModal('Signup Success', 'Your account has been created. Please log in.');
        setView('login');
      } else {
        const msg = data.errors ? data.errors.map(e => e.msg).join('. ') : data.msg || 'Signup failed.';
        setMessage({ type: 'error', text: msg });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally { setIsLoading(false); }
  };

  // --- GOOGLE AUTH HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Google login successful!' });
        login(data.user);
      } else {
        setMessage({ type: 'error', text: data.msg || 'Google login failed.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Google network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage({ type: 'error', text: 'Google authentication failed.' });
  };

  // --- FORGOT PASSWORD (Send OTP) ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      if (!email) {
        setMessage({ type: 'error', text: 'Please enter your email.' });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // Show success message immediately
        setMessage({ type: 'success', text: data.message || 'OTP sent successfully!' });

        // Disable the button to prevent multiple OTP requests
        setIsLoading(true);

        // Switch view safely after a short delay
        setTimeout(() => {
          setView('otp');
          setOtp('');         // reset OTP input
          setIsLoading(false); // re-enable button for OTP submission
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send OTP.' });
      }

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network error. Please try again later.' });
    } finally { setIsLoading(false); }
  };

  // --- VERIFY OTP AND RESET PASSWORD ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Password reset successful!' });
        setTimeout(() => setView('login'), 1500);
        setOtp(''); setNewPassword(''); setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally { setIsLoading(false); }
  };

  // --- COMMON CLASSES ---
  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-color-primary focus:border-color-primary transition duration-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 text-base font-normal";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const buttonClasses = "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-lg transition duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01]";

  // --- FORM RENDER ---
  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className={labelClasses}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
              <p className="text-sm text-right mt-2">
                <button type="button" onClick={() => setView('forgot')} className="text-blue-600 hover:underline">Forgot Password?</button>
              </p>
            </div>
            <div>
              <label className={labelClasses}>Login As</label>
              <select value={loginAs} onChange={e => setLoginAs(e.target.value)} className={inputClasses}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-color-primary text-white hover:bg-color-primary-dark`}>
              {isLoading ? 'Logging In...' : <><LogIn size={20} /> Login</>}
            </button>
            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              <span className="text-gray-400 text-sm">Or continue with</span>
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme={theme === 'dark' ? 'filled_black' : 'outline'}
                shape="pill"
                size="large"
                text="signin_with"
                width="100%"
              />
            </div>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className={labelClasses}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} />
            </div>
            <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-color-primary text-white hover:bg-color-primary-dark`}>
              {isLoading ? 'Signing Up...' : <><UserPlus size={20} /> Sign Up</>}
            </button>
            <div className="flex items-center gap-4 my-2">
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
              <span className="text-gray-400 text-sm">Or continue with</span>
              <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            </div>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme={theme === 'dark' ? 'filled_black' : 'outline'}
                shape="pill"
                size="large"
                text="signup_with"
                width="100%"
              />
            </div>
          </form>
        );

      case 'forgot':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className={labelClasses}>Enter your email to receive OTP</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} />
            </div>
            <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-color-primary text-white`}>
              {isLoading ? 'Sending...' : <><Mail size={20} /> Send OTP</>}
            </button>
            <p className="text-sm text-center mt-2">
              <button type="button" onClick={() => setView('login')} className="text-blue-600 hover:underline">Back to Login</button>
            </p>
          </form>
        );

      case 'otp':
      case 'reset':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={labelClasses}>Enter OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClasses} />
            </div>
            <button type="submit" disabled={isLoading} className={`${buttonClasses} bg-color-primary text-white`}>
              {isLoading ? 'Resetting...' : <><Lock size={20} /> Reset Password</>}
            </button>
            <p className="text-sm text-center mt-2">
              <button type="button" onClick={() => setView('login')} className="text-blue-600 hover:underline">Back to Login</button>
            </p>
          </form>
        );
      default:
        return null;
    }
  };

  // --- MAIN RETURN ---
  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex items-center justify-center p-4 font-sans">
      <div className="relative flex w-full max-w-5xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* LEFT SLIDES */}
        <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden">
          {slides.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={s.src} alt={s.alt} className="w-full h-full object-cover" style={{ filter: 'brightness(60%)' }} />
            </div>
          ))}
        </div>

        {/* RIGHT AUTH */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8">
          <div className="text-right mb-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200">
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center mb-4">
            <LearnBentIcon size={48} className="mb-2 drop-shadow-xl" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              {view === 'signup' ? <UserPlus size={32} className="text-color-primary" /> :
                view === 'forgot' || view === 'otp' ? <Mail size={32} className="text-color-primary" /> :
                  <LogIn size={32} className="text-color-primary" />}
              {view === 'signup' ? 'Create Account' :
                view === 'forgot' ? 'Forgot Password' :
                  view === 'otp' ? 'Reset Password' :
                    'Sign In'}
            </h2>
          </div>

          <div className="mb-6 min-h-12">
            <MessageBox type={message.type} text={message.text} />
          </div>

          {renderForm()}

          {(view === 'login' || view === 'signup') && (
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              {view === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setMessage({ type: '', text: '' }); }}
                className="ml-2 text-color-primary font-bold hover:text-color-primary-dark transition duration-200 focus:outline-none"
              >
                {view === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
