import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <LoginForm />
        <div className="forgot-password-link">
          <Link to="/forgot-password"></Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
