import React from 'react';
import { FaCalendar, FaUsers, FaChartBar } from 'react-icons/fa';
import '../styles/LandingPage.css';
import logo from '../assets/logo.png';

const LandingPage = () => {
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
            <button className="login-btn">Login</button>
            <button className="signup-btn">Sign Up</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>EventHub</h1>
            <p className="subtitle">Your Complete Event Management Solution</p>
            <p className="description">
              Streamline your event planning process with our comprehensive platform.
              From registration to analytics, we've got you covered.
            </p>
            <button className="get-started-btn">Get Started</button>
          </div>
          <div className="hero-right">
            <img src={logo} alt="EventHub Logo" className="hero-logo" />
          </div>
        </section>

        <section className="features">
          <h2>Our Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
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
    </div>
  );
};

export default LandingPage;
