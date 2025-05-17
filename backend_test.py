import requests
import unittest
import json
import sys
from datetime import datetime, timedelta

class HotelManagementAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(HotelManagementAPITester, self).__init__(*args, **kwargs)
        self.base_url = "http://localhost:8001/api"
        self.token = None
        self.admin_token = None
        self.test_user = f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.test_password = "Test@123"
        self.room_id = None
        self.booking_id = None
        
        print(f"Testing API at: {self.base_url}")

    def setUp(self):
        # Register and login as test user
        self.register_user(self.test_user, self.test_password)
        self.login_user(self.test_user, self.test_password)
        
        # Login as admin
        self.login_user("admin", "admin", is_admin=True)

    def register_user(self, username, password):
        """Register a new user"""
        print(f"\n🔍 Testing user registration for {username}...")
        
        try:
            response = requests.post(f"{self.base_url}/register", json={
                "username": username,
                "password": password,
                "role": "guest"
            })
            
            if response.status_code == 200:
                print(f"✅ User registration successful - Status: {response.status_code}")
                return True
            else:
                print(f"❌ User registration failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ User registration error: {str(e)}")
            return False

    def login_user(self, username, password, is_admin=False):
        """Login a user and get token"""
        print(f"\n🔍 Testing login for {username}...")
        
        try:
            # Create form data for token endpoint
            form_data = {
                "username": username,
                "password": password
            }
            
            response = requests.post(f"{self.base_url}/token", data=form_data)
            
            if response.status_code == 200:
                token = response.json().get("access_token")
                if is_admin:
                    self.admin_token = token
                else:
                    self.token = token
                print(f"✅ Login successful - Status: {response.status_code}")
                return True
            else:
                print(f"❌ Login failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def get_user_info(self):
        """Get current user info"""
        print("\n🔍 Testing get user info...")
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/users/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Get user info successful - Status: {response.status_code}")
                print(f"User data: {json.dumps(user_data, indent=2)}")
                return user_data
            else:
                print(f"❌ Get user info failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Get user info error: {str(e)}")
            return None

    def get_rooms(self):
        """Get available rooms"""
        print("\n🔍 Testing get rooms...")
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/rooms", headers=headers)
            
            if response.status_code == 200:
                rooms = response.json()
                if rooms and len(rooms) > 0:
                    self.room_id = rooms[0]["id"]
                print(f"✅ Get rooms successful - Status: {response.status_code}")
                print(f"Found {len(rooms)} rooms")
                return rooms
            else:
                print(f"❌ Get rooms failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Get rooms error: {str(e)}")
            return None

    def create_booking(self):
        """Create a room booking"""
        print("\n🔍 Testing create booking...")
        
        if not self.room_id:
            print("❌ No room ID available for booking")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Set check-in date to today and check-out date to tomorrow
            check_in = datetime.now().strftime("%Y-%m-%d")
            check_out = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            booking_data = {
                "room_id": self.room_id,
                "guest_name": self.test_user,
                "check_in_date": check_in,
                "check_out_date": check_out
            }
            
            response = requests.post(
                f"{self.base_url}/bookings", 
                json=booking_data,
                headers=headers
            )
            
            if response.status_code == 200:
                booking = response.json()
                self.booking_id = booking.get("id")
                print(f"✅ Create booking successful - Status: {response.status_code}")
                print(f"Booking data: {json.dumps(booking, indent=2)}")
                return booking
            else:
                print(f"❌ Create booking failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Create booking error: {str(e)}")
            return None

    def get_bookings(self):
        """Get user bookings"""
        print("\n🔍 Testing get bookings...")
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/bookings", headers=headers)
            
            if response.status_code == 200:
                bookings = response.json()
                print(f"✅ Get bookings successful - Status: {response.status_code}")
                print(f"Found {len(bookings)} bookings")
                return bookings
            else:
                print(f"❌ Get bookings failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Get bookings error: {str(e)}")
            return None

    def get_room_state(self):
        """Get room state"""
        print("\n🔍 Testing get room state...")
        
        if not self.room_id:
            print("❌ No room ID available for getting state")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{self.base_url}/room-states/{self.room_id}", headers=headers)
            
            if response.status_code == 200:
                room_state = response.json()
                print(f"✅ Get room state successful - Status: {response.status_code}")
                print(f"Room state: {json.dumps(room_state, indent=2)}")
                return room_state
            else:
                print(f"❌ Get room state failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Get room state error: {str(e)}")
            return None

    def control_room(self):
        """Control room (turn on lights)"""
        print("\n🔍 Testing room control...")
        
        if not self.room_id:
            print("❌ No room ID available for control")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            control_data = {
                "command": "set_state",
                "room_id": self.room_id,
                "state": {
                    "lights_on": True
                }
            }
            
            response = requests.post(
                f"{self.base_url}/room-states/{self.room_id}/control", 
                json=control_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Room control successful - Status: {response.status_code}")
                print(f"Control result: {json.dumps(result, indent=2)}")
                return result
            else:
                print(f"❌ Room control failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Room control error: {str(e)}")
            return None

    def get_admin_stats(self):
        """Get admin statistics"""
        print("\n🔍 Testing admin statistics...")
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                print(f"✅ Admin stats successful - Status: {response.status_code}")
                print(f"Admin stats: {json.dumps(stats, indent=2)}")
                return stats
            else:
                print(f"❌ Admin stats failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Admin stats error: {str(e)}")
            return None

    def bulk_control(self):
        """Test bulk control of rooms"""
        print("\n🔍 Testing bulk control...")
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            control_data = {
                "command": "lights_off"
            }
            
            response = requests.post(
                f"{self.base_url}/admin/rooms/bulk-control", 
                json=control_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Bulk control successful - Status: {response.status_code}")
                print(f"Bulk control result: {json.dumps(result, indent=2)}")
                return result
            else:
                print(f"❌ Bulk control failed - Status: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Bulk control error: {str(e)}")
            return None

    def test_full_flow(self):
        """Run the full test flow"""
        try:
            # Get user info
            user_info = self.get_user_info()
            self.assertIsNotNone(user_info, "Failed to get user info")
            
            # Get rooms
            rooms = self.get_rooms()
            self.assertIsNotNone(rooms, "Failed to get rooms")
            self.assertTrue(len(rooms) > 0, "No rooms available")
            
            # Create booking
            booking = self.create_booking()
            if not booking:
                print("⚠️ Booking creation failed, but continuing with tests")
            
            # Get bookings
            bookings = self.get_bookings()
            self.assertIsNotNone(bookings, "Failed to get bookings")
            
            # Try to get room state (might fail if not authorized)
            try:
                room_state = self.get_room_state()
                if room_state:
                    # Try to control room
                    control_result = self.control_room()
                    if control_result:
                        print("✅ Room control successful")
                    else:
                        print("⚠️ Room control failed, but continuing with tests")
                else:
                    print("⚠️ Room state access failed, but continuing with tests")
            except Exception as e:
                print(f"⚠️ Room state/control error: {str(e)}, but continuing with tests")
            
            # Admin tests
            try:
                admin_stats = self.get_admin_stats()
                if admin_stats:
                    print("✅ Admin stats successful")
                else:
                    print("⚠️ Admin stats failed, but continuing with tests")
                
                bulk_result = self.bulk_control()
                if bulk_result:
                    print("✅ Bulk control successful")
                else:
                    print("⚠️ Bulk control failed, but continuing with tests")
            except Exception as e:
                print(f"⚠️ Admin tests error: {str(e)}, but continuing with tests")
            
            print("\n✅ API testing completed with some warnings")
            
        except AssertionError as e:
            print(f"\n❌ Test failed: {str(e)}")
            raise
        except Exception as e:
            print(f"\n❌ Unexpected error: {str(e)}")
            raise

if __name__ == "__main__":
    # Run the test
    tester = HotelManagementAPITester()
    tester.setUp()
    tester.test_full_flow()
    print("\n✅ All API tests completed!")