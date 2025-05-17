import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Depends, status, Form, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from mock_client import ControllerClient

# Settings for JWT
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection (mock for this demonstration)
class MockDatabase:
    def __init__(self):
        # Mock data storage
        self.users = {
            "admin": {
                "id": str(uuid.uuid4()),
                "username": "admin",
                # Hashed password for "admin"
                "hashed_password": "$2b$12$1YGx1OYRyfnYQyA9ofCkYO0udGENbNIq2RCbJTJm7Bh9MPrnY9RBW",
                "role": "admin"
            },
            "guest": {
                "id": str(uuid.uuid4()),
                "username": "guest",
                # Hashed password for "guest"
                "hashed_password": "$2b$12$1YGx1OYRyfnYQyA9ofCkYO0udGENbNIq2RCbJTJm7Bh9MPrnY9RBW",
                "role": "guest"
            }
        }
        
        self.rooms = [
            {
                "id": str(uuid.uuid4()),
                "number": "101",
                "status": "available",
                "check_out_date": None
            },
            {
                "id": str(uuid.uuid4()),
                "number": "102",
                "status": "available",
                "check_out_date": None
            },
            {
                "id": str(uuid.uuid4()),
                "number": "103",
                "status": "occupied",
                "check_out_date": (datetime.now() + timedelta(days=3)).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "number": "104",
                "status": "maintenance",
                "check_out_date": None
            },
            {
                "id": str(uuid.uuid4()),
                "number": "105",
                "status": "available",
                "check_out_date": None
            }
        ]
        
        self.bookings = []
        self.room_states = {}
        
        # Initialize room states
        for room in self.rooms:
            controller = ControllerClient()
            state = controller.get_state()
            state["last_updated"] = datetime.now().isoformat()
            self.room_states[room["id"]] = state

db = MockDatabase()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: str
    username: str
    role: str

class UserInDB(User):
    hashed_password: str

class Room(BaseModel):
    id: str
    number: str
    status: str
    check_out_date: Optional[str] = None

class RoomState(BaseModel):
    room_id: str
    lights_on: bool
    door_locked: bool
    channel1: bool
    channel2: bool
    temperature: float
    humidity: float
    pressure: float
    last_updated: str

class Booking(BaseModel):
    id: str
    room_id: str
    room_number: str
    guest_name: str
    check_in_date: str
    check_out_date: str
    status: str
    created_at: str

class BookingCreate(BaseModel):
    room_id: str
    guest_name: str
    check_in_date: str
    check_out_date: str

class ControlCommand(BaseModel):
    command: str
    room_id: str
    state: Optional[Dict[str, Any]] = None

class AdminStats(BaseModel):
    total_rooms: int
    available_rooms: int
    occupied_rooms: int
    occupancy_percentage: float
    monthly_stats: Dict[str, float]

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    if username in db.users:
        user_dict = db.users[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    return current_user

async def is_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    return current_user

# API Routes
@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/register")
async def register_user(username: str = Form(...), password: str = Form(...), role: str = Form("guest")):
    if username in db.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    if role not in ["admin", "guest"]:
        role = "guest"  # Default to guest role for security
    
    hashed_password = get_password_hash(password)
    user_id = str(uuid.uuid4())
    
    db.users[username] = {
        "id": user_id,
        "username": username,
        "hashed_password": hashed_password,
        "role": role
    }
    
    return {"id": user_id, "username": username, "role": role}

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

@app.get("/api/rooms", response_model=List[Room])
async def get_rooms(current_user: UserInDB = Depends(get_current_active_user)):
    return db.rooms

@app.get("/api/rooms/number/{room_number}", response_model=Room)
async def get_room_by_number(room_number: str, current_user: UserInDB = Depends(get_current_active_user)):
    for room in db.rooms:
        if room["number"] == room_number:
            return room
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Room {room_number} not found"
    )

@app.get("/api/room-states/{room_id}", response_model=RoomState)
async def get_room_state(room_id: str, current_user: UserInDB = Depends(get_current_active_user)):
    if room_id not in db.room_states:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room state for room {room_id} not found"
        )
    
    # Refresh sensor data before returning
    controller = ControllerClient()
    state = controller.get_state()
    state["last_updated"] = datetime.now().isoformat()
    db.room_states[room_id].update(state)
    
    return {
        "room_id": room_id,
        **db.room_states[room_id]
    }

@app.post("/api/room-states/{room_id}/control")
async def control_room(room_id: str, command_data: ControlCommand, current_user: UserInDB = Depends(get_current_active_user)):
    if room_id not in db.room_states:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room state for room {room_id} not found"
        )
    
    controller = ControllerClient()
    
    if command_data.command == "set_state" and command_data.state:
        result = controller.set_state(command_data.state)
        
        # Update room state
        for key, value in command_data.state.items():
            if key in db.room_states[room_id]:
                db.room_states[room_id][key] = value
        
        db.room_states[room_id]["last_updated"] = datetime.now().isoformat()
        
        return {
            "status": "success",
            "message": "Room state updated",
            "result": command_data.state
        }
    
    return {
        "status": "error", 
        "message": "Invalid command"
    }

@app.post("/api/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: UserInDB = Depends(get_current_active_user)):
    # Find the room
    room = None
    for r in db.rooms:
        if r["id"] == booking_data.room_id:
            room = r
            break
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room {booking_data.room_id} not found"
        )
    
    if room["status"] != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room {room['number']} is not available"
        )
    
    # Create booking
    booking_id = str(uuid.uuid4())
    new_booking = {
        "id": booking_id,
        "room_id": booking_data.room_id,
        "room_number": room["number"],
        "guest_name": booking_data.guest_name,
        "check_in_date": booking_data.check_in_date,
        "check_out_date": booking_data.check_out_date,
        "status": "confirmed",
        "created_at": datetime.now().isoformat()
    }
    
    db.bookings.append(new_booking)
    
    # Update room status
    room["status"] = "occupied"
    room["check_out_date"] = booking_data.check_out_date
    
    return new_booking

@app.get("/api/bookings", response_model=List[Booking])
async def get_bookings(current_user: UserInDB = Depends(get_current_active_user)):
    user_bookings = []
    
    # Filter bookings for regular users, admins see all
    if current_user.role == "admin":
        user_bookings = db.bookings
    else:
        user_bookings = [b for b in db.bookings if b["guest_name"] == current_user.username]
    
    return user_bookings

@app.get("/api/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: UserInDB = Depends(is_admin)):
    total_rooms = len(db.rooms)
    available_rooms = sum(1 for room in db.rooms if room["status"] == "available")
    occupied_rooms = sum(1 for room in db.rooms if room["status"] == "occupied")
    
    occupancy_percentage = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0
    
    # Mock monthly statistics for the demo
    current_month = datetime.now().month
    monthly_stats = {}
    
    for month in range(1, 13):
        if month < current_month:
            # Past months with random occupancy
            monthly_stats[str(month)] = round(30 + 40 * (month / 12), 1)
        elif month == current_month:
            # Current month
            monthly_stats[str(month)] = round(occupancy_percentage, 1)
        else:
            # Future months with projections (lower for demo)
            monthly_stats[str(month)] = round(20 + 30 * ((12 - month) / 12), 1)
    
    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "occupied_rooms": occupied_rooms,
        "occupancy_percentage": occupancy_percentage,
        "monthly_stats": monthly_stats
    }

@app.post("/api/admin/rooms/bulk-control")
async def bulk_control_rooms(command: Dict[str, Any] = Body(...), current_user: UserInDB = Depends(is_admin)):
    cmd = list(command.keys())[0] if command else None
    
    if not cmd or cmd not in ["lights_on", "lights_off"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid command"
        )
    
    state_value = cmd == "lights_on"
    
    for room_id in db.room_states:
        db.room_states[room_id]["lights_on"] = state_value
        db.room_states[room_id]["last_updated"] = datetime.now().isoformat()
    
    return {
        "status": "success",
        "message": f"Bulk command {cmd} executed successfully"
    }

# Root path
@app.get("/")
async def read_root():
    return {"message": "Welcome to the Hotel Management API"}

# Expose app for uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
