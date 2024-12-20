import React, { useState } from 'react';
import '../../styles/Modal.css';
import { FaTimes, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add signup logic here
    console.log('Signup data:', formData);
  };

  const handleSwitch = (e) => {
    e.preventDefault();
    onClose();
    onSwitchToLogin();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>Create Account</h2>
        <p className="modal-subtitle">Join EventHub today</p>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
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
          
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-options">
            <label className="terms">
              <input type="checkbox" required /> I agree to the Terms & Conditions
            </label>
          </div>
          
          <button type="submit" className="submit-button">
            Create Account
          </button>
        </form>
        
        <p className="modal-footer">
          Already have an account? <a href="#" className="switch-modal" onClick={handleSwitch}>Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default SignupModal;
