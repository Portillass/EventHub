import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import '../../styles/Modal.css';
import { FaTimes, FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setError(''); // Clear error when recaptcha is completed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:2025/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      onClose();
      window.location.reload(); // Reload to update auth state
    } catch (error) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = 'http://localhost:2025/api/auth/google';
    } catch (error) {
      setError('Failed to initiate Google login');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    onClose();
    onForgotPassword();
  };

  const handleSwitch = (e) => {
    e.preventDefault();
    onClose();
    onSwitchToSignup();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>Welcome Back!</h2>
        <p className="modal-subtitle">Sign in to continue to EventHub</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password" onClick={handleForgotPassword}>
              Forgot Password?
            </a>
          </div>
          
          <div className="recaptcha-container">
            <ReCAPTCHA
              sitekey="6Ld7HqMqAAAAAOOpDJ02_2nrAFr_2MSxT-GIeypE"
              onChange={handleRecaptchaChange}
              theme="dark"
            />
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="google-signin-button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FaGoogle /> Sign in with Google
          </button>
        </form>
        
        <p className="modal-footer">
          Don't have an account? <a href="#" className="switch-modal" onClick={handleSwitch}>Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
