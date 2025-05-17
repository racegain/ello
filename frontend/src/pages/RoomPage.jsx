import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomStatus from '../components/RoomStatus';
import useStore from '../store/useStore';

const RoomPage = () => {
  const { user, fetchBookings, bookings, isAuthenticated } = useStore();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const loadBookings = async () => {
      const userBookings = await fetchBookings();
      
      // Find active booking (status confirmed or checked_in)
      const active = userBookings.find(
        b => b.guest_name === user.username && 
        ['confirmed', 'checked_in'].includes(b.status)
      );
      
      if (active) {
        setActiveRoom(active.room_id);
      }
    };
    
    loadBookings();
  }, [fetchBookings, isAuthenticated, navigate, user]);

  if (!activeRoom) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Моя комната</h1>
        
        <div className="card max-w-md mx-auto">
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
            </svg>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Нет активных бронирований</h2>
            <p className="mt-1 text-sm text-gray-500">
              У вас нет активных бронирований. Пожалуйста, забронируйте номер сначала.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary"
              >
                Забронировать номер
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Моя комната</h1>
      
      <div className="max-w-2xl mx-auto">
        <RoomStatus roomId={activeRoom} />
        
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            Вернуться к бронированию
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
