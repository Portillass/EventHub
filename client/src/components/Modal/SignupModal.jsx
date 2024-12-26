import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import '../../styles/Modal.css';
import { FaTimes, FaUser, FaEnvelope, FaLock, FaGoogle, FaIdCard, FaGraduationCap, FaLayerGroup } from 'react-icons/fa';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    course: '',
    yearLevel: ''
  });
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:2025/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'pending',
          recaptchaToken
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }

      onClose();
      navigate('/pending');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:2025/api/auth/google';
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
        
        {error && <div className="error-message">{error}</div>}
        
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
              <FaIdCard />
              <input
                type="text"
                name="studentId"
                placeholder="Student ID"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaGraduationCap />
              <input
                type="text"
                name="course"
                placeholder="Course"
                value={formData.course}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaLayerGroup />
              <select
                name="yearLevel"
                value={formData.yearLevel}
                onChange={handleChange}
                required
                className="year-select"
              >
                <option value="">Select Year Level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
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
          
          <div className="recaptcha-container">
            <ReCAPTCHA
              sitekey="6Ld7HqMqAAAAAOOpDJ02_2nrAFr_2MSxT-GIeypE"
              onChange={handleRecaptchaChange}
              theme="dark"
            />
          </div>
          
          <button type="submit" className="submit-button">
            Create Account
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="google-signin-button"
            onClick={handleGoogleSignup}
          >
            <FaGoogle /> Sign up with Google
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
