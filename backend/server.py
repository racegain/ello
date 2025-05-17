
import os
from fastapi import FastAPI, HTTPException, Depends, status, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uvicorn
from pymongo import MongoClient
import uuid
from dotenv import load_dotenv
import asyncio
import json

# Import controller client
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from client import ControllerClient

# Load environment variables
load_dotenv()

# MongoDB Setup
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/hotel_management")
client = MongoClient(MONGO_URL)
db = client.hotel_management

# JWT Setup
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Mock controller setup (for development)
CONTROLLER_IP = "192.168.1.100"
CONTROLLER_PORT = 7000

# Create FastAPI app
app = FastAPI(title="Hotel Management API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str = "guest"
    disabled: Optional[bool] = False

class UserInDB(User):
    hashed_password: str

class UserCreate(User):
    password: str

class Room(BaseModel):
    id: str
    number: str
    status: str = "available"  # available, occupied, maintenance
    guest: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None

class RoomState(BaseModel):
    id: str
    room_number: str
    lights_on: bool = False
    door_locked: bool = True
    channel1: bool = False
    channel2: bool = False
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pressure: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.now)

class Booking(BaseModel):
    id: str
    room_id: str
    guest_name: str
    check_in_date: datetime
    check_out_date: datetime
    status: str = "confirmed"  # confirmed, checked_in, checked_out, cancelled

class ControlCommand(BaseModel):
    command: str  # get_info, get_state, set_state
    room_id: str
    state: Optional[Dict] = None  # For set_state

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    user_doc = db.users.find_one({"username": username})
    if user_doc:
        return UserInDB(**user_doc)
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
        token_data = TokenData(username=username, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Controller communication
def get_controller_client(room_id: str):
    # In a real application, you would get the controller IP/port from the database based on room_id
    # For demo purposes, we'll use a mock controller
    return ControllerClient(CONTROLLER_IP, CONTROLLER_PORT)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

# Initialize the database with some data
@app.on_event("startup")
async def startup_db_client():
    # Create admin user if not exists
    if db.users.count_documents({"username": "admin"}) == 0:
        db.users.insert_one({
            "username": "admin",
            "role": "admin",
            "disabled": False,
            "hashed_password": get_password_hash("admin")
        })
    
    # Create some demo rooms if not exists
    if db.rooms.count_documents({}) == 0:
        for i in range(101, 106):
            room_id = str(uuid.uuid4())
            db.rooms.insert_one({
                "id": room_id,
                "number": str(i),
                "status": "available"
            })
            
            # Initialize room state
            db.room_states.insert_one({
                "id": str(uuid.uuid4()),
                "room_id": room_id,
                "room_number": str(i),
                "lights_on": False,
                "door_locked": True,
                "channel1": False,
                "channel2": False,
                "temperature": 23.0,
                "humidity": 45.0,
                "pressure": 1013.0,
                "last_updated": datetime.now()
            })

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Auth routes
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
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/register", response_model=User)
async def register_user(user: UserCreate):
    existing_user = db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    
    db.users.insert_one(user_dict)
    return user_dict

@app.get("/api/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Room routes
@app.get("/api/rooms", response_model=List[Room])
async def get_rooms(current_user: User = Depends(get_current_active_user)):
    rooms = list(db.rooms.find())
    return rooms

@app.get("/api/rooms/{room_id}", response_model=Room)
async def get_room(room_id: str, current_user: User = Depends(get_current_active_user)):
    room = db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.get("/api/rooms/number/{room_number}", response_model=Room)
async def get_room_by_number(room_number: str, current_user: User = Depends(get_current_active_user)):
    room = db.rooms.find_one({"number": room_number})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

# Booking routes
@app.post("/api/bookings", response_model=Booking)
async def create_booking(
    room_id: str = Body(...),
    guest_name: str = Body(...),
    check_in_date: str = Body(...),
    check_out_date: str = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    # Validate dates
    try:
        check_in = datetime.fromisoformat(check_in_date)
        check_out = datetime.fromisoformat(check_out_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    
    # Check if room exists and is available
    room = db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room["status"] != "available":
        raise HTTPException(status_code=400, detail="Room is not available")
    
    # Check for conflicting bookings
    existing_booking = db.bookings.find_one({
        "room_id": room_id,
        "status": {"$in": ["confirmed", "checked_in"]},
        "$or": [
            {"check_in_date": {"$lt": check_out}, "check_out_date": {"$gt": check_in}},
            {"check_in_date": {"$eq": check_in}},
            {"check_out_date": {"$eq": check_out}}
        ]
    })
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Room is already booked for the selected dates")
    
    # Create booking
    booking_id = str(uuid.uuid4())
    booking = {
        "id": booking_id,
        "room_id": room_id,
        "guest_name": guest_name,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "status": "confirmed"
    }
    
    db.bookings.insert_one(booking)
    
    # Update room status
    db.rooms.update_one(
        {"id": room_id},
        {"$set": {"status": "occupied", "guest": guest_name, "check_in_date": check_in, "check_out_date": check_out}}
    )
    
    return booking

@app.get("/api/bookings", response_model=List[Booking])
async def get_bookings(current_user: User = Depends(get_current_active_user)):
    if current_user.role == "admin":
        bookings = list(db.bookings.find())
    else:
        bookings = list(db.bookings.find({"guest_name": current_user.username}))
    return bookings

@app.get("/api/bookings/user/{username}", response_model=List[Booking])
async def get_user_bookings(username: str, current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin" and current_user.username != username:
        raise HTTPException(status_code=403, detail="Not authorized to view these bookings")
    
    bookings = list(db.bookings.find({"guest_name": username}))
    return bookings

# Room state routes
@app.get("/api/room-states/{room_id}", response_model=RoomState)
async def get_room_state(room_id: str, current_user: User = Depends(get_current_active_user)):
    # Check if user has access to this room
    room = db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if current_user.role != "admin" and room.get("guest") != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")
    
    room_state = db.room_states.find_one({"room_id": room_id})
    if not room_state:
        raise HTTPException(status_code=404, detail="Room state not found")
    
    return room_state

@app.post("/api/room-states/{room_id}/control")
async def control_room(
    room_id: str,
    command: ControlCommand,
    current_user: User = Depends(get_current_active_user)
):
    # Check if user has access to this room
    room = db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if current_user.role != "admin" and room.get("guest") != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to control this room")
    
    # Get room state
    room_state = db.room_states.find_one({"room_id": room_id})
    if not room_state:
        raise HTTPException(status_code=404, detail="Room state not found")
    
    try:
        # In a real application, you would communicate with the actual controller
        # For demo purposes, we'll simulate the controller response
        if command.command == "get_info":
            result = {
                "mac": "12:34:56:78:90:AB",
                "ip": CONTROLLER_IP,
                "ble_name": f"Room{room['number']}",
                "token": "room_token_123"
            }
        elif command.command == "get_state":
            result = {
                "lights_on": room_state["lights_on"],
                "door_locked": room_state["door_locked"],
                "channel1": room_state["channel1"],
                "channel2": room_state["channel2"],
                "temperature": room_state["temperature"],
                "humidity": room_state["humidity"],
                "pressure": room_state["pressure"]
            }
        elif command.command == "set_state" and command.state:
            # Update room state in database
            update_data = {}
            for key, value in command.state.items():
                if key in ["lights_on", "door_locked", "channel1", "channel2"]:
                    update_data[key] = bool(value)
            
            if update_data:
                update_data["last_updated"] = datetime.now()
                db.room_states.update_one(
                    {"room_id": room_id},
                    {"$set": update_data}
                )
            
            # Get updated room state
            room_state = db.room_states.find_one({"room_id": room_id})
            result = {
                "lights_on": room_state["lights_on"],
                "door_locked": room_state["door_locked"],
                "channel1": room_state["channel1"],
                "channel2": room_state["channel2"],
                "temperature": room_state["temperature"],
                "humidity": room_state["humidity"],
                "pressure": room_state["pressure"]
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid command")
        
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Controller communication error: {str(e)}")

# WebSocket for real-time updates
@app.websocket("/api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                command = json.loads(data)
                # Process command (authenticate, get updates, etc.)
                # For now, just echo back
                await manager.send_personal_message(f"You sent: {data}", client_id)
            except json.JSONDecodeError:
                await manager.send_personal_message("Invalid JSON", client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Admin routes
@app.get("/api/admin/stats")
async def admin_stats(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access admin stats")
    
    total_rooms = db.rooms.count_documents({})
    occupied_rooms = db.rooms.count_documents({"status": "occupied"})
    maintenance_rooms = db.rooms.count_documents({"status": "maintenance"})
    available_rooms = total_rooms - occupied_rooms - maintenance_rooms
    
    # Get monthly occupancy stats
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Mock monthly stats for demo
    monthly_stats = {}
    for month in range(1, 13):
        occupancy_percentage = 20 + (month % 12) * 5  # Mock data: 20% in Jan, increasing by 5% each month
        monthly_stats[month] = occupancy_percentage
    
    return {
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "available_rooms": available_rooms,
        "maintenance_rooms": maintenance_rooms,
        "occupancy_percentage": (occupied_rooms / total_rooms) * 100 if total_rooms > 0 else 0,
        "monthly_stats": monthly_stats
    }

@app.post("/api/admin/rooms/bulk-control")
async def admin_bulk_control(
    command: str = Body(...),  # lights_off, lights_on, etc.
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized for bulk control")
    
    update_data = {}
    if command == "lights_off":
        update_data["lights_on"] = False
    elif command == "lights_on":
        update_data["lights_on"] = True
    else:
        raise HTTPException(status_code=400, detail="Invalid command")
    
    if update_data:
        update_data["last_updated"] = datetime.now()
        result = db.room_states.update_many({}, {"$set": update_data})
        return {"status": "success", "modified_count": result.modified_count}
    
    return {"status": "error", "detail": "No update performed"}

# Root endpoint
@app.get("/api/")
async def root():
    return {"message": "Welcome to the Hotel Management API"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
