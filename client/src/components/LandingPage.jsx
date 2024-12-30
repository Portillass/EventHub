import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendar, FaUsers, FaChartBar } from 'react-icons/fa';
import '../styles/LandingPage.css';
import logo from '../assets/logo.png';
import LoginModal from './Modal/LoginModal';
import SignupModal from './Modal/SignupModal';
import ForgotPasswordModal from './Modal/ForgotPasswordModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:2025/api/auth/current-user', {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setIsAuthenticated(true);
          if (data.user.status === 'pending') {
            navigate('/pending');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [navigate]);

  const openLoginModal = () => {
    setIsLoginOpen(true);
    setIsSignupOpen(false);
    setIsForgotPasswordOpen(false);
  };

  const openSignupModal = () => {
    setIsSignupOpen(true);
    setIsLoginOpen(false);
    setIsForgotPasswordOpen(false);
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordOpen(true);
    setIsLoginOpen(false);
    setIsSignupOpen(false);
  };

  const closeAllModals = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(false);
    setIsForgotPasswordOpen(false);
  };

  const handleLoginSuccess = () => {
    closeAllModals();
    window.location.reload();
  };

  const handleSignupSuccess = () => {
    closeAllModals();
    window.location.reload();
  };

  if (isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: <FaCalendar />,
      title: "Event Management",
      description: "Create and manage events effortlessly. Set up registrations, track attendance, and send notifications."
    },
    {
      icon: <FaUsers />,
      title: "Attendance Tracking",
      description: "Monitor attendance in real-time. Generate QR codes, scan tickets, and manage check-ins efficiently."
    },
    {
      icon: <FaChartBar />,
      title: "Analytics & Reports",
      description: "Get comprehensive insights with detailed analytics and customizable reports for your events."
    }
  ];

  return (
    <div className="landing-page">
      <header className="header">
        <div className="header-content">
          <h1>EventHub</h1>
          <div className="auth-buttons">
            <button className="login-btn" onClick={openLoginModal}>Login</button>
            <button className="signup-btn" onClick={openSignupModal}>Sign Up</button>
          </div>
        </div>
      </header>

      <main>
        <figure className="hero">
          <div className="hero-content">
            <h1>EventHub</h1>
            <p className="subtitle">Your Complete Event Management Solution</p>
            <p className="description">
              Streamline your event planning process with our comprehensive platform.
              From registration to analytics, we've got you covered.
            </p>
            <button className="get-started-btn" onClick={openSignupModal}>Get Started</button>
          </div>
          <div className="hero-right">
            <img src={logo} alt="EventHub Logo" className="hero-logo" />
          </div>
        </figure>

        <section className="features">
          <h2>Our Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ '--card-index': index }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Developed By: Rell</p>
      </footer>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={closeAllModals}
        onSwitchToSignup={openSignupModal}
        onForgotPassword={openForgotPasswordModal}
        onLoginSuccess={handleLoginSuccess}
      />
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={closeAllModals}
        onSwitchToLogin={openLoginModal}
        onSignupSuccess={handleSignupSuccess}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={closeAllModals}
        onSwitchToLogin={openLoginModal}
      />
    </div>
  );
};

export default LandingPage;
