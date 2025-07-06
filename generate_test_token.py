from datetime import datetime, timedelta
import uuid
from config import supabase_admin

def generate_test_data():
    try:
        # First create a test user
        user_id = str(uuid.uuid4())
        user_result = supabase_admin.table('users').insert({
            'id': user_id,
            'name': 'Test Patient',
            'email': 'test@example.com',
            'created_at': datetime.utcnow().isoformat()
        }).execute()

        if not user_result.data:
            print("Failed to create test user")
            return

        # Generate a test token
        token_code = "TEST1234"
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(days=7)  # Token valid for 7 days

        # Insert token into Supabase
        token_result = supabase_admin.table('tokens').insert({
            'token_code': token_code,
            'patient_id': user_id,
            'created_at': created_at.isoformat(),
            'expires_at': expires_at.isoformat()
        }).execute()

        if token_result.data:
            print(f"""
Test data generated successfully!
User ID: {user_id}
Token: {token_code}
Valid until: {expires_at.isoformat()}
            """)
        else:
            print("Failed to generate test token")

    except Exception as e:
        print(f"Error generating test data: {str(e)}")

if __name__ == "__main__":
    generate_test_data() 