import { useNavigate } from 'react-router-dom';
import '../../../styles/PendingUsers.css';

const PendingUsers = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:2025/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="pending-container">
      <div className="pending-content">
        <h1>Account Under Review</h1>
        <div className="pending-message">
          <p>Your account is currently pending approval from the administrator.</p>
          <p>Once approved, you will be able to access your dashboard.</p>
          <p>Please check back later or contact support if you have any questions.</p>
        </div>
        <div className="button-group">
          <button onClick={handleBack} className="back-button">
            Back to Landing Page
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingUsers; 