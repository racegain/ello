import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminTable from '../components/AdminTable';
import OccupancyChart from '../components/OccupancyChart';
import useStore from '../store/useStore';

const AdminPage = () => {
  const { user, isAdmin, sendBulkControl, isLoading } = useStore();
  const navigate = useNavigate();

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleBulkLightsOff = async () => {
    await sendBulkControl('lights_off');
  };

  const handleBulkLightsOn = async () => {
    await sendBulkControl('lights_on');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Панель администратора</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8">
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Комнаты отеля</h2>
            </div>
            <div className="p-4">
              <AdminTable />
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4">
          <div className="card mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Массовое управление</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-4">
                Управление всеми комнатами одновременно
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleBulkLightsOff}
                  disabled={isLoading}
                  className="btn btn-danger w-full"
                >
                  Выключить весь свет
                </button>
                
                <button
                  onClick={handleBulkLightsOn}
                  disabled={isLoading}
                  className="btn btn-success w-full"
                >
                  Включить весь свет
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <OccupancyChart />
      </div>
    </div>
  );
};

export default AdminPage;
