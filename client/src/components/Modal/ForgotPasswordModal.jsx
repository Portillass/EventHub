import React, { useState } from 'react';
import '../../styles/Modal.css';
import { FaTimes, FaEnvelope } from 'react-icons/fa';

const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add password reset logic here
    console.log('Reset password for:', email);
    setIsSubmitted(true);
  };

  const handleBackToLogin = (e) => {
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
        
        {!isSubmitted ? (
          <>
            <h2>Reset Password</h2>
            <p className="modal-subtitle">Enter your email to reset your password</p>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <div className="input-icon">
                  <FaEnvelope />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <button type="submit" className="submit-button">
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="success-message">
            <h2>Check Your Email</h2>
            <p className="modal-subtitle">
              We've sent a password reset link to:<br />
              <strong>{email}</strong>
            </p>
            <p className="reset-instructions">
              Please check your email and follow the instructions to reset your password.
              If you don't see the email, check your spam folder.
            </p>
            <button className="submit-button" onClick={handleBackToLogin}>
              Back to Login
            </button>
          </div>
        )}
        
        <p className="modal-footer">
          Remember your password? <a href="#" className="switch-modal" onClick={handleBackToLogin}>Sign In</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
