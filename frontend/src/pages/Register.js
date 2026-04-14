import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Local backend URL (for development)
  const API_BASE = 'http://localhost:5001';

  const validatePassword = (pwd) => {
    const lengthOk = pwd.length >= 8 && pwd.length <= 16;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return lengthOk && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (!validatePassword(password)) {
      return toast.error(
        'Password must be 8–16 characters and include uppercase, lowercase, number, and special character'
      );
    }

    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/register`, {
        name,
        email,
        password,
      });

      login(data.user, data.token);
      toast.success('Registration successful! Logging you in...');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Register</h2>
      <form onSubmit={submitHandler}>
        <input
          type="text"
          placeholder="Full Name (real name)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
        />
        <input
          type="email"
          placeholder="Real Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
        />

        {/* Password with eye icon */}
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (8–16 chars, upper, lower, number, special)"
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
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>

        {/* Confirm Password with eye icon */}
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ display: 'block', margin: '10px 0', padding: '10px', width: '100%' }}
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>

        <button type="submit" style={{ padding: '10px 20px' }}>Register</button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default Register;