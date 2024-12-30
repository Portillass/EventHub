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

  return (
    <div className="pending-status">
      <div className="pending-content">
        <h1>Account Pending Approval</h1>
        <div className="status-message">
          <p>Your account is currently pending approval from the administrator.</p>
          <p>You will receive an email notification once your account has been approved.</p>
          <p>Please check your email regularly for updates.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default PendingUsers; 