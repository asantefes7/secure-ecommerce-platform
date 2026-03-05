import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
      toast.info('Reset code sent to your email');
      setShowOtpForm(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/verify-reset-otp', { email, otp });
      toast.success('Code verified! Set new password');
      setShowOtpForm(false);
      setShowResetForm(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successful! Login with new password');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Forgot Password</h2>

      {!showOtpForm && !showResetForm ? (
        <form onSubmit={handleForgot}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>Send Reset Code</button>
        </form>
      ) : showOtpForm ? (
        <form onSubmit={handleVerifyOtp}>
          <h3>Enter Reset Code</h3>
          <p>Check your email for the code</p>
          <input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>Verify Code</button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <h3>Set New Password</h3>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>Reset Password</button>
        </form>
      )}

      <ToastContainer />
    </div>
  );
};

export default ForgotPassword;