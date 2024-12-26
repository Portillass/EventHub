import React, { useState, useEffect } from 'react';
import '../styles/Loading.css';
import logo from '../assets/logo.png';

const Loading = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    'Loading resources...',
    'Preparing application...',
    'Almost there...',
    'Getting things ready...'
  ];

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2000);

    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressTimer);
          handleComplete();
          return 100;
        }
        return prevProgress + 1;
      });
    }, 30);

    return () => {
      clearInterval(messageTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const handleComplete = () => {
    setShowContent(false);
    setTimeout(() => {
      onLoadingComplete();
    }, 1000);
  };

  return (
    <div className={`loading-container ${!showContent ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="logo-container">
          <div className="logo-glow"></div>
          <img src={logo} alt="Logo" className="logo" />
          <h1 className="title">EventHub</h1>
        </div>
        <div className="loading-info">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="loading-text">
            <h2>{messages[messageIndex]}</h2>
            <div className="progress-text">
              <span className="percentage">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;