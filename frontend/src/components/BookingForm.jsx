import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const BookingForm = () => {
  const { user, rooms, createBooking, fetchRooms, isLoading, error, clearError } = useStore();
  const navigate = useNavigate();
  
  const [guestName, setGuestName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [success, setSuccess] = useState(false);

  // Get available rooms for booking
  const availableRooms = rooms.filter(room => room.status === 'available');

  useEffect(() => {
    fetchRooms();
    // Set guest name from user if logged in
    if (user) {
      setGuestName(user.username);
    }
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    setCheckInDate(formatDate(today));
    setCheckOutDate(formatDate(tomorrow));
  }, [fetchRooms, user]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!selectedRoomId) {
      alert('Пожалуйста, выберите номер');
      return;
    }
    
    const booking = await createBooking(
      selectedRoomId,
      guestName,
      checkInDate,
      checkOutDate
    );
    
    if (booking) {
      setSuccess(true);
      // Reset form
      setGuestName(user ? user.username : '');
      setSelectedRoomId('');
      
      // Navigate to room page if authenticated
      if (user) {
        setTimeout(() => {
          navigate('/room');
        }, 2000);
      }
    }
  };

  if (success) {
    return (
      <div className="card max-w-md mx-auto mt-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Бронирование успешно!</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ваша комната забронирована. {user ? 'Переход на страницу комнаты...' : 'Войдите в систему, чтобы управлять вашей комнатой.'}
          </p>
          {!user && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Войти в систему
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Забронировать номер</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="guestName" className="form-label">
            Имя гостя
          </label>
          <input
            id="guestName"
            type="text"
            className="form-input"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="checkInDate" className="form-label">
            Дата заезда
          </label>
          <input
            id="checkInDate"
            type="date"
            className="form-input"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            min={formatDate(new Date())}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="checkOutDate" className="form-label">
            Дата выезда
          </label>
          <input
            id="checkOutDate"
            type="date"
            className="form-input"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            min={checkInDate}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="roomSelect" className="form-label">
            Выбор номера
          </label>
          <select
            id="roomSelect"
            className="form-input"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            required
          >
            <option value="">Выберите номер</option>
            {availableRooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.number}
              </option>
            ))}
          </select>
          
          {availableRooms.length === 0 && (
            <p className="text-sm text-red-500 mt-1">
              Нет доступных номеров для бронирования
            </p>
          )}
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading || availableRooms.length === 0}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Загрузка...
              </span>
            ) : (
              'Забронировать'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
