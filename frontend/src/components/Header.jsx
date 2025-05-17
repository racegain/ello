import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Header = () => {
  const { isAuthenticated, isAdmin, user, logout, isOffline } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      {isOffline && (
        <div className="offline-banner">
          You are currently offline. Some features may be limited.
        </div>
      )}
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-primary">
            Hotel Management
          </Link>
        </div>
        
        <nav className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-primary">
            Бронирование
          </Link>
          
          {isAuthenticated && (
            <Link to="/room" className="text-gray-700 hover:text-primary">
              Моя комната
            </Link>
          )}
          
          {isAdmin && (
            <Link to="/admin" className="text-gray-700 hover:text-primary">
              Админ
            </Link>
          )}
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.username}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-primary"
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-gray-700 hover:text-primary">
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
