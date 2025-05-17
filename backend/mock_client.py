import random
from typing import Dict, Any

class ControllerClient:
    """
    Mock client to simulate interaction with room controller hardware.
    In a real implementation, this would connect to actual hardware.
    """
    
    def __init__(self):
        # Default state for a room
        self._state = {
            "lights_on": False,
            "door_locked": True,
            "channel1": False,
            "channel2": False,
            "temperature": round(random.uniform(20.0, 24.0), 1),
            "humidity": round(random.uniform(40.0, 60.0), 1),
            "pressure": round(random.uniform(1000.0, 1020.0), 1),
        }
    
    def get_state(self) -> Dict[str, Any]:
        """
        Get the current state of the controller.
        Simulates reading from sensors.
        """
        # Add small random variations to sensor values to simulate changes
        self._state["temperature"] += round(random.uniform(-0.5, 0.5), 1)
        self._state["humidity"] += round(random.uniform(-1.0, 1.0), 1)
        self._state["pressure"] += round(random.uniform(-2.0, 2.0), 1)
        
        # Keep values in realistic ranges
        self._state["temperature"] = max(18.0, min(26.0, self._state["temperature"]))
        self._state["humidity"] = max(30.0, min(70.0, self._state["humidity"]))
        self._state["pressure"] = max(990.0, min(1030.0, self._state["pressure"]))
        
        return self._state
    
    def set_state(self, state_update: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the controller state with new values.
        Simulates sending commands to hardware.
        """
        for key, value in state_update.items():
            if key in self._state:
                self._state[key] = value
        
        return self._state
    
    def reset(self):
        """
        Reset the controller to default state.
        """
        self._state = {
            "lights_on": False,
            "door_locked": True,
            "channel1": False,
            "channel2": False,
            "temperature": round(random.uniform(20.0, 24.0), 1),
            "humidity": round(random.uniform(40.0, 60.0), 1),
            "pressure": round(random.uniform(1000.0, 1020.0), 1),
        }
