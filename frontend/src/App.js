import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header';

// Pages
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RoomPage from './pages/RoomPage';
import AdminPage from './pages/AdminPage';

// State management
import useStore from './store/useStore';

const App = () => {
  const { isAuthenticated, isAdmin, init, isOffline } = useStore();
  
  // Initialize app state from localStorage if available
  useEffect(() => {
    init();
  }, [init]);
  
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/room" 
              element={isAuthenticated ? <RoomPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin" 
              element={(isAuthenticated && isAdmin) ? <AdminPage /> : <Navigate to="/" />} 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        {/* PWA install prompt (shown only when app can be installed and is not in standalone mode) */}
        {!isOffline && !window.matchMedia('(display-mode: standalone)').matches && (
          <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 md:max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Установить приложение</h3>
                <p className="text-sm text-gray-500">Добавьте это приложение на главный экран для быстрого доступа</p>
              </div>
              <button className="btn btn-primary">Установить</button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
