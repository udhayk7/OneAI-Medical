#!/usr/bin/env python3
"""
Quick script to verify .env file is properly configured
"""
import os
from dotenv import load_dotenv

def check_env():
    """Check if .env file exists and has required variables"""
    print("Checking .env configuration...")
    print("=" * 40)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found in current directory!")
        print("Make sure to create .env file in the same directory as this script")
        return False
    
    print("✅ .env file found")
    
    # Load environment variables
    load_dotenv()
    
    # Check required variables
    required_vars = {
        'SUPABASE_URL': os.getenv('https://splrdvpkhvdkqouduxje.supabase.co'),
        'SUPABASE_KEY': os.getenv('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHJkdnBraHZka3FvdWR1eGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODcyMjQsImV4cCI6MjA2NzI2MzIyNH0.acsA4tNfpe9uqEnt2MqBNIiQOLWbKLXOg_dvxJU49jA'),
        'SUPABASE_SERVICE_ROLE_KEY': os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    }
    
    all_good = True
    
    for var_name, var_value in required_vars.items():
        if var_value:
            # Show first 20 characters for security
            display_value = var_value[:20] + "..." if len(var_value) > 20 else var_value
            print(f"✅ {var_name}: {display_value}")
        else:
            print(f"❌ {var_name}: Missing or empty")
            all_good = False
    
    print("=" * 40)
    
    if all_good:
        print("🎉 All environment variables are properly configured!")
        print("You can now run: python run.py")
        return True
    else:
        print("❌ Some environment variables are missing. Please check your .env file.")
        return False

if __name__ == "__main__":
    check_env() 