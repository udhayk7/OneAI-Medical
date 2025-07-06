from datetime import datetime, date
import uuid
from models import UserCreate, RoleEnum, GenderEnum
from config import supabase_admin

def create_test_user():
    """Create a test user in Supabase"""
    try:
        # Create test user data
        user = UserCreate(
            name="Dr. Sarah Wilson",
            email="dr.wilson@example.com",
            phone="+1-555-0123",
            role=RoleEnum.DOCTOR,
            address="123 Medical Center Drive, Suite 100",
            date_of_birth=date(1985, 6, 15),
            gender=GenderEnum.FEMALE,
            emergency_contact_name="John Wilson",
            emergency_contact_phone="+1-555-0124"
        )

        print(f"Creating test user: {user.name}")
        
        # First, create an auth user
        auth_response = supabase_admin.auth.admin.create_user({
            'email': user.email,
            'password': 'Test123!',  # Temporary password
            'email_confirm': True  # Auto-confirm email
        })
        
        if not auth_response:
            print("Failed to create auth user")
            return None
        
        auth_user_id = auth_response.user.id
        print(f"Created auth user with ID: {auth_user_id}")
        
        # Convert date_of_birth to string and add UUID
        user_dict = user.model_dump()  # Using model_dump instead of deprecated dict()
        if user_dict.get('date_of_birth'):
            user_dict['date_of_birth'] = user_dict['date_of_birth'].isoformat()
        
        # Use the auth user's UUID
        user_dict['id'] = auth_user_id
        user_dict['created_at'] = datetime.utcnow().isoformat()
        
        # Insert into Supabase
        result = supabase_admin.table("users").insert(user_dict).execute()
        
        if result.data and len(result.data) > 0:
            user_data = result.data[0]
            print(f"Successfully created user with ID: {user_data['id']}")
            print("User details:", user_data)
            return user_data["id"]
        else:
            print("Failed to create user")
            return None

    except Exception as e:
        print(f"Error creating test user: {str(e)}")
        return None

if __name__ == "__main__":
    user_id = create_test_user()
    if user_id:
        print("\nYou can now use this user ID for testing:")
        print(f"User ID: {user_id}") 