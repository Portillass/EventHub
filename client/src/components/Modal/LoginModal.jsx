import React, { useState } from 'react';
import '../../styles/Modal.css';
import { FaTimes, FaEnvelope, FaLock } from 'react-icons/fa';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log('Login data:', formData);
  };

  const handleSwitch = (e) => {
    e.preventDefault();
    onClose();
    onSwitchToSignup();
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    onClose();
    onForgotPassword();
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
          
          <button type="submit" className="submit-button">
            Sign In
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
