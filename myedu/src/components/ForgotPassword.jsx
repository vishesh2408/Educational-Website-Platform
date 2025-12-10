

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
const [email, setEmail] = useState('');
const [message, setMessage] = useState('');
const navigate = useNavigate();

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

const sendOtp = async (e) => {
e.preventDefault();
try {
const res = await fetch(`${API_BASE_URL}/auth/forgot-password-otp`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
credentials: 'include', // ✅ needed for HttpOnly cookie
body: JSON.stringify({ email }),
});


  const data = await res.json();

  if (res.ok) {
    setMessage(data.message || 'OTP sent successfully!');
    // ✅ Redirect to reset password after 1s
    setTimeout(() => navigate('/reset-password'), 1000);
  } else {
    setMessage(data.message || 'Failed to send OTP. Please try again.');
  }
} catch (err) {
  console.error(err);
  setMessage('An error occurred. Please try again later.');
}
};

return (
<div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
<div className="bg-white shadow-lg rounded-xl p-6 w-96">
<h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
Forgot Password
</h2>
<form onSubmit={sendOtp} className="space-y-4">
<input
type="email"
placeholder="Enter your email"
value={email}
onChange={(e) => setEmail(e.target.value)}
required
className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
<button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition" >
Send OTP
</button>
</form>
{message && (
<p className="mt-3 text-center text-sm text-gray-700">{message}</p>
)}
</div>
</div>
);
}