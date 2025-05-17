import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import useStore from '../store/useStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminPage = () => {
  const { 
    fetchAdminStats, 
    sendBulkControl, 
    rooms, 
    fetchRooms, 
    roomStates, 
    fetchRoomState, 
    isLoading, 
    error 
  } = useStore();
  
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAdminStats().then(setStats);
    fetchRooms();
  }, [fetchAdminStats, fetchRooms]);

  useEffect(() => {
    if (rooms.length > 0) {
      // Fetch room states for all rooms
      rooms.forEach(room => {
        fetchRoomState(room.id);
      });
    }
  }, [rooms, fetchRoomState]);

  const handleBulkControl = async (command) => {
    await sendBulkControl(command);
    fetchAdminStats().then(setStats);
  };

  // Prepare chart data
  const chartData = stats ? {
    labels: Object.keys(stats.monthly_stats).map(month => {
      const date = new Date();
      date.setMonth(parseInt(month) - 1);
      return date.toLocaleString('default', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Загруженность (%)',
        data: Object.values(stats.monthly_stats),
        fill: false,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  } : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Панель администратора</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center p-4">Загрузка...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-blue-700">{stats.total_rooms}</div>
                  <div className="text-sm text-gray-600">Всего номеров</div>
                </div>
                <div className="bg-green-50 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-green-700">{stats.available_rooms}</div>
                  <div className="text-sm text-gray-600">Доступно</div>
                </div>
                <div className="bg-red-50 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-red-700">{stats.occupied_rooms}</div>
                  <div className="text-sm text-gray-600">Занято</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded text-center">
                  <div className="text-3xl font-bold text-yellow-700">
                    {stats.occupancy_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Загруженность</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Загруженность по месяцам</h3>
                <div className="h-64">
                  {chartData && <Line data={chartData} options={{ maintainAspectRatio: false }} />}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Управление всеми номерами</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleBulkControl('lights_on')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Включить все светильники
                  </button>
                  <button
                    onClick={() => handleBulkControl('lights_off')}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Выключить все светильники
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-4">Нет данных</div>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Состояние всех номеров</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Свет
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дверь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Температура
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Обновлено
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map(room => {
                  const state = roomStates[room.id];
                  return (
                    <tr key={room.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.status === 'available' ? 'bg-green-100 text-green-800' : 
                          room.status === 'occupied' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {room.status === 'available' ? 'Доступен' : 
                           room.status === 'occupied' ? 'Занят' : 
                           'На обслуживании'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {state ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            state.lights_on ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {state.lights_on ? 'Включен' : 'Выключен'}
                          </span>
                        ) : 'Нет данных'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {state ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            state.door_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {state.door_locked ? 'Заблокирована' : 'Разблокирована'}
                          </span>
                        ) : 'Нет данных'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {state ? `${state.temperature}°C` : 'Нет данных'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {state ? new Date(state.last_updated).toLocaleString() : 'Нет данных'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
