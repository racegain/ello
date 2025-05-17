import React from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Вход в систему</h1>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
