# Mock controller client for development purposes
import random
from datetime import datetime

class ControllerClient:
    """
    Mock controller client that simulates communication with a room controller.
    This is used for development and testing when the actual controller is not available.
    """
    
    def __init__(self, ip="192.168.1.100", port=7000):
        self.ip = ip
        self.port = port
        self.is_connected = False
        self.token = "mock_token_123"
        
        # Initial state
        self.state = {
            "lights_on": False,
            "door_locked": True,
            "channel1": False,
            "channel2": False,
            "temperature": 23.0,
            "humidity": 45.0,
            "pressure": 1013.0
        }
    
    def connect(self):
        """Simulate connecting to the controller"""
        self.is_connected = True
        return True
    
    def disconnect(self):
        """Simulate disconnecting from the controller"""
        self.is_connected = False
        return True
    
    def get_info(self):
        """Get controller information"""
        if not self.is_connected:
            self.connect()
        
        return {
            "ip": self.ip,
            "mac": "12:34:56:78:90:AB",
            "ble_name": f"Room_{random.randint(101, 105)}",
            "token": self.token
        }
    
    def get_state(self):
        """Get current state of the controller"""
        if not self.is_connected:
            self.connect()
        
        # Add some random fluctuation to sensor values for realism
        self.state["temperature"] = round(random.uniform(21.5, 24.5), 1)
        self.state["humidity"] = round(random.uniform(40.0, 50.0), 1)
        self.state["pressure"] = round(random.uniform(1010.0, 1015.0), 1)
        
        return self.state
    
    def set_state(self, state_dict):
        """Update controller state"""
        if not self.is_connected:
            self.connect()
        
        for key, value in state_dict.items():
            if key in self.state:
                self.state[key] = value
        
        return {"status": "ok", "message": "State updated successfully"}

# For testing
if __name__ == "__main__":
    client = ControllerClient()
    print("Controller info:", client.get_info())
    print("Current state:", client.get_state())
    
    # Test setting states
    client.set_state({"lights_on": True})
    print("After turning lights on:", client.get_state())
    
    client.set_state({"door_locked": False})
    print("After unlocking door:", client.get_state())