#!/usr/bin/env python3
"""
Debug script to verify .env file is being read correctly
"""
import os
from dotenv import load_dotenv

print("🔍 Debugging .env file...")
print("=" * 50)

# Check if .env file exists
if os.path.exists('.env'):
    print("✅ .env file found")
    
    # Read and display .env file content (first 20 chars of each line for security)
    print("\n📄 .env file content:")
    with open('.env', 'r') as f:
        lines = f.readlines()
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    display_value = value[:20] + "..." if len(value) > 20 else value
                    print(f"   Line {i}: {key}={display_value}")
                else:
                    print(f"   Line {i}: {line}")
else:
    print("❌ .env file NOT found in current directory!")
    print("   Current directory:", os.getcwd())
    print("   Expected location: .env")
    exit(1)

print("\n🔄 Loading .env file...")
load_dotenv()

print("\n🔍 Checking environment variables:")
env_vars = {
    'SUPABASE_URL': os.getenv('SUPABASE_URL'),
    'SUPABASE_KEY': os.getenv('SUPABASE_KEY'),
    'SUPABASE_SERVICE_ROLE_KEY': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY')
}

all_good = True
for key, value in env_vars.items():
    if value:
        display_value = value[:20] + "..." if len(value) > 20 else value
        print(f"   ✅ {key}: {display_value}")
    else:
        print(f"   ❌ {key}: NOT SET")
        all_good = False

print("=" * 50)
if all_good:
    print("🎉 All environment variables are properly set!")
    print("You can now run: python run.py")
else:
    print("❌ Some environment variables are missing!")
    print("Check your .env file format and content.")
    
    print("\n💡 Your .env file should contain exactly these 4 lines:")
    print("SUPABASE_URL=https://splrdvpkhvdkqouduxje.supabase.co")
    print("SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHJkdnBraHZka3FvdWR1eGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODcyMjQsImV4cCI6MjA2NzI2MzIyNH0.acsA4tNfpe9uqEnt2MqBNIiQOLWbKLXOg_dvxJU49jA")
    print("SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHJkdnBraHZka3FvdWR1eGplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY4NzIyNCwiZXhwIjoyMDY3MjYzMjI0fQ.ugWv78EFoP0MbdpkRaNy2UKq-STAPgdRkSUkUyEZTfs")
    print("OPENAI_API_KEY=your_openai_api_key_here") 