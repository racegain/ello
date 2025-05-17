import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, error, clearError, isLoading } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (isRegister) {
      const success = await register(username, password);
      if (success) {
        setIsRegister(false);
      }
    } else {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      }
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    clearError();
  };

  return (
    <div className="card max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">
        {isRegister ? 'Регистрация' : 'Вход в систему'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Имя пользователя
          </label>
          <input
            id="username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary hover:underline"
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : 'Создать новый аккаунт'}
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Загрузка...
              </span>
            ) : (
              isRegister ? 'Зарегистрироваться' : 'Войти'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
