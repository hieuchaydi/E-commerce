import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import './Login.css';

const Register = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;