import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PendingPage.css';
import logo from '../assets/logo.png';

const PendingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pending-page">
      <div className="pending-content">
        <img src={logo} alt="EventHub Logo" className="pending-logo" />
        <h1>Account Pending Approval</h1>
        <div className="pending-message">
          <p>Thank you for registering with EventHub!</p>
          <p>Your account is currently pending administrator approval.</p>
          <p>Once approved, you'll receive an email notification and can start using the platform.</p>
        </div>
        <div className="pending-info">
          <h2>What happens next?</h2>
          <ul>
            <li>An administrator will review your account details</li>
            <li>They will verify your student/officer status</li>
            <li>You'll receive an email when your account is approved</li>
            <li>You can then log in and access your dashboard</li>
          </ul>
        </div>
        <button className="back-home" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default PendingPage;
