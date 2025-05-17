import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Header = () => {
  const { isAuthenticated, isAdmin, user, logout, isOffline } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold flex items-center">
            <span>Управление Отелем</span>
            {isOffline && (
              <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                Офлайн
              </span>
            )}
          </Link>
          
          <nav className="flex items-center">
            {isAuthenticated ? (
              <>
                <Link to="/room" className="mr-4 hover:text-blue-200">
                  Моя комната
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="mr-4 hover:text-blue-200">
                    Админ панель
                  </Link>
                )}
                <div className="flex items-center">
                  <span className="mr-2">{user?.username}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-white hover:bg-blue-100 text-blue-600 px-3 py-1 rounded"
              >
                Войти
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
