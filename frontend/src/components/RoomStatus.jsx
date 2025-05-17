import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';

// Sub-components
const LightToggle = ({ isOn, onChange, disabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">Свет</span>
    <button
      type="button"
      onClick={() => onChange(!isOn)}
      disabled={disabled}
      className={`toggle-switch ${isOn ? 'bg-primary' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`toggle-handle ${isOn ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const DoorButton = ({ isLocked, onChange, disabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">Замок</span>
    <button
      type="button"
      onClick={() => onChange(!isLocked)}
      disabled={disabled}
      className={`btn ${isLocked ? 'btn-danger' : 'btn-success'} text-sm py-1 px-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLocked ? 'Открыть' : 'Закрыть'}
    </button>
  </div>
);

const ChannelSwitch = ({ channel, isOn, onChange, disabled }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">Канал {channel}</span>
    <button
      type="button"
      onClick={() => onChange(!isOn)}
      disabled={disabled}
      className={`toggle-switch ${isOn ? 'bg-primary' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`toggle-handle ${isOn ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const SensorDisplay = ({ name, value, unit, icon }) => (
  <div className="sensor-box">
    <span className="sensor-icon">{icon}</span>
    <div>
      <span className="text-xs text-gray-500">{name}</span>
      <div>
        <span className="sensor-value">{value}</span>
        <span className="sensor-unit">{unit}</span>
      </div>
    </div>
  </div>
);

const RoomStatus = ({ roomId }) => {
  const { 
    fetchRoomState, 
    sendControlCommand, 
    roomStates, 
    isLoading, 
    error,
    isOffline
  } = useStore();
  
  const [polling, setPolling] = useState(null);
  const roomState = roomStates[roomId];

  // Auto-update room state
  useEffect(() => {
    // Initial fetch
    fetchRoomState(roomId);
    
    // Set up polling interval (only if online)
    if (!isOffline) {
      const intervalId = setInterval(() => {
        fetchRoomState(roomId);
      }, 10000); // Poll every 10 seconds
      
      setPolling(intervalId);
    }
    
    // Cleanup function
    return () => {
      if (polling) {
        clearInterval(polling);
      }
    };
  }, [fetchRoomState, roomId, isOffline]);

  // Control handlers
  const handleLightToggle = async (newState) => {
    await sendControlCommand(roomId, 'set_state', { lights_on: newState });
  };
  
  const handleDoorLock = async (newState) => {
    await sendControlCommand(roomId, 'set_state', { door_locked: newState });
  };
  
  const handleChannel1Toggle = async (newState) => {
    await sendControlCommand(roomId, 'set_state', { channel1: newState });
  };
  
  const handleChannel2Toggle = async (newState) => {
    await sendControlCommand(roomId, 'set_state', { channel2: newState });
  };

  if (!roomState) {
    return (
      <div className="card p-4 mb-4">
        <p className="text-center text-gray-500">Загрузка информации о комнате...</p>
      </div>
    );
  }

  return (
    <div className="card p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Состояние комнаты</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {isOffline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">
            Вы находитесь в автономном режиме. Управление комнатой недоступно.
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <LightToggle 
            isOn={roomState?.lights_on} 
            onChange={handleLightToggle}
            disabled={isLoading || isOffline}
          />
          
          <DoorButton 
            isLocked={roomState?.door_locked} 
            onChange={handleDoorLock}
            disabled={isLoading || isOffline}
          />
          
          <ChannelSwitch 
            channel={1} 
            isOn={roomState?.channel1}
            onChange={handleChannel1Toggle}
            disabled={isLoading || isOffline}
          />
          
          <ChannelSwitch 
            channel={2} 
            isOn={roomState?.channel2}
            onChange={handleChannel2Toggle}
            disabled={isLoading || isOffline}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Датчики</h4>
          
          <SensorDisplay 
            name="Температура" 
            value={roomState?.temperature} 
            unit="°C"
            icon="🌡️"
          />
          
          <SensorDisplay 
            name="Влажность" 
            value={roomState?.humidity} 
            unit="%"
            icon="💧"
          />
          
          <SensorDisplay 
            name="Давление" 
            value={roomState?.pressure} 
            unit="гПа"
            icon="🔄"
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-right">
        Последнее обновление: {new Date(roomState?.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default RoomStatus;
