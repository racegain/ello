import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';
import RoomPage from './pages/RoomPage';
import AdminPage from './pages/AdminPage';
import useStore from './store/useStore';
import './App.css';

const App = () => {
  const { isAuthenticated, user, checkAuth, isCheckingAuth } = useStore();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // PWA installation
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      // Show our custom install prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    });
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User declined the PWA installation');
      }
      // Clear the saved prompt since it can't be used again
      setInstallPrompt(null);
      setShowPrompt(false);
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen">
        <div className="m-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/room" 
              element={isAuthenticated ? <RoomPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin" 
              element={
                isAuthenticated && user?.role === 'admin' 
                  ? <AdminPage /> 
                  : <Navigate to="/login" />
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        {showPrompt && (
          <div className="pwa-prompt">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Установить приложение</h3>
              <button 
                onClick={() => setShowPrompt(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-600">
              Установите это приложение на ваше устройство для более удобного доступа без браузера.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Установить
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm"
              >
                Позже
              </button>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
