from config import supabase_admin
import uuid
from datetime import datetime

def create_test_doctor():
    """Create a test doctor in Supabase"""
    try:
        # Generate a UUID for the doctor
        doctor_id = str(uuid.uuid4())
        
        # Create doctor data
        doctor_data = {
            'id': doctor_id,
            'name': 'Dr. Sarah Wilson',
            'email': 'dr.wilson@example.com',
            'role': 'doctor',
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Insert into Supabase
        result = supabase_admin.table("users").insert(doctor_data).execute()
        
        if result.data and len(result.data) > 0:
            doctor_data = result.data[0]
            print(f"Successfully created doctor with ID: {doctor_data['id']}")
            print("Doctor details:", doctor_data)
            return doctor_data["id"]
        else:
            print("Failed to create doctor")
            return None

    except Exception as e:
        print(f"Error creating test doctor: {str(e)}")
        return None

if __name__ == "__main__":
    doctor_id = create_test_doctor()
    if doctor_id:
        print("\nYou can now use this doctor ID for testing:")
        print(f"Doctor ID: {doctor_id}") 