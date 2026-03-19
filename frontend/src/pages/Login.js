import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      
      if (data.otpRequired) {
        toast.info('Verification code sent to your email');
        setShowOtpInput(true);
      } else {
        login(data.user, data.token);
        toast.success('Login successful!');
        navigate('/products');
      }
    } catch (err) {
      // Handle lockout error specifically
      const errorMessage = err.response?.data?.message || 'Login failed';
      if (errorMessage.includes('Account locked')) {
        toast.error(errorMessage); // Shows "Account locked due to too many failed attempts. Try again in 59 minutes."
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5001/api/auth/verify-otp', { email, otp });
      login(data.user, data.token);
      toast.success('Login successful!');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Login</h2>

      {!showOtpInput ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />

          {/* Password field with eye toggle */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: '18px',
                userSelect: 'none',
              }}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>

          <button type="submit" style={{ padding: '10px 20px' }}>Login</button>
          <p style={{ marginTop: '10px' }}>
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <h3>Enter Verification Code</h3>
          <p>Check your email ({email}) for the code</p>
          <input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>Verify & Login</button>
        </form>
      )}

      <ToastContainer position="top-center" autoClose={5000} />
    </div>
  );
};

export default Login;