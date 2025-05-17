import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';

const AdminTable = () => {
  const { 
    rooms, 
    fetchRooms, 
    roomStates, 
    fetchRoomState,
    isLoading 
  } = useStore();
  
  // Fetch rooms and their states
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);
  
  // Once we have rooms, fetch all their states
  useEffect(() => {
    const fetchAllRoomStates = async () => {
      for (const room of rooms) {
        await fetchRoomState(room.id);
      }
    };
    
    if (rooms.length > 0) {
      fetchAllRoomStates();
    }
  }, [rooms, fetchRoomState]);

  // Combine room data with state data
  const combinedRoomData = rooms.map(room => {
    const state = roomStates[room.id] || {};
    return {
      ...room,
      lights_on: state.lights_on,
      door_locked: state.door_locked,
      channel1: state.channel1,
      channel2: state.channel2
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Номер</th>
            <th>Гость</th>
            <th>Статус</th>
            <th>Свет</th>
            <th>Замок</th>
            <th>Канал 1</th>
            <th>Канал 2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan="7" className="text-center py-4">Загрузка...</td>
            </tr>
          ) : (
            combinedRoomData.map(room => (
              <tr key={room.id}>
                <td>{room.number}</td>
                <td>{room.guest || '—'}</td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    room.status === 'available' ? 'bg-green-100 text-green-800' :
                    room.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {room.status === 'available' ? 'Свободен' :
                     room.status === 'occupied' ? 'Занят' :
                     'В обслуживании'}
                  </span>
                </td>
                <td>
                  <span className="flex items-center">
                    <span className={`status-indicator ${room.lights_on ? 'status-on' : 'status-off'}`}></span>
                    {room.lights_on ? 'Включен' : 'Выключен'}
                  </span>
                </td>
                <td>
                  <span className="flex items-center">
                    <span className={`status-indicator ${room.door_locked ? 'status-locked' : 'status-unlocked'}`}></span>
                    {room.door_locked ? 'Закрыт' : 'Открыт'}
                  </span>
                </td>
                <td>
                  <span className={`status-indicator ${room.channel1 ? 'status-on' : 'status-off'}`}></span>
                  {room.channel1 ? 'On' : 'Off'}
                </td>
                <td>
                  <span className={`status-indicator ${room.channel2 ? 'status-on' : 'status-off'}`}></span>
                  {room.channel2 ? 'On' : 'Off'}
                </td>
              </tr>
            ))
          )}
          
          {!isLoading && combinedRoomData.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-4">Нет данных о комнатах</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
