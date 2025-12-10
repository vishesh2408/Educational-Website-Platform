


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
const [email, setEmail] = useState('');
const [otp, setOtp] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [message, setMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
const navigate = useNavigate();

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const handleReset = async (e) => {
e.preventDefault();
setMessage('');

if (newPassword !== confirmPassword) {
  setMessage("Passwords do not match!");
  return;
}

setIsLoading(true);
try {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ✅ needed for HttpOnly cookie
    body: JSON.stringify({ email, otp, newPassword }),
  });

  const data = await res.json();

  if (res.ok) {
    setMessage(data.message || 'Password reset successfully!');
    setTimeout(() => navigate('/auth'), 1500); // Redirect to login page
  } else {
    setMessage(data.message || 'Failed to reset password. Please try again.');
  }
} catch (err) {
  console.error(err);
  setMessage('Network error. Please try again later.');
} finally {
  setIsLoading(false);
}
};

return (
<div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
<div className="bg-white shadow-lg rounded-xl p-6 w-96">
<h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
Reset Password
</h2>
<form onSubmit={handleReset} className="space-y-4">
<input
type="email"
placeholder="Enter your email"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
<input
type="text"
placeholder="Enter OTP"
value={otp}
onChange={(e) => setOtp(e.target.value)}
required
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
<input
type="password"
placeholder="New Password"
value={newPassword}
onChange={(e) => setNewPassword(e.target.value)}
required
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
<input
type="password"
placeholder="Confirm Password"
value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
required
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
<button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60" >
{isLoading ? 'Resetting...' : 'Reset Password'}
</button>
</form>
{message && (
<p className="mt-3 text-center text-sm text-gray-700">{message}</p>
)}
</div>
</div>
);
}