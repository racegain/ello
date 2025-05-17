import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const BookingPage = () => {
  const { isAuthenticated, user, rooms, fetchRooms, createBooking, isLoading, error } = useStore();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const navigate = useNavigate();

  // Fetch rooms when component mounts
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedRoom || !checkInDate || !checkOutDate) {
      return;
    }

    const booking = await createBooking(
      selectedRoom.id,
      user.username,
      checkInDate,
      checkOutDate
    );

    if (booking) {
      // Clear form
      setSelectedRoom(null);
      setCheckInDate('');
      setCheckOutDate('');
      
      // Navigate to room page
      navigate('/room');
    }
  };

  const availableRooms = rooms.filter(room => room.status === 'available');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Забронировать номер</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleBooking}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-700 mb-2">Выберите номер</label>
                <select 
                  value={selectedRoom ? selectedRoom.id : ''} 
                  onChange={(e) => {
                    const roomId = e.target.value;
                    const room = rooms.find(r => r.id === roomId);
                    setSelectedRoom(room);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Выберите номер --</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Номер {room.number}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Дата заезда</label>
                  <input 
                    type="date" 
                    value={checkInDate} 
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Дата выезда</label>
                  <input 
                    type="date" 
                    value={checkOutDate} 
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                disabled={isLoading || !isAuthenticated}
              >
                {isLoading ? 'Бронирование...' : 'Забронировать'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div 
            key={room.id} 
            className={`bg-white shadow-md rounded-lg overflow-hidden border-l-4 ${
              room.status === 'available' ? 'border-green-500' : 
              room.status === 'occupied' ? 'border-red-500' : 'border-yellow-500'
            }`}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Номер {room.number}</h3>
              <div className="flex items-center mb-2">
                <span 
                  className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    room.status === 'available' ? 'bg-green-500' : 
                    room.status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                ></span>
                <span className="text-gray-700">
                  {room.status === 'available' 
                    ? 'Доступен' 
                    : room.status === 'occupied' 
                      ? 'Занят' 
                      : 'На обслуживании'}
                </span>
              </div>
              
              {room.status === 'occupied' && room.check_out_date && (
                <p className="text-sm text-gray-600">
                  Освободится: {new Date(room.check_out_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;
