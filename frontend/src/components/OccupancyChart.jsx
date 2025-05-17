import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import useStore from '../store/useStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OccupancyChart = () => {
  const { fetchAdminStats, isLoading } = useStore();
  const [statsData, setStatsData] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await fetchAdminStats();
      if (stats) {
        setStatsData(stats);
      }
    };
    
    loadStats();
  }, [fetchAdminStats]);

  // Month names for the chart
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Prepare chart data
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Загрузка отеля (%)',
        data: statsData 
          ? months.map((_, index) => statsData.monthly_stats[index + 1] || 0) 
          : [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Загрузка отеля по месяцам',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Процент загрузки',
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="card p-6 h-80 flex items-center justify-center">
        <p className="text-gray-500">Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">График загрузки</h3>
      
      {statsData ? (
        <div className="h-72">
          <Bar data={chartData} options={options} />
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center">
          <p className="text-gray-500">Нет данных о загрузке</p>
        </div>
      )}
      
      {statsData && (
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Всего комнат</p>
            <p className="text-2xl font-bold text-primary">{statsData.total_rooms}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Занято</p>
            <p className="text-2xl font-bold text-success">{statsData.occupied_rooms}</p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Текущая загрузка</p>
            <p className="text-2xl font-bold text-warning">{Math.round(statsData.occupancy_percentage)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyChart;
