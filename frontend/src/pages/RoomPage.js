import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';

const RoomPage = () => {
  const { 
    user, 
    bookings, 
    fetchBookings, 
    selectedRoom, 
    fetchRoomByNumber, 
    roomStates, 
    fetchRoomState, 
    sendControlCommand, 
    isLoading, 
    error 
  } = useStore();
  
  const [activeBooking, setActiveBooking] = useState(null);
  const [roomState, setRoomState] = useState(null);

  useEffect(() => {
    // Fetch the user's bookings
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (bookings.length > 0) {
      // Find an active booking (checked_in or confirmed)
      const active = bookings.find(b => 
        b.status === 'checked_in' || b.status === 'confirmed'
      );
      
      if (active) {
        setActiveBooking(active);
        
        // Fetch the corresponding room
        fetchRoomByNumber(active.room_number).then(room => {
          if (room) {
            fetchRoomState(room.id).then(state => {
              setRoomState(state);
            });
          }
        });
      }
    }
  }, [bookings, fetchRoomByNumber, fetchRoomState]);

  const handleControlCommand = async (command, state = null) => {
    if (!selectedRoom) return;
    
    await sendControlCommand(selectedRoom.id, command, state);
    
    // Refresh room state
    const updatedState = await fetchRoomState(selectedRoom.id);
    setRoomState(updatedState);
  };

  const toggleLights = () => {
    if (!roomState) return;
    handleControlCommand('set_state', { 
      lights_on: !roomState.lights_on 
    });
  };

  const toggleDoor = () => {
    if (!roomState) return;
    handleControlCommand('set_state', { 
      door_locked: !roomState.door_locked 
    });
  };

  const toggleChannel = (channel) => {
    if (!roomState) return;
    handleControlCommand('set_state', { 
      [channel]: !roomState[channel] 
    });
  };

  if (!activeBooking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">У вас нет активных бронирований</h2>
          <p>Забронируйте номер, чтобы управлять им.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Управление номером {selectedRoom?.number}</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Информация о бронировании</h3>
              <div className="bg-gray-100 p-4 rounded">
                <p><strong>Гость:</strong> {user?.username}</p>
                <p><strong>Дата заезда:</strong> {new Date(activeBooking.check_in_date).toLocaleDateString()}</p>
                <p><strong>Дата выезда:</strong> {new Date(activeBooking.check_out_date).toLocaleDateString()}</p>
                <p><strong>Статус:</strong> {
                  activeBooking.status === 'confirmed' ? 'Подтверждено' :
                  activeBooking.status === 'checked_in' ? 'Заселен' :
                  'Выписан'
                }</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Контроль номера</h3>
              {isLoading ? (
                <div className="text-center p-4">Загрузка...</div>
              ) : roomState ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
                    <span>Свет</span>
                    <button 
                      onClick={toggleLights}
                      className={`px-4 py-2 rounded ${
                        roomState.lights_on 
                          ? 'bg-yellow-500 hover:bg-yellow-600' 
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                    >
                      {roomState.lights_on ? 'Выключить' : 'Включить'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
                    <span>Дверь</span>
                    <button 
                      onClick={toggleDoor}
                      className={`px-4 py-2 rounded ${
                        roomState.door_locked 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white`}
                    >
                      {roomState.door_locked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
                    <span>Канал 1</span>
                    <button 
                      onClick={() => toggleChannel('channel1')}
                      className={`px-4 py-2 rounded ${
                        roomState.channel1 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                    >
                      {roomState.channel1 ? 'Выключить' : 'Включить'}
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
                    <span>Канал 2</span>
                    <button 
                      onClick={() => toggleChannel('channel2')}
                      className={`px-4 py-2 rounded ${
                        roomState.channel2 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                    >
                      {roomState.channel2 ? 'Выключить' : 'Включить'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">Нет данных о состоянии номера</div>
              )}
            </div>
          </div>
          
          {roomState && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Датчики номера</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-blue-700">{roomState.temperature}°C</div>
                  <div className="text-sm text-gray-600">Температура</div>
                </div>
                <div className="bg-blue-50 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-blue-700">{roomState.humidity}%</div>
                  <div className="text-sm text-gray-600">Влажность</div>
                </div>
                <div className="bg-blue-50 p-4 rounded text-center">
                  <div className="text-2xl font-bold text-blue-700">{roomState.pressure} hPa</div>
                  <div className="text-sm text-gray-600">Давление</div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500 mt-2">
                Обновлено: {new Date(roomState.last_updated).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
